// hooks/useStoryPersistence.js

import { useEffect, useCallback, useRef } from 'react';
import { storyService } from '../services/firebaseService';
import { DEFAULT_USER, DEFAULT_CONTEXT_SETTINGS, DEFAULT_AI_SETTINGS, DEFAULT_WORLD_STATE } from '../constants/defaults';

export const useStoryPersistence = (storyDataState, uiState, showToast) => {
    const {
        storyId, characters, contextSettings, aiSettings, worldState, storyTitle, apiLog, pinnedItems,
        setStoryId, setStoryTitle, setMessages, setCharacters, setContextSettings,
        setAiSettings, setWorldState, setVectorIndices, setApiLog, setContextInfo,
        setRetrievedMemories, setBlueprintTemplates, setCharacterTemplates, setStoryList,
        setPinnedItems
    } = storyDataState;

    const {
        setIsLoading, setIsProcessing, setPdChatHistory
    } = uiState;

    const messageListenerUnsubscribe = useRef(null);

    const resetToWelcome = useCallback(() => {
        if (messageListenerUnsubscribe.current) {
            messageListenerUnsubscribe.current();
            messageListenerUnsubscribe.current = null;
        }
        setStoryId(null);
        setStoryTitle('');
        setMessages([]);
        setCharacters([DEFAULT_USER]);
        setContextSettings(DEFAULT_CONTEXT_SETTINGS);
        setAiSettings(DEFAULT_AI_SETTINGS);
        setWorldState(DEFAULT_WORLD_STATE);
        setVectorIndices({ scene: [], lore: [], character: [] });
        setApiLog({ summary: {}, log: [] });
        setContextInfo({ system: 0, world: 0, memory: 0, lore: 0, chat: 0, total: 0 });
        setRetrievedMemories([]);
        setPdChatHistory([]);
        setPinnedItems([]);
    }, [
        setStoryId, setStoryTitle, setMessages, setCharacters, setContextSettings,
        setAiSettings, setWorldState, setVectorIndices, setApiLog,
        setContextInfo, setRetrievedMemories, setPdChatHistory, setPinnedItems,
    ]);

    const fetchStoryList = useCallback(async () => {
        const stories = await storyService.fetchStoryList();
        setStoryList(stories);
    }, [setStoryList]);

    const fetchBlueprintTemplates = useCallback(async () => {
        const templates = await storyService.fetchBlueprintTemplates();
        setBlueprintTemplates(templates);
    }, [setBlueprintTemplates]);

    const fetchCharacterTemplates = useCallback(async () => {
        const templates = await storyService.fetchCharacterTemplates();
        setCharacterTemplates(templates);
    }, [setCharacterTemplates]);

    const handleLoadStory = useCallback(async (id) => {
        if (!id) return;
        setIsLoading(true);
        // [BUG FIX] 새 이야기를 불러오기 전에, 이전 이야기의 메시지 목록을 즉시 비웁니다.
        // 이렇게 하면 UI가 즉시 초기화되어 이야기가 이어지는 것처럼 보이는 현상을 방지할 수 있습니다.
        setMessages([]);
        
        if (messageListenerUnsubscribe.current) {
            messageListenerUnsubscribe.current();
        }
        try {
            const data = await storyService.loadStory(id);
            if (data) {
                const loadedCharacters = (data.characters || [DEFAULT_USER]).map(char => {
                    if (typeof char.dailySchedule === 'string') {
                        try {
                            return { ...char, dailySchedule: JSON.parse(char.dailySchedule) };
                        } catch (e) {
                            console.error(`Error parsing dailySchedule for character ${char.id}:`, e);
                            return { ...char, dailySchedule: [] };
                        }
                    }
                    return char;
                });
                setCharacters(loadedCharacters);
                
                setContextSettings({ ...DEFAULT_CONTEXT_SETTINGS, ...(data.contextSettings || {}) });
                setAiSettings({ ...DEFAULT_AI_SETTINGS, ...(data.aiSettings || {}) });
                setWorldState({ ...DEFAULT_WORLD_STATE, ...(data.worldState || {}) });
                setApiLog(data.apiLog || { summary: {}, log: [] });
                setPinnedItems(data.pinnedItems || []);

                const [scene, lore, character] = await Promise.all([
                    storyService.loadIndexCollection(id, 'sceneIndex'),
                    storyService.loadIndexCollection(id, 'loreIndex'),
                    storyService.loadIndexCollection(id, 'characterIndex')
                ]);
                setVectorIndices({ scene, lore, character });

                setStoryId(id);
                setStoryTitle(data.title || '제목 없는 장면');
                localStorage.setItem('lastStoryId', id);

                messageListenerUnsubscribe.current = storyService.listenToMessages(id, (loadedMessages) => {
                    setMessages(loadedMessages.map(m => ({ ...m, isSummarized: m.isSummarized || false })));
                });

                setPdChatHistory([]);
                showToast(`'${data.title || '제목 없는 장면'}'을(를) 불러왔습니다.`);
            } else {
                localStorage.removeItem('lastStoryId');
                resetToWelcome();
            }
        } catch (error) {
            console.error("장면 불러오기 오류:", error);
            showToast("장면 불러오기 중 오류 발생");
        } finally {
            setIsLoading(false);
        }
    }, [
        resetToWelcome, showToast, setIsLoading, setCharacters, setContextSettings,
        setAiSettings, setWorldState, setApiLog, setVectorIndices,
        setStoryId, setStoryTitle, setMessages, setPdChatHistory, setPinnedItems,
    ]);

    useEffect(() => {
        fetchStoryList();
        fetchBlueprintTemplates();
        fetchCharacterTemplates();
        const lastStoryId = localStorage.getItem('lastStoryId');
        if (lastStoryId) {
            handleLoadStory(lastStoryId);
        } else {
            resetToWelcome();
            setIsLoading(false);
        }
        return () => {
            if (messageListenerUnsubscribe.current) {
                messageListenerUnsubscribe.current();
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleSaveStory = useCallback(async () => {
        if (!storyId) return;
        setIsProcessing(true);
        try {
            const charactersToSave = JSON.parse(JSON.stringify(characters));
            charactersToSave.forEach(char => {
                if (Array.isArray(char.dailySchedule)) {
                    char.dailySchedule = JSON.stringify(char.dailySchedule);
                }
            });

            const storyData = { 
                characters: charactersToSave, 
                contextSettings, 
                aiSettings, 
                title: storyTitle, 
                worldState, 
                apiLog, 
                pinnedItems 
            };
            await storyService.saveStory(storyId, storyData);
            await fetchStoryList();
            showToast(`'${storyTitle}' 장면이 성공적으로 저장되었습니다!`);
        } catch (error) {
            showToast('저장 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    }, [
        storyId, characters, contextSettings, aiSettings, worldState,
        storyTitle, apiLog, pinnedItems,
        fetchStoryList, setIsProcessing, showToast
    ]);

    const handleDeleteStory = useCallback(async (idToDelete) => {
        setIsProcessing(true);
        try {
            await storyService.deleteStoryRecursively(idToDelete);
            await fetchStoryList();
            if (storyId === idToDelete) {
                localStorage.removeItem('lastStoryId');
                resetToWelcome();
            }
            showToast("장면이 삭제되었습니다.");
        } catch (error) {
            console.error("장면 삭제 오류:", error);
            showToast("삭제 중 오류가 발생했습니다.");
        } finally {
            setIsProcessing(false);
        }
    }, [storyId, fetchStoryList, resetToWelcome, setIsProcessing, showToast]);

    const handleSaveBlueprintTemplate = useCallback(async (templateName) => {
        if (!templateName.trim()) {
            showToast("템플릿 이름을 입력해주세요.");
            return;
        }
        setIsProcessing(true);
        try {
            const templateData = {
                id: Date.now().toString(),
                name: templateName,
                situation: contextSettings.situation,
            };
            await storyService.saveBlueprintTemplate(templateData);
            await fetchBlueprintTemplates();
            showToast(`'${templateName}' 템플릿이 저장되었습니다.`);
        } catch (error) {
            showToast("템플릿 저장 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [contextSettings, fetchBlueprintTemplates, setIsProcessing, showToast]);
    
    const handleDeleteBlueprintTemplate = useCallback(async (id) => {
        setIsProcessing(true);
        try {
            await storyService.deleteBlueprintTemplate(id);
            await fetchBlueprintTemplates();
            showToast("템플릿이 삭제되었습니다.");
        } catch (error) {
            showToast("템플릿 삭제 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchBlueprintTemplates, setIsProcessing, showToast]);

    const handleSaveCharacterTemplate = useCallback(async (characterData) => {
        if (!characterData || !characterData.name) {
            showToast("템플릿으로 저장할 페르소나 이름이 없습니다.");
            return;
        }
        setIsProcessing(true);
        try {
            const templateToSave = JSON.parse(JSON.stringify(characterData));
            if (Array.isArray(templateToSave.dailySchedule)) {
                templateToSave.dailySchedule = JSON.stringify(templateToSave.dailySchedule);
            }
            templateToSave.id = Date.now().toString();

            await storyService.saveCharacterTemplate(templateToSave);
            await fetchCharacterTemplates();
            showToast(`'${characterData.name}' 페르소나가 프리셋으로 저장되었습니다.`);
        } catch (error) {
            showToast("페르소나 프리셋 저장 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchCharacterTemplates, setIsProcessing, showToast]);

    const handleLoadCharacterTemplate = useCallback((template) => {
        let loadedTemplate = { ...template };
        if (typeof loadedTemplate.dailySchedule === 'string') {
            try {
                loadedTemplate.dailySchedule = JSON.parse(loadedTemplate.dailySchedule);
            } catch (e) {
                console.error(`Error parsing dailySchedule for template ${loadedTemplate.id}:`, e);
                loadedTemplate.dailySchedule = [];
            }
        }

        if (loadedTemplate.isUser) {
            setCharacters(prev => prev.map(c => {
                if (c.isUser) {
                    return { ...loadedTemplate, id: c.id, isUser: true };
                }
                return c;
            }));
            showToast(`유저 '${loadedTemplate.name}' 프리셋을 불러왔습니다.`);
        } else {
            const newCharacter = {
                ...loadedTemplate,
                id: Date.now(),
                isUser: false,
            };
            if (characters.some(c => c.name === newCharacter.name)) {
                showToast(`'${newCharacter.name}' 이름의 페르소나가 이미 존재합니다.`);
                return;
            }
            setCharacters(prev => [...prev, newCharacter]);
            showToast(`페르소나 '${newCharacter.name}'를 불러왔습니다.`);
        }
    }, [characters, setCharacters, showToast]);

    const handleDeleteCharacterTemplate = useCallback(async (id) => {
        setIsProcessing(true);
        try {
            await storyService.deleteCharacterTemplate(id);
            await fetchCharacterTemplates();
            showToast("페르소나 프리셋이 삭제되었습니다.");
        } catch (error) {
            showToast("페르소나 프리셋 삭제 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchCharacterTemplates, setIsProcessing, showToast]);

    return { 
        handleSaveStory, 
        handleLoadStory, 
        handleDeleteStory, 
        fetchStoryList,
        handleSaveBlueprintTemplate,
        handleDeleteBlueprintTemplate,
        fetchBlueprintTemplates,
        handleSaveCharacterTemplate,
        handleLoadCharacterTemplate,
        handleDeleteCharacterTemplate,
        fetchCharacterTemplates,
    };
};
