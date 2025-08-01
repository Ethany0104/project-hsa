// src/contexts/StoryProvider.js

import React, { useMemo, useCallback, useContext } from 'react';
import { useStateManager } from '../hooks/useStateManager';
import { useStoryPersistence } from '../hooks/useStoryPersistence';
import { useStoryGeneration } from '../hooks/useStoryGeneration';
import { useProfileGeneration } from '../hooks/useProfileGeneration';
import { useMemoryManagement } from '../hooks/useMemoryManagement';
import { usePdChat } from '../hooks/usePdChat';
import { utilityGenerator, storyService } from '../services';

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

    const handleUploadProfileImage = useCallback(async (file, characterId) => {
        if (!storyDataState.storyId) {
            showToast("이미지를 업로드하려면 먼저 장면을 시작해야 합니다.", "error");
            return null;
        }
        if (!file) return null;

        if (file.size > 5 * 1024 * 1024) { // 5MB 제한
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
                prev.map(c => 
                    c.id === characterId ? { ...c, profileImageUrl: downloadURL } : c
                )
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

    const handleToggleFloater = useCallback((characterId) => {
        uiState.setFloatingStatusWindows(prev => {
            if (prev.includes(characterId)) {
                return prev.filter(id => id !== characterId);
            } else {
                return [...prev, characterId];
            }
        });
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
            showToast,
            _addEntryToIndex,
        }
    }), [
        storyDataState, uiState, persistenceHandlers, storyGenerationHandlers,
        profileGenerationHandlers, memoryManagementHandlers, pdChatHandlers,
        handleProposeReEvaluation, handleConfirmReEvaluation,
        showToast, _addEntryToIndex, handlePinItem, handleUnpinItem,
        handleUpdatePinnedItem, handleReorderPinnedItems,
        handleRequestSaveCharacterTemplate, handleConfirmSaveCharacterTemplate,
        handleToggleFloater,
        handleUploadProfileImage
    ]);

    return (
        <StoryContext.Provider value={contextValue}>
            {children}
        </StoryContext.Provider>
    );
};
