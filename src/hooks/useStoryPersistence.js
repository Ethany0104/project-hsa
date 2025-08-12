// hooks/useStoryPersistence.js

import { useEffect, useCallback, useRef } from 'react';
import { storyService } from '../services/firebaseService';
import { DEFAULT_USER, DEFAULT_CONTEXT_SETTINGS, DEFAULT_AI_SETTINGS, DEFAULT_WORLD_STATE, DEFAULT_PERSONA } from '../constants';

export const useStoryPersistence = (storyDataState, uiState, showToast) => {
    const {
        storyId, characters, contextSettings, aiSettings, worldState, storyTitle, apiLog, pinnedItems, assets,
        customTools,
        setStoryId, setStoryTitle, setMessages, setCharacters, setContextSettings,
        setAiSettings, setWorldState, setVectorIndices, setApiLog, setContextInfo,
        setRetrievedMemories, setBlueprintTemplates, setCharacterTemplates, setStoryList,
        setPinnedItems, setAssets,
        setCustomTools
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
            delete char.attachedAssets;
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
        setAssets([]);
        setCustomTools([]);
    }, [
        setStoryId, setStoryTitle, setMessages, setCharacters, setContextSettings,
        setAiSettings, setWorldState, setVectorIndices, setApiLog,
        setContextInfo, setRetrievedMemories, setPdChatHistory, setPinnedItems, setAssets, setCustomTools
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
    
    const fetchCustomTools = useCallback(async () => {
        const tools = await storyService.fetchCustomTools();
        setCustomTools(tools);
    }, [setCustomTools]);

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
                setAssets(data.assets || []);

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
        setStoryId, setStoryTitle, setMessages, setPdChatHistory, setPinnedItems, setAssets
    ]);

    useEffect(() => {
        fetchStoryList();
        fetchBlueprintTemplates();
        fetchCharacterTemplates();
        fetchCustomTools();
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
                pinnedItems,
                assets,
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
        storyTitle, apiLog, pinnedItems, assets,
        fetchStoryList, setIsProcessing, showToast
    ]);

    const handleUpdateCharacterLocally = useCallback((updatedCharacter) => {
        const updatedCharacters = characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c);
        setCharacters(updatedCharacters);
        showToast(`'${updatedCharacter.name}' 정보가 임시 저장되었습니다.`);
    }, [characters, setCharacters, showToast]);


    const handleUpdateAndSaveCharacter = useCallback(async (updatedCharacter) => {
        if (!storyId) {
            showToast("캐릭터를 저장하려면 먼저 장면을 시작해야 합니다.", "error");
            return;
        }
        const updatedCharacters = characters.map(c => c.id === updatedCharacter.id ? updatedCharacter : c);
        setCharacters(updatedCharacters);
        const charactersToSave = prepareCharactersForSave(updatedCharacters);
        try {
            await storyService.saveStory(storyId, { characters: charactersToSave });
            showToast(`'${updatedCharacter.name}' 정보가 저장되었습니다.`);
        } catch (error) {
            console.error("캐릭터 저장 오류:", error);
            showToast("캐릭터 정보 저장 중 오류가 발생했습니다.", "error");
        }
    }, [storyId, characters, setCharacters, showToast]);


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
                contextSettings: contextSettings,
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

            const characterAssets = assets.filter(asset => String(asset.ownerId) === String(characterData.id));
            if (characterAssets.length > 0) {
                templateToSave.attachedAssets = characterAssets.map(asset => ({
                    fileName: asset.fileName,
                    storagePath: asset.storagePath
                }));
            }

            await storyService.saveCharacterTemplate(templateToSave);
            await fetchCharacterTemplates();
            showToast(`'${characterData.name}' 페르소나가 프리셋으로 저장되었습니다.`);
        } catch (error) {
            showToast("페르소나 프리셋 저장 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [assets, fetchCharacterTemplates, setIsProcessing, showToast]);

    const handleLoadCharacterTemplate = useCallback(async (template) => {
        const hasAssetsToCopy = template.attachedAssets && template.attachedAssets.length > 0;

        if (hasAssetsToCopy && !storyId) {
            showToast("에셋이 포함된 템플릿을 불러오려면 먼저 장면을 시작해야 합니다.", "error");
            return;
        }

        const loadedTemplate = parseCharactersAfterLoad([template])[0];
        
        if (loadedTemplate.isUser) {
            setCharacters(prev => prev.map(c => c.isUser ? { ...loadedTemplate, id: c.id, isUser: true } : c));
            showToast(`유저 '${loadedTemplate.name}' 프리셋을 불러왔습니다.`);
        } else {
            if (characters.some(c => c.name === loadedTemplate.name)) {
                showToast(`'${loadedTemplate.name}' 이름의 페르소나가 이미 존재합니다.`);
                return;
            }

            const newCharacter = { ...loadedTemplate, id: Date.now(), isUser: false };
            delete newCharacter.attachedAssets;

            setCharacters(prev => [...prev, newCharacter]);
            showToast(`페르소나 '${newCharacter.name}'를 불러왔습니다.`);

            if (hasAssetsToCopy) {
                setIsProcessing(true);
                showToast(`'${newCharacter.name}'의 전용 에셋 ${template.attachedAssets.length}개를 복사하는 중...`);
                try {
                    const newAssets = [];
                    for (const assetToCopy of template.attachedAssets) {
                        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                        const fileExtension = assetToCopy.fileName.split('.').pop();
                        const newStoragePath = `assets/${storyId}/${assetId}.${fileExtension}`;
                        
                        const newUrl = await storyService.copyImageInStorage(assetToCopy.storagePath, newStoragePath);
                        
                        newAssets.push({
                            id: assetId,
                            fileName: assetToCopy.fileName,
                            storageUrl: newUrl,
                            storagePath: newStoragePath,
                            ownerId: newCharacter.id,
                            path: '',
                            type: 'file',
                        });
                    }

                    const updatedAssets = [...assets, ...newAssets];
                    setAssets(updatedAssets);
                    await storyService.saveStory(storyId, { assets: updatedAssets });

                    showToast(`에셋 복사가 완료되었습니다!`, "success");
                } catch (error) {
                    console.error("템플릿 에셋 복사 중 오류:", error);
                    showToast(`에셋을 복사하는 중 오류가 발생했습니다: ${error.message}`, "error");
                } finally {
                    setIsProcessing(false);
                }
            }
        }
    }, [storyId, characters, assets, setCharacters, setAssets, setIsProcessing, showToast]);

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
    
    // [수정] 중복 이름 검사 로직을 추가합니다.
    const handleAddCharacter = useCallback(async (name) => {
        const trimmedName = name.trim();
        if (characters.some(c => c.name.trim().toLowerCase() === trimmedName.toLowerCase())) {
            showToast(`'${trimmedName}' 이름의 페르소나가 이미 존재합니다.`, 'error');
            return;
        }

        const newPersona = { ...DEFAULT_PERSONA, id: Date.now(), name: trimmedName };
        const updatedCharacters = [...characters, newPersona];
        setCharacters(updatedCharacters);

        if (storyId) {
            setIsProcessing(true);
            try {
                const charactersToSave = prepareCharactersForSave(updatedCharacters);
                await storyService.saveStory(storyId, { characters: charactersToSave });
                showToast(`'${trimmedName}' 페르소나를 추가하고 저장했습니다.`);
            } catch (error) {
                showToast(`페르소나 추가 중 저장 오류: ${error.message}`, 'error');
            } finally {
                setIsProcessing(false);
            }
        } else {
            showToast(`'${trimmedName}' 페르소나를 임시 추가했습니다.`);
        }
    }, [storyId, characters, setCharacters, showToast, setIsProcessing]);

    const handleDeleteCharacter = useCallback(async (characterToDelete) => {
        if (!characterToDelete || characterToDelete.isUser) {
            showToast("유저 캐릭터는 삭제할 수 없습니다.", "error");
            return;
        }
    
        setIsProcessing(true);
        try {
            const updatedAssets = assets.map(asset => {
                if (String(asset.ownerId) === String(characterToDelete.id)) {
                    return { ...asset, ownerId: 'shared' };
                }
                return asset;
            });
            setAssets(updatedAssets);
    
            const charsAfterDelete = characters.filter(c => c.id !== characterToDelete.id);
            
            const finalCharacters = charsAfterDelete.map(char => {
                if (char.relationships && char.relationships.length > 0) {
                    return {
                        ...char,
                        relationships: char.relationships.filter(rel => String(rel.targetId) !== String(characterToDelete.id))
                    };
                }
                return char;
            });
            setCharacters(finalCharacters);
    
            if (storyId) {
                const charactersToSave = prepareCharactersForSave(finalCharacters);
                await storyService.saveStory(storyId, { 
                    characters: charactersToSave,
                    assets: updatedAssets 
                });
            }
            
            showToast(`'${characterToDelete.name}' 페르소나를 삭제했습니다. 소유했던 에셋은 '공용'으로 이전됩니다.`);
    
        } catch (error) {
            console.error("캐릭터 삭제 중 오류 발생:", error);
            showToast(`캐릭터 삭제 중 오류가 발생했습니다: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [storyId, characters, assets, setCharacters, setAssets, showToast, setIsProcessing]);


    const handleNewScene = useCallback(async () => {
        if (isProcessing) return;
        setIsProcessing(true);
        try {
            const [hour, minute] = contextSettings.startTime.split(':').map(Number);
            const initialWorldState = { day: 1, hour: isNaN(hour) ? 9 : hour, minute: isNaN(minute) ? 0 : minute, weather: contextSettings.startWeather || '실내' };
            const charactersToSave = prepareCharactersForSave(characters);
            const newStoryData = { title: "새로운 장면", characters: charactersToSave, contextSettings, aiSettings, worldState: initialWorldState, apiLog, pinnedItems, assets: [] };
            const newId = await storyService.createNewStory(newStoryData);
            await fetchStoryList();
            await handleLoadStory(newId);
            return newId;
        } catch (error) {
            showToast(`새 장면 생성 실패: ${error.message}`, "error");
            setIsProcessing(false);
            return null;
        }
    }, [isProcessing, characters, contextSettings, aiSettings, apiLog, pinnedItems, fetchStoryList, handleLoadStory, showToast, setIsProcessing]);
    
    const handleSaveCustomTool = useCallback(async (toolData) => {
        if (!toolData || !toolData.name) {
            showToast("툴을 저장하려면 '호출 이름'이 반드시 필요합니다.", "error");
            return;
        }
        setIsProcessing(true);
        try {
            await storyService.saveCustomTool(toolData);
            await fetchCustomTools();
            showToast(`'${toolData.name}' 툴이 저장되었습니다.`, "success");
        } catch (error) {
            console.error("커스텀 툴 저장 오류:", error);
            showToast(`툴 저장 중 오류 발생: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchCustomTools, setIsProcessing, showToast]);

    const handleDeleteCustomTool = useCallback(async (toolId) => {
        if (!toolId) return;
        setIsProcessing(true);
        try {
            await storyService.deleteCustomTool(toolId);
            await fetchCustomTools();
            showToast("툴이 삭제되었습니다.");
        } catch (error) {
            console.error("커스텀 툴 삭제 오류:", error);
            showToast(`툴 삭제 중 오류 발생: ${error.message}`, "error");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchCustomTools, setIsProcessing, showToast]);


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
        handleUpdateAndSaveCharacter,
        handleUpdateCharacterLocally,
        handleAddCharacter,
        handleDeleteCharacter,
        handleSaveCustomTool,
        handleDeleteCustomTool,
        fetchCustomTools,
    };
};
