// --- Start of file: hooks/useStoryGeneration.js ---

import { useCallback, useRef } from 'react';
import { geminiApi, utilityGenerator, storyOrchestrator, storyService } from '../services';

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
        messages, characters, contextSettings, aiSettings, worldState, storyId, vectorIndices, assets,
        setMessages, setCharacters, setWorldState, setStoryTitle, setVectorIndices, setRetrievedMemories, setContextInfo,
        setLastAiImageAssetChoice,
    } = storyDataState;

    const { isProcessing, setIsProcessing, setLatestEmotionAnalysis } = uiState;
    const { fetchStoryList, handleNewScene: persistenceHandleNewScene } = persistenceHandlers;

    const abortControllerRef = useRef(null);

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

    const _orchestrateStoryGeneration = useCallback(async (promptType, content, currentHistory, currentStoryId, overrideWorldState = null) => {
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsProcessing(true);
        setRetrievedMemories([]);
        
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
- 핵심 규칙: ${(contextSettings.worldview?.rules || []).map(r => `- ${r.keyword}: ${r.description}`).join('\\n') || '미설정'}
`;
                const [systemTokens, worldviewTokens, worldTokens, memoryTokens, loreTokens] = await Promise.all([
                    geminiApi.countTokens(aiSettings.systemInstruction, aiSettings.mainModel, signal),
                    geminiApi.countTokens(worldviewText, aiSettings.mainModel, signal),
                    geminiApi.countTokens(JSON.stringify({ situation: contextSettings.situation }), aiSettings.mainModel, signal),
                    geminiApi.countTokens(retrievedContext.join('\\n\\n'), aiSettings.mainModel, signal),
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

            const storyData = { characters, contextSettings, aiSettings, worldState: effectiveWorldState, worldviewText, assets };
            const retrievedContext = retrievedItems.map(item => item.text);
            
            // --- 1. 텍스트 생성 ---
            const { data: aiResultData, logEntry } = await storyOrchestrator.generateResponse(storyData, promptType, content, shortTermMemory, retrievedContext, signal);
            addApiLogEntry(logEntry);

            const finalUserMessage = { ...content, status: 'sent', id: Date.now() };
            const responseContentForPostProcessing = aiResultData.style === 'Novel' ? aiResultData.content.map(c => c.text || c.line).join(' ') : aiResultData.content;
            
            let attachedImageUrl = null;
            let selectedFileNameForDebug = null;

            // --- 2. 이미지 선택 (조건부) ---
            if (aiSettings.enableImageGeneration && assets && assets.length > 0) {
                setLastAiImageAssetChoice({ choice: 'pending...', analyzedText: responseContentForPostProcessing }); 
                try {
                    const fileNames = assets.map(a => a.fileName);
                    // [BUG FIX] 채팅 모드에서는 AI가 직접 이미지 파일명을 반환하므로, 그 값을 우선적으로 사용합니다.
                    const imageChoiceFromAi = aiResultData.style === 'Chat' ? aiResultData.attachedImage : null;
                    
                    if (imageChoiceFromAi) {
                        selectedFileNameForDebug = imageChoiceFromAi;
                    } else {
                        const { fileName, logEntry: imageSelectLog } = await utilityGenerator.selectBestImage(responseContentForPostProcessing, fileNames, aiSettings.auxModel, aiSettings.safetySettings);
                        addApiLogEntry(imageSelectLog);
                        selectedFileNameForDebug = fileName;
                    }
                    
                    setLastAiImageAssetChoice({ choice: selectedFileNameForDebug || 'none', analyzedText: responseContentForPostProcessing }); 

                    let finalAsset = null;
                    if (selectedFileNameForDebug && selectedFileNameForDebug.toLowerCase() !== 'none') {
                        finalAsset = assets.find(a => a.fileName === selectedFileNameForDebug);
                    }
                    if (!finalAsset) {
                        finalAsset = assets.find(a => {
                            const nameOnly = a.fileName.split('.').slice(0, -1).join('.').toLowerCase().trim();
                            return nameOnly === 'default' || nameOnly === 'none';
                        });
                    }
                    if (finalAsset) {
                        attachedImageUrl = finalAsset.storageUrl;
                    }
                } catch (e) {
                    console.error("이미지 선택 AI 호출 실패 또는 처리 중 오류:", e);
                    setLastAiImageAssetChoice({ choice: `error: ${e.message}`, analyzedText: responseContentForPostProcessing });
                    const fallbackAsset = assets.find(a => {
                        const nameOnly = a.fileName.split('.').slice(0, -1).join('.').toLowerCase().trim();
                        return nameOnly === 'default' || nameOnly === 'none';
                    });
                    if (fallbackAsset) {
                        attachedImageUrl = fallbackAsset.storageUrl;
                    }
                }
            } else {
                setLastAiImageAssetChoice({ choice: null, analyzedText: null });
            }

            const finalAiMessage = { 
                id: Date.now() + 1, 
                sender: 'ai', 
                style: aiResultData.style, 
                content: aiResultData.content, 
                attachedImageUrl: attachedImageUrl, // Top-level for Chat mode
                ...(aiResultData.title && { title: aiResultData.title }), 
                isSummarized: false,
                status: 'sent'
            };
            
            // [BUG FIX] 소설 모드일 경우, 이미지 URL을 content 배열의 첫 번째 요소에 주입합니다.
            if (finalAiMessage.style === 'Novel' && attachedImageUrl && Array.isArray(finalAiMessage.content) && finalAiMessage.content.length > 0) {
                finalAiMessage.content[0].attachedImageUrl = attachedImageUrl;
                // 혼동을 막기 위해 최상위 속성은 삭제합니다.
                delete finalAiMessage.attachedImageUrl;
            }

            setMessages(prev => [...prev.filter(m => m.id !== content.id), finalAiMessage]);
            
            if (promptType !== 'reroll') {
                await storyService.addMessage(currentStoryId, finalUserMessage);
            }
            await storyService.addMessage(currentStoryId, finalAiMessage);

            // --- 3. 후처리 (시간, 목표, 감정) ---
            const recentEventsText = responseContentForPostProcessing;
            
            let finalWorldState = effectiveWorldState;
            if (promptType !== 'new_scene' && recentEventsText) {
                try {
                    const { data: timeData, logEntry: timeLog } = await utilityGenerator.deduceTime(recentEventsText, finalWorldState, aiSettings.auxModel, signal);
                    addApiLogEntry(timeLog);
                    const { elapsedMinutes, weather } = timeData;
                    let newMinute = Math.round(finalWorldState.minute + elapsedMinutes);
                    let newHour = finalWorldState.hour + Math.floor(newMinute / 60);
                    newMinute %= 60;
                    let newDay = finalWorldState.day + Math.floor(newHour / 24);
                    newHour %= 24;
                    finalWorldState = { day: newDay, hour: newHour, minute: newMinute, weather: weather || finalWorldState.weather };
                    setWorldState(finalWorldState);
                } catch (e) {
                    console.error("시간 추론 후처리 실패:", e);
                }
            }
            
            let charactersWithUpdates = [...characters];
            if (aiSettings.enableDynamicEvaluation) {
                const activeNpcNames = new Set(aiResultData.style === 'Novel' ? aiResultData.content.filter(c => c.type === 'dialogue' && c.character).map(c => c.character.trim()) : []);
                const goalPromises = characters.map(async (char) => {
                    if (!char.isUser && activeNpcNames.has(char.name.trim())) {
                        try {
                            const { data, logEntry } = await utilityGenerator.updatePersonalGoals(char, recentEventsText, aiSettings.auxModel, signal);
                            addApiLogEntry(logEntry);
                            return { ...char, goals: data.goals };
                        } catch (goalError) { console.error(`${char.name}의 목표 업데이트 오류:`, goalError); }
                    }
                    return char;
                });
                charactersWithUpdates = await Promise.all(goalPromises);
                
                let emotionAnalysesForState = {};
                const emotionPromises = charactersWithUpdates.map(async (char) => {
                    if (!char.isUser) {
                        try {
                            const historyForEmotion = [...currentHistory, finalAiMessage].slice(-4);
                            const { data, logEntry } = await utilityGenerator.analyzeEmotion(char, contextSettings.situation, historyForEmotion, aiSettings.auxModel, signal);
                            addApiLogEntry(logEntry);
                            emotionAnalysesForState[char.id] = data;
                        } catch (e) { console.error(`${char.name} 감정 분석 실패:`, e); }
                    }
                });
                await Promise.all(emotionPromises);
                setLatestEmotionAnalysis(emotionAnalysesForState);
            } else {
                charactersWithUpdates = characters.map(char => ({ ...char, goals: { primaryGoal: '', alternativeGoal: '' } }));
                setLatestEmotionAnalysis(null);
            }
            setCharacters(charactersWithUpdates);

            if (promptType === 'new_scene' && finalAiMessage.title) {
                setStoryTitle(finalAiMessage.title);
                await storyService.saveStory(currentStoryId, { title: finalAiMessage.title });
                await fetchStoryList();
            }

            await _addEntryToIndex('sceneIndex', { id: `L0_${finalAiMessage.id}`, text: `[과거 장면] ${recentEventsText}`, level: 0, source_ids: [finalAiMessage.id.toString()] }, currentStoryId);
            
            const charactersToSave = JSON.parse(JSON.stringify(charactersWithUpdates));
            if (Array.isArray(charactersToSave.dailySchedule)) {
                charactersToSave.dailySchedule = JSON.stringify(charactersToSave.dailySchedule);
            }
            await storyService.saveStory(currentStoryId, { characters: charactersToSave, worldState: finalWorldState });

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
    }, [characters, contextSettings, aiSettings, worldState, assets, searchVectorIndices, _addEntryToIndex, fetchStoryList, addApiLogEntry, setIsProcessing, setRetrievedMemories, setContextInfo, setWorldState, setCharacters, setStoryTitle, showToast, setLatestEmotionAnalysis, setMessages, setLastAiImageAssetChoice]);

    const handleSendMessage = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const tempMessage = { id: `temp_${Date.now()}`, sender: 'player', text: text.trim(), isSummarized: false, status: 'pending' };
        const newHistory = [...messages]; 
        _orchestrateStoryGeneration('send', tempMessage, newHistory, storyId);
    }, [isProcessing, storyId, messages, _orchestrateStoryGeneration]);

    const handleResend = useCallback((message) => {
        if (!message || isProcessing || !storyId) return;
        showToast("마지막 입력을 다시 전송합니다...");
        const tempMessage = { ...message, id: `temp_${Date.now()}`, status: 'pending' };
        const historyWithoutFailed = messages.filter(m => m.id !== message.id);
        _orchestrateStoryGeneration('resend', tempMessage, historyWithoutFailed, storyId);
    }, [isProcessing, storyId, messages, _orchestrateStoryGeneration, showToast]);

    const handleReroll = useCallback(async () => {
        if (isProcessing || !storyId) return;
        const lastAiMessageIndex = messages.findLastIndex(msg => msg.sender === 'ai');
        if (lastAiMessageIndex === -1) return;
        const lastAiMessage = messages[lastAiMessageIndex];
        const lastPlayerMessage = messages.slice(0, lastAiMessageIndex).findLast(msg => msg.sender === 'player');
        if (lastAiMessage && lastPlayerMessage) {
            try {
                const historyForReroll = messages.slice(0, lastAiMessageIndex);
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
            _orchestrateStoryGeneration('continue', { text: contentForContinue }, messages, storyId);
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
                await _orchestrateStoryGeneration('new_scene', { text: '' }, [], newId, initialWorldState);
            } catch (error) {
                showToast(`새 장면 AI 생성 실패: ${error.message}`, 'error');
                setIsProcessing(false);
            }
        }
    }, [isProcessing, persistenceHandleNewScene, characters, contextSettings, _addEntryToIndex, _orchestrateStoryGeneration, showToast, setIsProcessing]);
    
    const handleIntervention = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const tempMessage = { id: `temp_${Date.now()}`, sender: 'player', text: text.trim(), isSummarized: false, isOoc: true, status: 'pending' };
        _orchestrateStoryGeneration('intervene', tempMessage, messages, storyId);
    }, [isProcessing, storyId, messages, _orchestrateStoryGeneration]);

    const handleCancelGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);


    return {
        _addEntryToIndex,
        handleSendMessage,
        handleResend,
        handleReroll,
        handleContinue,
        handleNewScene,
        handleIntervention,
        handleCancelGeneration,
    };
};
