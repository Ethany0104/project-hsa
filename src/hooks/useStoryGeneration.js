// src/hooks/useStoryGeneration.js

import { useCallback, useRef } from 'react';
import { geminiApi, utilityGenerator, storyOrchestrator, storyService } from '../services';
import { BUILTIN_TOOLS } from '../components/forge/builtinTools';
import { calculateDamage } from '../components/isc/logic/damageCalculator';
import { randomLootGenerator } from '../components/isc/logic/lootGenerator';
import { updateRelationship } from '../components/isc/logic/relationshipManager';


const MAX_EMBEDDING_TEXT_LENGTH = 4000;

const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB) return 0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

export const useStoryGeneration = (storyDataState, uiState, showToast, addApiLogEntry, persistenceHandlers) => {
    const {
        messages, characters, contextSettings, aiSettings, worldState, storyId, vectorIndices, assets, customTools,
        setMessages, setCharacters, setWorldState, setStoryTitle, setVectorIndices, setRetrievedMemories, setContextInfo,
        setLastAiImageAssetChoice,
    } = storyDataState;

    const { isProcessing, setIsProcessing, setLatestEmotionAnalysis } = uiState;
    const { fetchStoryList, handleNewScene: persistenceHandleNewScene } = persistenceHandlers;

    const abortControllerRef = useRef(null);
    const fullHistoryRef = useRef([]);

    const _addEntryToIndex = useCallback(async (indexName, entry, currentStoryId) => {
        if (!currentStoryId || !entry || !indexName) return;
        
        try {
            if (!entry.text || entry.text.trim() === '') return;
            
            const textToEmbed = entry.text.length > MAX_EMBEDDING_TEXT_LENGTH ? entry.text.substring(0, MAX_EMBEDDING_TEXT_LENGTH) : entry.text;
            const vector = await geminiApi.embedContent(textToEmbed);
            const newEntry = { ...entry, text: textToEmbed, vector };
            
            await storyService.addIndexEntry(currentStoryId, indexName, newEntry);
            
            setVectorIndices(prev => {
                const updatedIndex = [...(prev[indexName] || [])];
                const existingIndex = updatedIndex.findIndex(item => item.id === newEntry.id);
                if (existingIndex > -1) updatedIndex[existingIndex] = newEntry;
                else updatedIndex.push(newEntry);
                return { ...prev, [indexName]: updatedIndex };
            });
        } catch (error) { 
            console.error(`[FATAL] 인덱스 생성 실패 (${indexName}, ID: ${entry.id}):`, error);
            showToast(`검색 인덱스 생성에 실패했습니다. (ID: ${entry.id})`, 'error');
        }
    }, [setVectorIndices, showToast]);

    const searchVectorIndices = useCallback(async (queryText, topK) => {
        const allEntries = [...(vectorIndices.scene || []), ...(vectorIndices.lore || []), ...(vectorIndices.character || [])];
        if (allEntries.length === 0 || !queryText) return [];
        const queryVector = await geminiApi.embedContent(queryText);
        const scoredItems = allEntries.map(item => ({ ...item, score: cosineSimilarity(item.vector, queryVector) }));
        scoredItems.sort((a, b) => b.score - a.score);
        return scoredItems.slice(0, topK);
    }, [vectorIndices]);

    const _orchestrateStoryGeneration = useCallback(async (promptType, content, currentHistory, currentStoryId, overrideWorldState = null, toolResultPayload = null) => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsProcessing(true);
        if (!toolResultPayload) {
            setRetrievedMemories([]);
            fullHistoryRef.current = [];
        }
        
        try {
            if (promptType === 'send' || promptType === 'intervene' || promptType === 'resend') {
                setMessages(prev => [...prev, content]);
            }
            
            const effectiveWorldState = overrideWorldState || worldState;

            const _getContextData = async (queryText, history, currentCharacters) => {
                const TOTAL_BUDGET = aiSettings.maxContextTokens * 0.95; 
                const retrievedItems = await searchVectorIndices(queryText, aiSettings.retrievalTopK);
                const retrievedContext = retrievedItems.map(item => item.text);
                const worldviewText = `
### 세계관 설정 (Worldview)
- 장르: ${contextSettings.worldview?.genre || '미설정'}
- 상세: ${contextSettings.worldview?.details || '미설정'}
- 핵심 규칙: ${(contextSettings.worldview?.rules || []).map(r => `- ${r.keyword}: ${r.description}`).join('\n') || '미설정'}
`;
                const [systemTokens, worldviewTokens, worldTokens, memoryTokens, loreTokens] = await Promise.all([
                    geminiApi.countTokens(aiSettings.systemInstruction, aiSettings.mainModel, signal),
                    geminiApi.countTokens(worldviewText, aiSettings.mainModel, signal),
                    geminiApi.countTokens(JSON.stringify({ situation: contextSettings.situation }), aiSettings.mainModel, signal),
                    geminiApi.countTokens(retrievedContext.join('\n\n'), aiSettings.mainModel, signal),
                    geminiApi.countTokens(JSON.stringify(currentCharacters.map(({profileImageUrl, ...rest}) => rest)), aiSettings.mainModel, signal),
                ]);
                const fixedContextTokens = systemTokens + worldviewTokens + worldTokens + memoryTokens + loreTokens;
                const HISTORY_BUDGET = TOTAL_BUDGET - fixedContextTokens;
                if (HISTORY_BUDGET <= 0) throw new Error("고정 컨텍스트가 너무 큽니다.");
                let shortTermMemory = history.slice(-aiSettings.shortTermMemoryTurns);
                let historyTokens = shortTermMemory.length > 0 ? await geminiApi.countTokens(JSON.stringify(shortTermMemory), aiSettings.mainModel, signal) : 0;
                while (historyTokens > HISTORY_BUDGET && shortTermMemory.length > 1) {
                    shortTermMemory.shift();
                    historyTokens = await geminiApi.countTokens(JSON.stringify(shortTermMemory), aiSettings.mainModel, signal);
                }
                const contextTokenInfo = { system: systemTokens, worldview: worldviewTokens, world: worldTokens, memory: memoryTokens, lore: loreTokens, chat: historyTokens, total: fixedContextTokens + historyTokens };
                return { shortTermMemory, retrievedItems, contextTokenInfo, worldviewText };
            };

            const queryText = (promptType === 'send' || promptType === 'reroll' || promptType === 'intervene' || promptType === 'resend') ? content.text : JSON.stringify(content);
            const { shortTermMemory, retrievedItems, contextTokenInfo, worldviewText } = await _getContextData(queryText, currentHistory, characters);
            setContextInfo(contextTokenInfo);
            setRetrievedMemories(retrievedItems);

            const storyData = { characters, contextSettings, aiSettings, worldState: effectiveWorldState, worldviewText, assets, customTools };
            const retrievedContext = retrievedItems.map(item => item.text);
            
            const { data: aiResultData, logEntry, rawResponse } = await storyOrchestrator.generateResponse(storyData, promptType, content, shortTermMemory, retrievedContext, signal, toolResultPayload);
            addApiLogEntry(logEntry);

            const functionCall = rawResponse.candidates?.[0]?.content?.parts?.[0]?.functionCall;

            if (functionCall) {
                const functionName = functionCall.name.replace('_', ':');
                const functionArgs = functionCall.args;
                const allTools = [...(aiSettings.enableBuiltInTools ? BUILTIN_TOOLS : []), ...customTools];
                const toolSpec = allTools.find(t => t.name === functionName);

                if (!toolSpec) throw new Error(`알 수 없는 툴 '${functionName}'을 호출했습니다.`);

                fullHistoryRef.current.push(rawResponse.candidates[0].content);

                if (toolSpec.type === 'logic') {
                    let logicResult;
                    switch (functionName) {
                        case 'builtin:calculateDamage': logicResult = calculateDamage(functionArgs); break;
                        case 'builtin:randomLootGenerator': logicResult = randomLootGenerator(functionArgs); break;
                        case 'builtin:updateRelationship': logicResult = updateRelationship(functionArgs); break;
                        default: throw new Error(`실행할 수 없는 로직 스크립트: ${functionName}`);
                    }
                    
                    const newToolResultPayload = {
                        functionCall,
                        functionResponse: {
                            name: functionCall.name,
                            response: { name: functionCall.name, content: JSON.stringify(logicResult) }
                        }
                    };
                    return _orchestrateStoryGeneration(promptType, content, currentHistory, currentStoryId, effectiveWorldState, newToolResultPayload);

                } else {
                    const componentMessage = {
                        id: Date.now() + 1,
                        sender: 'ai',
                        style: 'Novel',
                        content: [{
                            type: 'interactiveComponent',
                            componentSpec: {
                                component: functionName,
                                data: functionArgs
                            }
                        }],
                        isSummarized: false,
                        status: 'pending_action'
                    };
                    setMessages(prev => [...prev.filter(m => m.id !== content.id), componentMessage]);
                    await storyService.addMessage(currentStoryId, componentMessage);
                }

            } else {
                const responseContentForPostProcessing = aiResultData.style === 'Novel' ? aiResultData.content.map(c => c.text || c.line).join(' ') : aiResultData.content;
                let attachedImageUrl = null;
                
                if (aiSettings.enableImageGeneration && assets.length > 0 && responseContentForPostProcessing) {
                    const { fileName: chosenImage, logEntry: imageLog } = await utilityGenerator.selectBestImage(responseContentForPostProcessing, assets.map(a => a.fileName), aiSettings.auxModel, aiSettings.safetySettings);
                    addApiLogEntry(imageLog);
                    setLastAiImageAssetChoice({ choice: chosenImage, analyzedText: responseContentForPostProcessing.substring(0, 500) });
                    if (chosenImage && chosenImage !== 'none') {
                        const matchedAsset = assets.find(a => a.fileName === chosenImage);
                        if (matchedAsset) attachedImageUrl = matchedAsset.storageUrl;
                    }
                }

                const finalAiMessage = { 
                    id: Date.now() + 1, 
                    sender: 'ai', 
                    style: aiResultData.style, 
                    content: aiResultData.content, 
                    attachedImageUrl,
                    ...(aiResultData.title && { title: aiResultData.title }), 
                    isSummarized: false,
                    status: 'sent'
                };
                
                if (aiResultData.title) {
                    setStoryTitle(aiResultData.title);
                    // --- [수정] 새 장면 시작 시, AI가 생성한 제목을 즉시 저장합니다. ---
                    if (promptType === 'new_scene') {
                        try {
                            await storyService.saveStory(currentStoryId, { title: aiResultData.title });
                            await fetchStoryList(); // 목록을 새로고침하여 즉시 반영
                            showToast(`'${aiResultData.title}' 장면이 자동으로 저장되었습니다.`, 'success');
                        } catch (error) {
                            console.error("새 장면 제목 자동 저장 실패:", error);
                            showToast("새 장면 제목 자동 저장에 실패했습니다.", "error");
                        }
                    }
                }

                const { data: timeData, logEntry: timeLog } = await utilityGenerator.deduceTime(responseContentForPostProcessing, effectiveWorldState, aiSettings.auxModel);
                addApiLogEntry(timeLog);
                const newWorldState = { ...effectiveWorldState };
                let totalMinutes = newWorldState.hour * 60 + newWorldState.minute + (timeData.elapsedMinutes || 0);
                newWorldState.day += Math.floor(totalMinutes / 1440);
                totalMinutes %= 1440;
                newWorldState.hour = Math.floor(totalMinutes / 60);
                newWorldState.minute = totalMinutes % 60;
                newWorldState.weather = timeData.weather || newWorldState.weather;
                setWorldState(newWorldState);

                const finalUserMessage = { ...content, status: 'sent' };

                if (promptType === 'reroll') {
                    setMessages(prev => {
                        const lastAiIndex = prev.findLastIndex(m => m.sender === 'ai');
                        if (lastAiIndex !== -1) {
                            return [...prev.slice(0, lastAiIndex), finalAiMessage];
                        }
                        return [...prev, finalAiMessage];
                    });
                } else {
                    setMessages(prev => [...prev.filter(m => m.id !== content.id), finalUserMessage, finalAiMessage]);
                }

                if (promptType !== 'reroll') {
                    const messageToSave = { ...finalUserMessage, docId: `msg_${content.id}` };
                    await storyService.addMessage(currentStoryId, messageToSave);
                }
                const aiMessageToSave = { ...finalAiMessage, status: 'sent', docId: `msg_${finalAiMessage.id}` };
                await storyService.addMessage(currentStoryId, aiMessageToSave);

                const textForEmbedding = aiResultData.style === 'Novel' ? finalAiMessage.content.map(c => c.text || c.line).join(' ') : finalAiMessage.content;
                if (textForEmbedding) {
                    const sourceIds = [];
                    if (content && content.id) {
                        sourceIds.push(content.id.toString());
                    }
                    sourceIds.push(finalAiMessage.id.toString());
                    await _addEntryToIndex('sceneIndex', { id: `L0_scene_${finalAiMessage.id}`, text: textForEmbedding, level: 0, source_ids: sourceIds }, currentStoryId);
                }

                if (aiSettings.enableDynamicEvaluation) {
                    const recentHistory = [...currentHistory, content, finalAiMessage];
                    const emotionAnalyses = {};
                    for (const char of characters.filter(c => !c.isUser)) {
                        const { data: emotionData, logEntry: emotionLog } = await utilityGenerator.analyzeEmotion(char, contextSettings.situation, recentHistory, aiSettings.auxModel);
                        addApiLogEntry(emotionLog);
                        emotionAnalyses[char.id] = emotionData;
                        const { data: goalData, logEntry: goalLog } = await utilityGenerator.updatePersonalGoals(char, responseContentForPostProcessing, aiSettings.auxModel);
                        addApiLogEntry(goalLog);
                        setCharacters(prev => prev.map(c => c.id === char.id ? { ...c, goals: goalData.goals } : c));
                    }
                    setLatestEmotionAnalysis(emotionAnalyses);
                }
            }

        } catch (error) {
            console.error("[CRITICAL] _orchestrateStoryGeneration에서 처리되지 않은 예외 발생:", error);
            setMessages(prev => prev.filter(m => m.id !== content.id));
            if (error.name === 'AbortError') {
                showToast("AI 응답 생성을 취소했습니다.", "default");
            } else {
                showToast(`치명적인 오류 발생: ${error.message}`, 'error');
            }
        } finally {
            setIsProcessing(false);
            abortControllerRef.current = null;
        }
    }, [
        characters, contextSettings, aiSettings, worldState, assets, customTools,
        searchVectorIndices, _addEntryToIndex, fetchStoryList, addApiLogEntry,
        setIsProcessing, setRetrievedMemories, setContextInfo, setWorldState,
        setCharacters, setStoryTitle, showToast, setLatestEmotionAnalysis, setMessages,
        setLastAiImageAssetChoice
    ]);

    const handleSendMessage = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const tempMessage = { id: Date.now(), sender: 'player', text: text.trim(), isSummarized: false, status: 'pending' };
        fullHistoryRef.current = [...messages];
        _orchestrateStoryGeneration('send', tempMessage, messages, storyId);
    }, [isProcessing, storyId, messages, _orchestrateStoryGeneration]);

    const handleReroll = useCallback(async () => {
        if (isProcessing || !storyId) return;
        const lastAiMessageIndex = messages.findLastIndex(msg => msg.sender === 'ai');
        if (lastAiMessageIndex === -1) return;
        const lastAiMessage = messages[lastAiMessageIndex];
        const lastPlayerMessage = messages.slice(0, lastAiMessageIndex).findLast(msg => msg.sender === 'player');
        if (lastAiMessage && lastPlayerMessage) {
            try {
                const historyForReroll = messages.slice(0, lastAiMessageIndex);
                fullHistoryRef.current = historyForReroll;
                await storyService.deleteMessage(storyId, lastAiMessage.docId);
                _orchestrateStoryGeneration('reroll', lastPlayerMessage, historyForReroll, storyId);
            } catch (error) {
                showToast("리롤 중 오류 발생", 'error');
            }
        }
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId, showToast]);
    
    const handleContinue = useCallback(() => {
        if (isProcessing || !storyId) return;
        const lastAiMessage = messages.findLast(msg => msg.sender === 'ai');
        if (lastAiMessage) {
            const contentForContinue = lastAiMessage.style === 'Novel' ? JSON.stringify(lastAiMessage.content) : lastAiMessage.content;
            fullHistoryRef.current = [...messages];
            const continueContent = { id: Date.now(), text: contentForContinue };
            _orchestrateStoryGeneration('continue', continueContent, messages, storyId);
        }
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId]);
    
    const handleNewScene = useCallback(async () => {
        if (isProcessing) return;
        const newId = await persistenceHandleNewScene();
        if (newId) {
            try {
                for (const char of characters) {
                    if (!char.isUser && char.formativeEvent) {
                        const profileText = `[페르소나 프로필] 이름: ${char.name}. 결정적 경험: ${char.formativeEvent}. 핵심 원칙: ${char.corePrinciple}. 코어 디자이어: ${char.coreDesire}.`;
                        await _addEntryToIndex('characterIndex', { id: `L0_char_${char.id}`, text: profileText, level: 0, source_ids: [char.id.toString()] }, newId);
                    }
                }
                for (const detail of contextSettings.details) {
                    const text = `[${detail.category}] ${detail.keyword}: ${detail.description}`;
                    await _addEntryToIndex('loreIndex', { id: `L0_lore_${detail.id}`, text: text, level: 0, source_ids: [detail.id.toString()] }, newId);
                }
                
                const [hour, minute] = contextSettings.startTime.split(':').map(Number);
                const initialWorldState = { day: 1, hour: isNaN(hour) ? 9 : hour, minute: isNaN(minute) ? 0 : minute, weather: contextSettings.startWeather || '실내' };
                fullHistoryRef.current = [];
                await _orchestrateStoryGeneration('new_scene', { text: '' }, [], newId, initialWorldState);
            } catch (error) {
                showToast(`새 장면 AI 생성 실패: ${error.message}`, 'error');
                setIsProcessing(false);
            }
        }
    }, [isProcessing, persistenceHandleNewScene, characters, contextSettings, _addEntryToIndex, _orchestrateStoryGeneration, showToast, setIsProcessing]);
    
    const handleIntervention = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const tempMessage = { id: Date.now(), sender: 'player', text: text.trim(), isSummarized: false, isOoc: true, status: 'pending' };
        fullHistoryRef.current = [...messages];
        _orchestrateStoryGeneration('intervene', tempMessage, messages, storyId);
    }, [isProcessing, storyId, messages, _orchestrateStoryGeneration]);

    const handleCancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    const handleToolResult = useCallback((toolResult) => {
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.status !== 'pending_action') {
            console.error("잘못된 시점의 툴 결과 전송입니다.");
            return;
        }

        const componentSpec = lastMessage.content[0].componentSpec;
        if (!componentSpec) return;

        const newToolResultPayload = {
            functionCall: { name: componentSpec.component.replace(':', '_'), args: componentSpec.data },
            functionResponse: {
                name: componentSpec.component.replace(':', '_'),
                response: { name: componentSpec.component.replace(':', '_'), content: JSON.stringify(toolResult) }
            }
        };

        const userActionMessage = {
            id: Date.now(),
            sender: 'player',
            text: `[툴 응답: ${JSON.stringify(toolResult)}]`,
            isSummarized: false,
            status: 'sent'
        };
        const historyForNextStep = [...messages.slice(0, -1), userActionMessage];
        setMessages(historyForNextStep);
        storyService.addMessage(storyId, userActionMessage);

        fullHistoryRef.current = historyForNextStep;

        _orchestrateStoryGeneration('send', userActionMessage, historyForNextStep, storyId, null, newToolResultPayload);

    }, [messages, storyId, _orchestrateStoryGeneration, setMessages]);


    return {
        _addEntryToIndex,
        handleSendMessage,
        handleReroll,
        handleContinue,
        handleNewScene,
        handleIntervention,
        handleCancelGeneration,
        handleToolResult,
    };
};
