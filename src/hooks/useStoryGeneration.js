import { useCallback } from 'react';
import { geminiService } from '../services/geminiService';
import { storyService } from '../services/firebaseService';
import { DEFAULT_WORLD_STATE } from '../constants/defaults';

const LEVEL_1_COMPRESSION_THRESHOLD = 20;
const LEVEL_2_COMPRESSION_THRESHOLD = 5;

const cosineSimilarity = (vecA, vecB) => {
    if (!vecA || !vecB) return 0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normB += vecB[i] * vecB[i];
        normA += vecA[i] * vecA[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * AI를 이용한 이야기 생성 및 관련 로직을 전담하는 커스텀 훅입니다.
 * @param {object} storyDataState - 이야기의 핵심 데이터 상태 객체
 * @param {object} uiState - UI 및 상호작용 관련 상태 객체
 * @param {function} showToast - 토스트 메시지를 표시하는 함수
 * @param {function} addApiLogEntry - API 로그를 추가하는 함수
 * @param {object} persistenceHandlers - useStoryPersistence 훅이 반환하는 핸들러 객체
 * @returns {object} 이야기 생성 관련 핸들러 함수들을 포함하는 객체
 */
export const useStoryGeneration = (storyDataState, uiState, showToast, addApiLogEntry, persistenceHandlers) => {
    // 상태 분리에 따른 변수 할당 수정
    const {
        messages, characters, lorebook, aiSettings, worldState, storyId, vectorIndices,
        setCharacters, setWorldState, setStoryTitle, setVectorIndices, setRetrievedMemories, setContextInfo
    } = storyDataState;

    const {
        isProcessing, pdChatHistory,
        setIsProcessing, setPdChatHistory, setIsPdChatProcessing
    } = uiState;

    const { fetchStoryList, handleLoadStory } = persistenceHandlers;

    const _addEntryToIndex = useCallback(async (indexName, entry, currentStoryId) => {
        if (!currentStoryId || !entry || !indexName) return;
        try {
            const vector = await geminiService.embedContent(entry.text);
            const newEntry = { ...entry, vector };
            await storyService.addIndexEntry(currentStoryId, indexName, newEntry);
            setVectorIndices(prev => {
                const updatedIndex = [...(prev[indexName] || [])];
                const existingIndex = updatedIndex.findIndex(item => item.id === newEntry.id);
                if (existingIndex > -1) updatedIndex[existingIndex] = newEntry;
                else updatedIndex.push(newEntry);
                return { ...prev, [indexName]: updatedIndex };
            });
        } catch (error) { console.error(`Error adding vector index entry to ${indexName} for ${entry.id}:`, error); }
    }, [setVectorIndices]);

    const searchVectorIndices = useCallback(async (queryText, topK) => {
        const allEntries = [...vectorIndices.scene, ...vectorIndices.lore, ...vectorIndices.character];
        if (allEntries.length === 0 || !queryText) return [];
        const queryVector = await geminiService.embedContent(queryText);
        const scoredItems = allEntries.map(item => ({ ...item, score: cosineSimilarity(item.vector, queryVector) }));
        scoredItems.sort((a, b) => b.score - a.score);
        return scoredItems.slice(0, topK);
    }, [vectorIndices]);

    const _orchestrateStoryGeneration = useCallback(async (promptType, content, currentStoryId) => {
        setIsProcessing(true);
        setRetrievedMemories([]);
        try {
            if (promptType === 'send' || promptType === 'intervene') {
                await storyService.addMessage(currentStoryId, content);
            }
            const currentHistory = (promptType === 'send' || promptType === 'intervene') ? [...messages, content] : messages;
            
            const _updateCharacterSubconscious = async (currentCharacters) => {
                const logEntries = [];
                const updatedCharacters = await Promise.all(currentCharacters.map(async (char) => {
                    if (char.isProtagonist) return char;
                    const { stream, logEntry } = await geminiService.generateSubconsciousStream(char, aiSettings.auxModel);
                    if (logEntry) logEntries.push(logEntry);
                    return { ...char, subconscious: { ...char.subconscious, subconsciousStream: stream } };
                }));
                return { updatedCharacters, logEntries };
            };
            const { updatedCharacters: charsWithSubconscious, logEntries: subconsciousLogs } = await _updateCharacterSubconscious(characters);
            subconsciousLogs.forEach(addApiLogEntry);

            const _getContextData = async (queryText, currentHistory, charactersWithSubconscious) => {
                const shortTermMemory = currentHistory.slice(-aiSettings.shortTermMemoryTurns);
                const retrievedItems = await searchVectorIndices(queryText, aiSettings.retrievalTopK);
                const retrievedContext = retrievedItems.map(item => item.text);
                const [systemTokens, worldTokens, memoryTokens, loreTokens, chatTokens] = await Promise.all([
                    geminiService.countTokens(aiSettings.systemInstruction),
                    geminiService.countTokens(JSON.stringify({ genre: lorebook.genre, worldview: lorebook.worldview, plot: lorebook.plot })),
                    geminiService.countTokens(retrievedContext.join('\n\n')),
                    geminiService.countTokens(JSON.stringify(charactersWithSubconscious)),
                    geminiService.countTokens(JSON.stringify(shortTermMemory))
                ]);
                const contextTokenInfo = { system: systemTokens, world: worldTokens, memory: memoryTokens, lore: loreTokens, chat: chatTokens, total: systemTokens + worldTokens + memoryTokens + loreTokens + chatTokens };
                return { shortTermMemory, retrievedItems, contextTokenInfo };
            };
            const queryText = (promptType === 'send' || promptType === 'reroll' || promptType === 'intervene') ? content.text : JSON.stringify(content);
            const { shortTermMemory, retrievedItems, contextTokenInfo } = await _getContextData(queryText, currentHistory, charsWithSubconscious);
            setContextInfo(contextTokenInfo);
            setRetrievedMemories(retrievedItems);

            const storyData = { characters: charsWithSubconscious, lorebook, aiSettings, worldState };
            const retrievedContext = retrievedItems.map(item => item.text);
            const { data: aiResultData, logEntry: mainLog } = await geminiService.generateResponse(storyData, promptType, content.text, shortTermMemory, retrievedContext);
            addApiLogEntry(mainLog);

            const cleanedContent = (aiResultData.content || []).map(item => (item.type !== 'narration' && item.type !== 'dialogue') ? { type: 'narration', text: item.text || item.line || JSON.stringify(item) } : item);
            const aiResponse = { id: Date.now() + 1, sender: 'ai', content: cleanedContent, isSummarized: false };
            await storyService.addMessage(currentStoryId, aiResponse);

            const _updateWorldState = async (playerInputText, currentWorldState) => {
                try {
                    const { data: timeData, logEntry } = await geminiService.deduceTime(playerInputText, currentWorldState, aiSettings.auxModel);
                    const { elapsedMinutes, weather } = timeData;
                    let newMinute = Math.round(currentWorldState.minute + elapsedMinutes);
                    let newHour = currentWorldState.hour + Math.floor(newMinute / 60);
                    newMinute %= 60;
                    let newDay = currentWorldState.day + Math.floor(newHour / 24);
                    newHour %= 24;
                    return { newWorldState: { day: newDay, hour: newHour, minute: newMinute, weather: weather || currentWorldState.weather }, logEntry };
                } catch (timeError) { return { newWorldState: currentWorldState, logEntry: null }; }
            };
            let finalWorldState = worldState;
            if (promptType !== 'new_story' && promptType !== 'continue') {
                const { newWorldState, logEntry: timeLog } = await _updateWorldState(content.text, worldState);
                addApiLogEntry(timeLog);
                finalWorldState = newWorldState;
                setWorldState(newWorldState);
            }

            const _updateCharacterGoals = async (aiResponseContent, currentCharacters) => {
                const logEntries = [];
                const recentEventsText = aiResponseContent.map(c => c.text || c.line).join(' ');
                const activeNpcNames = new Set(aiResponseContent.filter(c => c.type === 'dialogue' && c.character).map(c => c.character.trim()));
                const updatedCharacters = await Promise.all(currentCharacters.map(async (char) => {
                    if (!char.isProtagonist && activeNpcNames.has(char.name.trim())) {
                        try {
                            const { goals, logEntry } = await geminiService.updatePersonalGoals(char, recentEventsText, aiSettings.auxModel);
                            if (logEntry) logEntries.push(logEntry);
                            return { ...char, goals };
                        } catch (goalError) { console.error(`${char.name}의 목표 업데이트 오류:`, goalError); }
                    }
                    return char;
                }));
                return { updatedCharacters, logEntries };
            };
            const { updatedCharacters: charactersWithNewGoals, logEntries: goalLogs } = await _updateCharacterGoals(aiResponse.content, charsWithSubconscious);
            goalLogs.forEach(addApiLogEntry);
            setCharacters(charactersWithNewGoals);

            if (promptType === 'new_story' && aiResultData.title) {
                setStoryTitle(aiResultData.title);
                await storyService.saveStory(currentStoryId, { title: aiResultData.title });
                await fetchStoryList();
            }
            const recentEventsText = aiResponse.content.map(c => c.text || c.line).join(' ');
            await _addEntryToIndex('sceneIndex', { id: `L0_${aiResponse.id}`, text: `[과거 장면] ${recentEventsText}`, level: 0, source_ids: [aiResponse.id.toString()] }, currentStoryId);
            await storyService.saveStory(currentStoryId, { characters: charactersWithNewGoals, worldState: finalWorldState });
        } catch (error) {
            showToast(`AI 응답 생성 실패: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [messages, characters, lorebook, aiSettings, worldState, searchVectorIndices, _addEntryToIndex, fetchStoryList, addApiLogEntry, setIsProcessing, setRetrievedMemories, setContextInfo, setWorldState, setCharacters, setStoryTitle, showToast]);

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
                setTimeout(() => _orchestrateStoryGeneration('reroll', lastPlayerMessage, storyId), 200);
            } catch (error) {
                showToast("리롤 중 오류 발생");
                setIsProcessing(false);
            }
        }
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId, setIsProcessing, showToast]);
    
    const handleContinue = useCallback(() => {
        if (isProcessing || !storyId) return;
        const lastAiMessage = messages.findLast(msg => msg.sender === 'ai');
        if (lastAiMessage) _orchestrateStoryGeneration('continue', { text: JSON.stringify(lastAiMessage.content) }, storyId);
    }, [isProcessing, messages, _orchestrateStoryGeneration, storyId]);
    
    const handleNewStory = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const newStoryData = { title: "새로운 이야기", characters, lorebook, aiSettings, worldState: DEFAULT_WORLD_STATE };
            const newId = await storyService.createNewStory(newStoryData);
            for (const char of characters) {
                if (!char.isProtagonist && char.formativeEvent) {
                    const profileText = `[캐릭터 프로필] 이름: ${char.name}, 노트: ${char.note}. 결정적 경험: ${char.formativeEvent}. 핵심 원칙: ${char.corePrinciple}. 코어 디자이어: ${char.coreDesire}.`;
                    await _addEntryToIndex('characterIndex', { id: `L0_char_${char.id}`, text: profileText, level: 0, source_ids: [char.id.toString()] }, newId);
                }
            }
            for (const detail of lorebook.details) {
                const text = `[${detail.category}] ${detail.keyword}: ${detail.description}`;
                await _addEntryToIndex('loreIndex', { id: `L0_lore_${detail.id}`, text: text, level: 0, source_ids: [detail.id.toString()] }, newId);
            }
            await fetchStoryList();
            await handleLoadStory(newId);
            await _orchestrateStoryGeneration('new_story', { text: '' }, newId);
        } catch (error) {
            showToast(`새 이야기 생성 실패: ${error.message}`);
            setIsProcessing(false);
        }
    }, [isProcessing, characters, lorebook, aiSettings, fetchStoryList, handleLoadStory, _orchestrateStoryGeneration, _addEntryToIndex, setIsProcessing, showToast]);
    
    const handleIntervention = useCallback((text) => {
        if (!text.trim() || isProcessing || !storyId) return;
        const interventionMessage = { id: Date.now(), sender: 'player', text: text.trim(), isSummarized: false };
        _orchestrateStoryGeneration('intervene', interventionMessage, storyId);
    }, [isProcessing, _orchestrateStoryGeneration, storyId]);

    const handleGenerateFullProfile = useCallback(async (characterId) => {
        if (isProcessing) return;
        const characterToUpdate = characters.find(c => c.id === characterId);
        if (!characterToUpdate || characterToUpdate.isProtagonist) {
            showToast("NPC 프로필만 생성할 수 있습니다.");
            return;
        }
        setIsProcessing(true);
        try {
            const auxModel = aiSettings.auxModel;
            showToast("AI가 서사 프로필을 생성 중입니다...");
            const { data: narrativeData, logEntry: narrativeLog } = await geminiService.generateNarrativeProfile(characterToUpdate, auxModel);
            addApiLogEntry(narrativeLog);
            const tempProfileForNextSteps = { ...characterToUpdate, ...narrativeData };
            
            showToast("AI가 성격 프로필(BIG5)을 생성 중입니다...");
            const { data: big5Data, logEntry: big5Log } = await geminiService.generateBig5Profile(tempProfileForNextSteps, auxModel);
            addApiLogEntry(big5Log);
            
            showToast("AI가 내면의 그림자를 생성 중입니다...");
            const { data: innerShadowData, logEntry: innerShadowLog } = await geminiService.generateInnerShadow(tempProfileForNextSteps, auxModel);
            addApiLogEntry(innerShadowLog);
            
            showToast("AI가 운명을 설계하는 중입니다...");
            const { data: destinyData, logEntry: destinyLog } = await geminiService.generateDestiny(tempProfileForNextSteps, auxModel);
            addApiLogEntry(destinyLog);
            
            showToast("AI가 무의식의 상징을 추출하는 중입니다...");
            const { data: symbolsData, logEntry: symbolsLog } = await geminiService.generateRecurringSymbols(tempProfileForNextSteps, auxModel);
            addApiLogEntry(symbolsLog);
            
            const fullProfile = { ...narrativeData, big5: big5Data, innerShadow: innerShadowData, thematicArc: destinyData.thematicArc, tragicFlaw: destinyData.tragicFlaw, subconscious: { ...characterToUpdate.subconscious, recurringSymbols: symbolsData.recurringSymbols } };
            const updatedCharacters = characters.map(c => c.id === characterId ? { ...c, ...fullProfile } : c);
            setCharacters(updatedCharacters);
            
            if (storyId) {
                const updatedCharForVector = updatedCharacters.find(c => c.id === characterId);
                if (updatedCharForVector) {
                    const profileText = `[캐릭터 프로필] 이름: ${updatedCharForVector.name}, 노트: ${updatedCharForVector.note}. 결정적 경험: ${updatedCharForVector.formativeEvent}. 핵심 원칙: ${updatedCharForVector.corePrinciple}. 코어 디자이어: ${updatedCharForVector.coreDesire}.`;
                    await _addEntryToIndex('characterIndex', { id: `L0_char_${characterId}`, text: profileText, level: 0, source_ids: [characterId.toString()] }, storyId);
                }
            }
            showToast(`${characterToUpdate.name}의 AI 전체 프로필이 생성되었습니다.`);
        } catch (error) {
            showToast(`AI 프로필 생성 오류: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, characters, aiSettings.auxModel, addApiLogEntry, _addEntryToIndex, storyId, setCharacters, setIsProcessing, showToast]);

    const handleMemoryCompression = useCallback(async (level) => {
        if (!storyId || isProcessing) return;
        setIsProcessing(true);
        showToast(`기억 압축(L${level})을 시작합니다...`);
        try {
            const sourceLevel = level - 1;
            const threshold = level === 1 ? LEVEL_1_COMPRESSION_THRESHOLD : LEVEL_2_COMPRESSION_THRESHOLD;
            const targets = await storyService.getIndexEntries(storyId, 'sceneIndex', sourceLevel, threshold);
            if (targets.length < threshold) {
                showToast(`압축할 L${sourceLevel} 장면 기억이 충분하지 않습니다. (${targets.length}/${threshold})`);
                setIsProcessing(false); return;
            }
            const textToSummarize = targets.map(t => t.text).join('\n\n');
            const { summary, logEntry } = await geminiService.summarizeEvents(textToSummarize, level, aiSettings.auxModel);
            addApiLogEntry(logEntry);
            const source_ids = targets.map(t => t.id);
            await _addEntryToIndex('sceneIndex', { id: `L${level}_${Date.now()}`, text: `[요약된 ${level === 1 ? '장면' : `에피소드 L${level}`}] ${summary}`, level: level, source_ids: source_ids }, storyId);
            await storyService.deleteIndexEntries(storyId, 'sceneIndex', source_ids);
            if (level === 1) {
                const messageDocIdsToUpdate = targets.flatMap(t => {
                    const msgIds = t.source_ids || [];
                    return msgIds.map(id => messages.find(m => m.id.toString() === id)?.docId).filter(Boolean);
                });
                if (messageDocIdsToUpdate.length > 0) {
                    await storyService.updateMessagesSummarizedFlag(storyId, messageDocIdsToUpdate);
                }
            }
            const newIndex = await storyService.loadIndexCollection(storyId, 'sceneIndex');
            setVectorIndices(prev => ({ ...prev, scene: newIndex }));
            showToast(`기억 압축(L${level})이 완료되었습니다.`);
        } catch (error) {
            console.error(`기억 압축 오류 (L${level}):`, error);
            showToast(`기억 압축 중 오류 발생: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    }, [storyId, isProcessing, aiSettings.auxModel, messages, addApiLogEntry, _addEntryToIndex, setVectorIndices, showToast, setIsProcessing]);
    
    const handlePdChatSend = useCallback(async (userInput) => {
        if (!userInput.trim()) return;
        const newUserMessage = { role: 'user', text: userInput };
        const newHistory = [...pdChatHistory, newUserMessage];
        setPdChatHistory(newHistory);
        setIsPdChatProcessing(true);
        try {
            const { response, logEntry } = await geminiService.getPdResponse(newHistory, aiSettings.auxModel);
            addApiLogEntry(logEntry);
            const newAiMessage = { role: 'assistant', text: response };
            setPdChatHistory(prev => [...prev, newAiMessage]);
        } catch (error) {
            showToast(`PD 응답 생성 실패: ${error.message}`);
            const errorMessage = { role: 'assistant', text: `죄송해요, 자기야. 지금은 응답할 수 없어. (${error.message})` };
            setPdChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsPdChatProcessing(false);
        }
    }, [pdChatHistory, aiSettings.auxModel, addApiLogEntry, showToast, setPdChatHistory, setIsPdChatProcessing]);

    const handleClearPdChat = useCallback(() => {
        setPdChatHistory([]);
        showToast("PD와의 대화 기록이 초기화되었습니다.");
    }, [setPdChatHistory, showToast]);

    return {
        _addEntryToIndex,
        handleSendMessage, handleReroll, handleContinue, handleNewStory,
        handleIntervention, handleGenerateFullProfile, handleMemoryCompression,
        handlePdChatSend, handleClearPdChat
    };
};
