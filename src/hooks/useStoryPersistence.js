import { useEffect, useCallback, useRef } from 'react';
import { storyService } from '../services/firebaseService';
import { DEFAULT_PROTAGONIST, DEFAULT_LOREBOOK, DEFAULT_AI_SETTINGS, DEFAULT_WORLD_STATE } from '../constants/defaults';

/**
 * 이야기 데이터의 영속성(저장, 로드, 삭제 등)을 관리하는 커스텀 훅입니다.
 * 분리된 storyDataState와 uiState를 인자로 받습니다.
 * @param {object} storyDataState - 이야기의 핵심 데이터 상태 객체
 * @param {object} uiState - UI 및 상호작용 관련 상태 객체
 * @param {function} showToast - 토스트 메시지를 표시하는 함수
 * @returns {object} 영속성 관련 핸들러 함수들을 포함하는 객체
 */
export const useStoryPersistence = (storyDataState, uiState, showToast) => {
    // 데이터 상태 분리에 따른 변수 할당 수정
    const {
        storyId, characters, lorebook, aiSettings, worldState, storyTitle, apiLog,
        setStoryId, setStoryTitle, setMessages, setCharacters, setLorebook,
        setAiSettings, setWorldState, setVectorIndices, setApiLog, setContextInfo,
        setRetrievedMemories, setBlueprintTemplates, setCharacterTemplates, setStoryList
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
        setCharacters([DEFAULT_PROTAGONIST]);
        setLorebook(DEFAULT_LOREBOOK);
        setAiSettings(DEFAULT_AI_SETTINGS);
        setWorldState(DEFAULT_WORLD_STATE);
        setVectorIndices({ scene: [], lore: [], character: [] });
        setApiLog({ summary: {}, log: [] });
        setContextInfo({ system: 0, world: 0, memory: 0, lore: 0, chat: 0, total: 0 });
        setRetrievedMemories([]);
        setPdChatHistory([]);
    }, [
        setStoryId, setStoryTitle, setMessages, setCharacters, setLorebook,
        setAiSettings, setWorldState, setVectorIndices, setApiLog,
        setContextInfo, setRetrievedMemories, setPdChatHistory
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
        if (messageListenerUnsubscribe.current) {
            messageListenerUnsubscribe.current();
        }
        try {
            const data = await storyService.loadStory(id);
            if (data) {
                setCharacters(data.characters || [DEFAULT_PROTAGONIST]);
                setLorebook(data.lorebook || DEFAULT_LOREBOOK);
                setAiSettings({ ...DEFAULT_AI_SETTINGS, ...(data.aiSettings || {}) });
                setWorldState(data.worldState || DEFAULT_WORLD_STATE);
                setApiLog(data.apiLog || { summary: {}, log: [] });

                const [scene, lore, character] = await Promise.all([
                    storyService.loadIndexCollection(id, 'sceneIndex'),
                    storyService.loadIndexCollection(id, 'loreIndex'),
                    storyService.loadIndexCollection(id, 'characterIndex')
                ]);
                setVectorIndices({ scene, lore, character });

                setStoryId(id);
                setStoryTitle(data.title || '제목 없는 이야기');
                localStorage.setItem('lastStoryId', id);

                messageListenerUnsubscribe.current = storyService.listenToMessages(id, (loadedMessages) => {
                    setMessages(loadedMessages.map(m => ({ ...m, isSummarized: m.isSummarized || false })));
                });

                setPdChatHistory([]);
                showToast(`'${data.title || '제목 없는 이야기'}' 이야기를 불러왔습니다.`);
            } else {
                localStorage.removeItem('lastStoryId');
                resetToWelcome();
            }
        } catch (error) {
            console.error("이야기 불러오기 오류:", error);
            showToast("이야기 불러오기 중 오류 발생");
        } finally {
            setIsLoading(false);
        }
    }, [
        resetToWelcome, showToast, setIsLoading, setCharacters, setLorebook,
        setAiSettings, setWorldState, setApiLog, setVectorIndices,
        setStoryId, setStoryTitle, setMessages, setPdChatHistory
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
    }, []); // 의존성 배열에서 일부 함수 제거하여 최초 1회만 실행되도록 수정

    const handleSaveStory = useCallback(async () => {
        if (!storyId) return;
        setIsProcessing(true);
        try {
            const storyData = { characters, lorebook, aiSettings, title: storyTitle, worldState, apiLog };
            await storyService.saveStory(storyId, storyData);
            await fetchStoryList();
            showToast(`'${storyTitle}' 이야기가 성공적으로 저장되었습니다!`);
        } catch (error) {
            showToast('저장 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    }, [
        storyId, characters, lorebook, aiSettings, worldState,
        storyTitle, apiLog, fetchStoryList, setIsProcessing, showToast
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
            showToast("이야기가 삭제되었습니다.");
        } catch (error) {
            console.error("이야기 삭제 오류:", error);
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
                genre: lorebook.genre,
                worldview: lorebook.worldview,
                plot: lorebook.plot,
            };
            await storyService.saveBlueprintTemplate(templateData);
            await fetchBlueprintTemplates();
            showToast(`'${templateName}' 템플릿이 저장되었습니다.`);
        } catch (error) {
            showToast("템플릿 저장 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [lorebook, fetchBlueprintTemplates, setIsProcessing, showToast]);
    
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
            showToast("템플릿으로 저장할 캐릭터 이름이 없습니다.");
            return;
        }
        setIsProcessing(true);
        try {
            const templateData = {
                ...characterData,
                id: Date.now().toString(),
            };
            await storyService.saveCharacterTemplate(templateData);
            await fetchCharacterTemplates();
            showToast(`'${characterData.name}' 캐릭터가 프리셋으로 저장되었습니다.`);
        } catch (error) {
            showToast("캐릭터 프리셋 저장 중 오류 발생");
        } finally {
            setIsProcessing(false);
        }
    }, [fetchCharacterTemplates, setIsProcessing, showToast]);

    const handleLoadCharacterTemplate = useCallback((template) => {
        const newCharacter = {
            ...template,
            id: Date.now(),
        };
        if (characters.some(c => c.name === newCharacter.name)) {
            showToast(`'${newCharacter.name}' 이름의 캐릭터가 이미 존재합니다.`);
            return;
        }
        setCharacters(prev => [...prev, newCharacter]);
        showToast(`'${newCharacter.name}' 캐릭터를 불러왔습니다.`);
    }, [characters, setCharacters, showToast]);

    const handleDeleteCharacterTemplate = useCallback(async (id) => {
        setIsProcessing(true);
        try {
            await storyService.deleteCharacterTemplate(id);
            await fetchCharacterTemplates();
            showToast("캐릭터 프리셋이 삭제되었습니다.");
        } catch (error) {
            showToast("캐릭터 프리셋 삭제 중 오류 발생");
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
