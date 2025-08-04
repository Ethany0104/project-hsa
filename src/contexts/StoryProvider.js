// src/contexts/StoryProvider.js

import React, { useMemo, useCallback, useContext } from 'react';
import { useStateManager } from '../hooks/useStateManager';
import { useStoryPersistence } from '../hooks/useStoryPersistence';
import { useStoryGeneration } from '../hooks/useStoryGeneration';
import { useProfileGeneration } from '../hooks/useProfileGeneration';
import { useMemoryManagement } from '../hooks/useMemoryManagement';
import { usePdChat } from '../hooks/usePdChat';
import { storyService, utilityGenerator } from '../services';

const StoryContext = React.createContext(null);

export const useStoryContext = () => {
    const context = useContext(StoryContext);
    if (!context) {
        throw new Error('useStoryContext must be used within a StoryProvider');
    }
    return context;
};

export const StoryProvider = ({ children }) => {
    const { storyDataState, uiState } = useStateManager();

    const showToast = useCallback((message, type = 'default') => {
        uiState.setToast({ show: true, message, type });
    }, [uiState.setToast]);

    const addApiLogEntry = useCallback((entry) => {
        if (!entry) return;
        storyDataState.setApiLog(prev => {
            const newLog = [entry, ...prev.log].slice(0, 15);
            return { ...prev, log: newLog };
        });
    }, [storyDataState.setApiLog]);

    const persistenceHandlers = useStoryPersistence(storyDataState, uiState, showToast);
    const { _addEntryToIndex, ...storyGenerationHandlers } = useStoryGeneration(storyDataState, uiState, showToast, addApiLogEntry, persistenceHandlers);
    const profileGenerationHandlers = useProfileGeneration(storyDataState, uiState, showToast, addApiLogEntry, _addEntryToIndex);
    const memoryManagementHandlers = useMemoryManagement(storyDataState, uiState, showToast, addApiLogEntry, _addEntryToIndex);
    const pdChatHandlers = usePdChat(storyDataState, uiState, showToast, addApiLogEntry);

    const handleCharacterUpdate = useCallback((updatedCharacter) => {
        if (storyDataState.storyId) {
            persistenceHandlers.handleUpdateAndSaveCharacter(updatedCharacter);
        } else {
            persistenceHandlers.handleUpdateCharacterLocally(updatedCharacter);
        }
    }, [storyDataState.storyId, persistenceHandlers]);


    const handleUploadProfileImage = useCallback(async (file, characterId) => {
        if (!storyDataState.storyId) {
            showToast("이미지를 업로드하려면 먼저 장면을 시작해야 합니다.", "error");
            return null;
        }
        if (!file) return null;
        if (file.size > 5 * 1024 * 1024) {
            showToast("이미지 파일은 5MB를 초과할 수 없습니다.", 'error');
            return null;
        }
        uiState.setIsProcessing(true);
        showToast("프로필 이미지를 업로드하는 중...", "default");
        try {
            const fileExtension = file.name.split('.').pop();
            const uploadPath = `images/${storyDataState.storyId}/${characterId}_${Date.now()}.${fileExtension}`;
            const downloadURL = await storyService.uploadImage(file, uploadPath);
            storyDataState.setCharacters(prev => 
                prev.map(c => c.id === characterId ? { ...c, profileImageUrl: downloadURL } : c)
            );
            showToast("프로필 이미지가 성공적으로 업로드되었습니다.", "success");
            return downloadURL;
        } catch (error) {
            console.error("이미지 업로드 실패:", error);
            showToast(`이미지 업로드 실패: ${error.message}`, "error");
            return null;
        } finally {
            uiState.setIsProcessing(false);
        }
    }, [storyDataState.storyId, storyDataState.setCharacters, uiState.setIsProcessing, showToast]);

    // [수정] handleUploadAsset 함수에서 isProcessing 상태 관리를 제거합니다.
    // 이제 이 함수는 단일 파일 업로드 로직에만 집중하고, 여러 파일의 처리 상태는 호출부(AssetTab)에서 관리합니다.
    const handleUploadAsset = useCallback(async (file, ownerId) => {
        if (!storyDataState.storyId) {
            throw new Error("에셋을 업로드하려면 먼저 장면을 시작해야 합니다.");
        }
        if (!ownerId) {
            throw new Error("에셋 소유자를 선택해주세요.");
        }
        
        try {
            const fileExtension = file.name.split('.').pop();
            const assetId = Date.now() + Math.random(); // 동시 업로드 시 ID 충돌 방지를 위해 random 추가
            const uploadPath = `assets/${storyDataState.storyId}/${assetId}.${fileExtension}`;
            
            const downloadURL = await storyService.uploadImage(file, uploadPath);

            const newAsset = {
                id: assetId,
                fileName: file.name,
                storageUrl: downloadURL,
                ownerId: ownerId,
            };

            // 상태를 직접 업데이트하는 대신, 생성된 새 에셋 정보를 반환합니다.
            return newAsset;

        } catch (error) {
            console.error("에셋 업로드 실패:", error);
            // 에러 발생 시 호출부에서 처리할 수 있도록 에러를 다시 던집니다.
            throw new Error(`'${file.name}' 업로드 실패: ${error.message}`);
        }
    }, [storyDataState.storyId]);

    const handleDeleteAsset = useCallback(async (assetToDelete) => {
        if (!storyDataState.storyId || !assetToDelete) return;
        uiState.setIsProcessing(true);
        try {
            await storyService.deleteImage(assetToDelete.storageUrl);

            const updatedAssets = storyDataState.assets.filter(asset => asset.id !== assetToDelete.id);
            storyDataState.setAssets(updatedAssets);
            await storyService.saveStory(storyDataState.storyId, { assets: updatedAssets });

            showToast(`'${assetToDelete.fileName}' 에셋이 삭제되었습니다.`);
        } catch (error) {
            console.error("에셋 삭제 실패:", error);
            showToast(`에셋 삭제 실패: ${error.message}`, "error");
        } finally {
            uiState.setIsProcessing(false);
        }
    }, [storyDataState.storyId, storyDataState.assets, storyDataState.setAssets, uiState.setIsProcessing, showToast]);


    const handleToggleFloater = useCallback((characterId) => {
        uiState.setFloatingStatusWindows(prev => prev.includes(characterId) ? prev.filter(id => id !== characterId) : [...prev, characterId]);
    }, [uiState.setFloatingStatusWindows]);

    const handlePinItem = useCallback((text) => {
        const newItem = { id: Date.now(), text, tags: [] };
        storyDataState.setPinnedItems(prev => [newItem, ...prev]);
        showToast('아이디어를 보드에 고정했습니다.', 'success');
    }, [storyDataState.setPinnedItems, showToast]);

    const handleUnpinItem = useCallback((id) => {
        storyDataState.setPinnedItems(prev => prev.filter(item => item.id !== id));
    }, [storyDataState.setPinnedItems]);

    const handleUpdatePinnedItem = useCallback((id, updatedData) => {
        storyDataState.setPinnedItems(prev => prev.map(item => item.id === id ? { ...item, ...updatedData } : item));
        showToast('고정된 아이디어를 수정했습니다.');
    }, [storyDataState.setPinnedItems, showToast]);
    
    const handleReorderPinnedItems = useCallback((reorderedItems) => {
        storyDataState.setPinnedItems(reorderedItems);
    }, [storyDataState.setPinnedItems]);

    const handleProposeReEvaluation = useCallback(async (characterId) => {
        if (uiState.isProcessing || !storyDataState.storyId) return;
        const character = storyDataState.characters.find(c => c.id === characterId);
        if (!character) return;
        uiState.setReEvaluation({ isOpen: true, isLoading: true, character, proposal: null });
        const recentMessages = storyDataState.messages.slice(-10).map(m => `[${m.sender}] ${m.style === 'Novel' ? (m.content.map(c => c.line || c.text).join(' ')) : m.text}`).join('\n');
        try {
            const { proposal, logEntry } = await utilityGenerator.reEvaluateCoreBeliefs(character, recentMessages, storyDataState.aiSettings.auxModel);
            addApiLogEntry(logEntry);
            uiState.setReEvaluation(prev => ({ ...prev, isLoading: false, proposal }));
        } catch (error) {
            showToast("심리 재평가 제안 중 오류 발생", 'error');
            uiState.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
        }
    }, [storyDataState, uiState, addApiLogEntry, showToast]);

    const handleConfirmReEvaluation = useCallback(async (isAccepted) => {
        const { character, proposal } = uiState.reEvaluation;
        if (isAccepted && proposal?.isChangeRecommended && character && storyDataState.storyId) {
            const updatedCharacters = storyDataState.characters.map(c => c.id === character.id ? { ...c, ...proposal.newProfile } : c);
            storyDataState.setCharacters(updatedCharacters);
            showToast(`${character.name}의 심리가 변화했습니다.`, 'success');
        }
        uiState.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
    }, [storyDataState, uiState, showToast]);

    const handleRequestSaveCharacterTemplate = (character) => {
        uiState.setCharacterToSave(character);
    };

    const handleConfirmSaveCharacterTemplate = (templateName) => {
        if (!templateName.trim() || !uiState.characterToSave) return;
        const characterData = { ...uiState.characterToSave, name: templateName };
        persistenceHandlers.handleSaveCharacterTemplate(characterData);
        uiState.setCharacterToSave(null);
    };

    const contextValue = useMemo(() => ({
        storyProps: { ...storyDataState, ...uiState },
        handlerProps: {
            ...storyDataState,
            ...uiState,
            ...persistenceHandlers,
            ...storyGenerationHandlers,
            ...profileGenerationHandlers,
            ...memoryManagementHandlers,
            ...pdChatHandlers,
            handleCharacterUpdate,
            handleProposeReEvaluation,
            handleConfirmReEvaluation,
            handleRequestSaveCharacterTemplate,
            handleConfirmSaveCharacterTemplate,
            handlePinItem,
            handleUnpinItem,
            handleUpdatePinnedItem,
            handleReorderPinnedItems,
            handleToggleFloater,
            handleUploadProfileImage,
            handleUploadAsset,
            handleDeleteAsset,
            showToast,
            _addEntryToIndex,
        }
    }), [
        storyDataState, uiState, persistenceHandlers, storyGenerationHandlers,
        profileGenerationHandlers, memoryManagementHandlers, pdChatHandlers,
        handleCharacterUpdate, handleProposeReEvaluation, handleConfirmReEvaluation,
        showToast, _addEntryToIndex, handlePinItem, handleUnpinItem,
        handleUpdatePinnedItem, handleReorderPinnedItems,
        handleRequestSaveCharacterTemplate, handleConfirmSaveCharacterTemplate,
        handleToggleFloater, handleUploadProfileImage,
        handleUploadAsset, handleDeleteAsset
    ]);

    return (
        <StoryContext.Provider value={contextValue}>
            {children}
        </StoryContext.Provider>
    );
};
