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
        isProcessing, 
        setIsLoading, 
        setIsProcessing, 
        setPdChatHistory
    } = uiState;

    const messageListenerUnsubscribe = useRef(null);

    const prepareCharactersForSave = (characterArray) => {
        return JSON.parse(JSON.stringify(characterArray)).map(char => {
            if (Array.isArray(char.dailySchedule)) {
                char.dailySchedule = JSON.stringify(char.dailySchedule);
            }
            return char;
        });
    };

    const parseCharactersAfterLoad = (characterArray) => {
        return (characterArray || [DEFAULT_USER]).map(char => {
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
    };


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
        setContextInfo({ system: 0, worldview: 0, world: 0, memory: 0, lore: 0, chat: 0, total: 0 });
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
        setMessages([]);
        
        if (messageListenerUnsubscribe.current) {
            messageListenerUnsubscribe.current();
        }
        try {
            const data = await storyService.loadStory(id);
            if (data) {
                const loadedCharacters = parseCharactersAfterLoad(data.characters);
                setCharacters(loadedCharacters);
                
                const loadedContextSettings = { ...DEFAULT_CONTEXT_SETTINGS, ...(data.contextSettings || {}) };
                if (!loadedContextSettings.worldview) {
                    loadedContextSettings.worldview = DEFAULT_CONTEXT_SETTINGS.worldview;
                }

                setContextSettings(loadedContextSettings);
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
            const charactersToSave = prepareCharactersForSave(characters);
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

    // [FIX] 템플릿 저장 시 situation만 저장하는 대신 contextSettings 전체를 저장하도록 수정합니다.
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
                contextSettings: contextSettings, // 이 부분이 핵심 수정사항입니다.
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
            const templateToSave = prepareCharactersForSave([characterData])[0];
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
        const loadedTemplate = parseCharactersAfterLoad([template])[0];

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
    
    const handleNewScene = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const [hour, minute] = contextSettings.startTime.split(':').map(Number);
            const initialWorldState = { day: 1, hour: isNaN(hour) ? 9 : hour, minute: isNaN(minute) ? 0 : minute, weather: contextSettings.startWeather || '실내' };
            
            const charactersToSave = prepareCharactersForSave(characters);
            
            const newStoryData = { title: "새로운 장면", characters: charactersToSave, contextSettings, aiSettings, worldState: initialWorldState, apiLog, pinnedItems };
            const newId = await storyService.createNewStory(newStoryData);
            
            await fetchStoryList();
            await handleLoadStory(newId);
            
            return newId;

        } catch (error) {
            showToast(`새 장면 생성 실패: ${error.message}`, 'error');
            setIsProcessing(false);
            return null;
        }
    }, [isProcessing, characters, contextSettings, aiSettings, apiLog, pinnedItems, fetchStoryList, handleLoadStory, showToast, setIsProcessing]);


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
        handleNewScene,
    };
};
