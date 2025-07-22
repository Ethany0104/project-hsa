// --- Start of file: hooks/useStoryGeneration.js ---

import { useCallback } from 'react';
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
        messages, characters, contextSettings, aiSettings, worldState, storyId, vectorIndices,
        setCharacters, setWorldState, setStoryTitle, setVectorIndices, setRetrievedMemories, setContextInfo,
        apiLog, pinnedItems,
    } = storyDataState;

    const { isProcessing, setIsProcessing, setLatestEmotionAnalysis } = uiState;
    const { fetchStoryList, handleLoadStory } = persistenceHandlers;

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

    const _orchestrateStoryGeneration = useCallback(async (promptType, content, currentStoryId, overrideWorldState = null) => {
        setIsProcessing(true);
        setRetrievedMemories([]);
        
        try {
            if (promptType === 'send' || promptType === 'intervene') {
                await storyService.addMessage(currentStoryId, content);
            }
            
            let currentHistory = (promptType === 'new_scene') ? [] : [...messages, content];
            
            const effectiveWorldState = overrideWorldState || worldState;

            const _getContextData = async (queryText, history, currentCharacters) => {
                const TOTAL_BUDGET = aiSettings.maxContextTokens * 0.95; 
                const retrievedItems = await searchVectorIndices(queryText, aiSettings.retrievalTopK);
                const retrievedContext = retrievedItems.map(item => item.text);
                const [systemTokens, worldTokens, memoryTokens, loreTokens] = await Promise.all([
                    geminiApi.countTokens(aiSettings.systemInstruction),
                    geminiApi.countTokens(JSON.stringify({ situation: contextSettings.situation })),
                    geminiApi.countTokens(retrievedContext.join('\n\n')),
                    geminiApi.countTokens(JSON.stringify(currentCharacters.map(({profileImageUrl, ...rest}) => rest))),
                ]);
                const fixedContextTokens = systemTokens + worldTokens + memoryTokens + loreTokens;
                const HISTORY_BUDGET = TOTAL_BUDGET - fixedContextTokens;

                if (HISTORY_BUDGET <= 0) throw new Error("고정 컨텍스트가 너무 큽니다.");
                
                let shortTermMemory = history.slice(-aiSettings.shortTermMemoryTurns);
                let historyTokens = shortTermMemory.length > 0 ? await geminiApi.countTokens(JSON.stringify(shortTermMemory)) : 0;
                while (historyTokens > HISTORY_BUDGET && shortTermMemory.length > 1) {
                    shortTermMemory.shift();
                    historyTokens = await geminiApi.countTokens(JSON.stringify(shortTermMemory));
                }
                
                const contextTokenInfo = { system: systemTokens, world: worldTokens, memory: memoryTokens, lore: loreTokens, chat: historyTokens, total: fixedContextTokens + historyTokens };
                return { shortTermMemory, retrievedItems, contextTokenInfo };
            };

            const queryText = (promptType === 'send' || promptType === 'reroll' || promptType === 'intervene') ? content.text : JSON.stringify(content);
            const { shortTermMemory, retrievedItems, contextTokenInfo } = await _getContextData(queryText, currentHistory, characters);
            setContextInfo(contextTokenInfo);
            setRetrievedMemories(retrievedItems);

            const storyData = { characters, contextSettings, aiSettings, worldState: effectiveWorldState };
            const retrievedContext = retrievedItems.map(item => item.text);
            const { data: aiResultData, logEntry: mainLog } = await storyOrchestrator.generateResponse(storyData, promptType, content, shortTermMemory, retrievedContext);
            addApiLogEntry(mainLog);

            let aiResponse;
            if (aiResultData.style === 'Chat') {
                aiResponse = { id: Date.now() + 1, sender: 'ai', style: 'Chat', text: aiResultData.response || "", ...(aiResultData.title && { title: aiResultData.title }), isSummarized: false };
            } else {
                aiResponse = { id: Date.now() + 1, sender: 'ai', style: 'Novel', content: aiResultData.content || [], ...(aiResultData.title && { title: aiResultData.title }), isSummarized: false };
            }
            
            await storyService.addMessage(currentStoryId, aiResponse);

            const responseContent = aiResponse.style === 'Novel' ? aiResponse.content : aiResponse.text;
            const recentEventsText = Array.isArray(responseContent) ? responseContent.map(c => c.text || c.line).join(' ') : responseContent;
            
            let finalWorldState = effectiveWorldState;
            // [LOGIC CHANGE] AI 응답 내용을 기반으로 시간 흐름을 계산합니다.
            if (promptType !== 'new_scene' && recentEventsText) {
                const { data: timeData, logEntry: timeLog } = await utilityGenerator.deduceTime(recentEventsText, finalWorldState, aiSettings.auxModel);
                addApiLogEntry(timeLog);
                const { elapsedMinutes, weather } = timeData;
                let newMinute = Math.round(finalWorldState.minute + elapsedMinutes);
                let newHour = finalWorldState.hour + Math.floor(newMinute / 60);
                newMinute %= 60;
                let newDay = finalWorldState.day + Math.floor(newHour / 24);
                newHour %= 24;
                finalWorldState = { day: newDay, hour: newHour, minute: newMinute, weather: weather || finalWorldState.weather };
                setWorldState(finalWorldState);
            }

            const activeNpcNames = new Set(Array.isArray(responseContent) ? responseContent.filter(c => c.type === 'dialogue' && c.character).map(c => c.character.trim()) : []);
            
            const charactersWithNewGoals = await Promise.all(characters.map(async (char) => {
                if (!char.isUser && activeNpcNames.has(char.name.trim())) {
                    try {
                        const { data, logEntry } = await utilityGenerator.updatePersonalGoals(char, recentEventsText, aiSettings.auxModel);
                        addApiLogEntry(logEntry);
                        return { ...char, goals: data.goals };
                    } catch (goalError) { console.error(`${char.name}의 목표 업데이트 오류:`, goalError); }
                }
                return char;
            }));
            
            let emotionAnalysesForState = {};
            const charactersWithEmotion = await Promise.all(charactersWithNewGoals.map(async (char) => {
                if (!char.isUser) {
                    try {
                        const historyForEmotion = [...currentHistory, aiResponse].slice(-4);
                        const { data, logEntry } = await utilityGenerator.analyzeEmotion(char, contextSettings.situation, historyForEmotion, aiSettings.auxModel);
                        addApiLogEntry(logEntry);
                        emotionAnalysesForState[char.id] = data;
                    } catch (e) { console.error(`${char.name} 감정 분석 실패:`, e); }
                }
                return char;
            }));
            setLatestEmotionAnalysis(emotionAnalysesForState);
            setCharacters(charactersWithEmotion);

            if (promptType === 'new_scene' && aiResponse.title) {
                setStoryTitle(aiResponse.title);
                await storyService.saveStory(currentStoryId, { title: aiResponse.title });
                await fetchStoryList();
            }

            await _addEntryToIndex('sceneIndex', { id: `L0_${aiResponse.id}`, text: `[과거 장면] ${recentEventsText}`, level: 0, source_ids: [aiResponse.id.toString()] }, currentStoryId);
            
            const charactersToSave = JSON.parse(JSON.stringify(charactersWithEmotion));
            charactersToSave.forEach(char => { if (Array.isArray(char.dailySchedule)) char.dailySchedule = JSON.stringify(char.dailySchedule); });
            await storyService.saveStory(currentStoryId, { characters: charactersToSave, worldState: finalWorldState });

        } catch (error) {
            showToast(`AI 응답 생성 실패: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [messages, characters, contextSettings, aiSettings, worldState, searchVectorIndices, _addEntryToIndex, fetchStoryList, addApiLogEntry, setIsProcessing, setRetrievedMemories, setContextInfo, setWorldState, setCharacters, setStoryTitle, showToast, setLatestEmotionAnalysis]);

    const handleSendMessage = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const userMessage = { id: Date.now(), sender: 'player', text: text.trim(), isSummarized: false };
        _orchestrateStoryGeneration('send', userMessage, storyId);
    }, [isProcessing, _orchestrateStoryGeneration, storyId]);

    const handleReroll = useCallback(async () => {
        if (isProcessing || !storyId) return;
        const lastAiMessageIndex = messages.findLastIndex(msg => msg.sender === 'ai');
        if (lastAiMessageIndex === -1) return;
        const lastAiMessage = messages[lastAiMessageIndex];
        const lastPlayerMessage = messages.slice(0, lastAiMessageIndex).findLast(msg => msg.sender === 'player');
        if (lastAiMessage && lastPlayerMessage) {
            setIsProcessing(true);
            try {
                await storyService.deleteMessage(storyId, lastAiMessage.docId);
                _orchestrateStoryGeneration('reroll', lastPlayerMessage, storyId);
            } catch (error) {
                showToast("리롤 중 오류 발생", 'error');
                setIsProcessing(false);
            }
        }
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId, setIsProcessing, showToast]);
    
    const handleContinue = useCallback(() => {
        if (isProcessing || !storyId) return;
        const lastAiMessage = messages.findLast(msg => msg.sender === 'ai');
        if (lastAiMessage) {
            const contentForContinue = lastAiMessage.style === 'Novel' ? JSON.stringify(lastAiMessage.content) : lastAiMessage.text;
            _orchestrateStoryGeneration('continue', { text: contentForContinue }, storyId);
        }
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId]);
    
    const handleNewScene = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const [hour, minute] = contextSettings.startTime.split(':').map(Number);
            const initialWorldState = { day: 1, hour: isNaN(hour) ? 9 : hour, minute: isNaN(minute) ? 0 : minute, weather: contextSettings.startWeather || '실내' };
            const charactersToSave = JSON.parse(JSON.stringify(characters));
            charactersToSave.forEach(char => { if (Array.isArray(char.dailySchedule)) char.dailySchedule = JSON.stringify(char.dailySchedule); });
            const newStoryData = { title: "새로운 장면", characters: charactersToSave, contextSettings, aiSettings, worldState: initialWorldState, apiLog, pinnedItems };
            const newId = await storyService.createNewStory(newStoryData);
            
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
            await fetchStoryList();
            await handleLoadStory(newId);
            await _orchestrateStoryGeneration('new_scene', { text: '' }, newId, initialWorldState);
        } catch (error) {
            showToast(`새 장면 생성 실패: ${error.message}`, 'error');
            setIsProcessing(false);
        }
    }, [isProcessing, characters, contextSettings, aiSettings, apiLog, pinnedItems, fetchStoryList, handleLoadStory, _orchestrateStoryGeneration, _addEntryToIndex, setIsProcessing, showToast]);
    
    const handleIntervention = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const interventionMessage = { id: Date.now(), sender: 'player', text: text.trim(), isSummarized: false, isOoc: true };
        _orchestrateStoryGeneration('intervene', interventionMessage, storyId);
    }, [isProcessing, _orchestrateStoryGeneration, storyId]);

    return {
        _addEntryToIndex,
        handleSendMessage,
        handleReroll,
        handleContinue,
        handleNewScene,
        handleIntervention,
    };
};
