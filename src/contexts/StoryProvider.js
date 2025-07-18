import React, { useMemo, useCallback } from 'react';
import { StoryDataContext } from './StoryDataContext';
import { UIStateContext } from './UIStateContext';
import { useStateManager } from '../hooks/useStateManager';
import { useStoryPersistence } from '../hooks/useStoryPersistence';
import { useStoryGeneration } from '../hooks/useStoryGeneration';
import { geminiService } from '../services/geminiService';

// 다른 컴포넌트에서 Context를 쉽게 사용하기 위한 헬퍼 훅
export const useStoryContext = () => {
    const storyData = React.useContext(StoryDataContext);
    const uiState = React.useContext(UIStateContext);
    if (!storyData || !uiState) {
        throw new Error('useStoryContext must be used within a StoryProvider');
    }

    // storyProps와 handlerProps를 조합하여 반환
    // 이제 handlerProps는 모든 상태 set 함수와 모든 핸들러 함수를 포함하게 됨
    return {
        storyProps: { ...storyData, ...uiState },
        handlerProps: { ...storyData, ...uiState }
    };
};


/**
 * 애플리케이션의 모든 상태와 로직을 제공하는 최상위 Provider 컴포넌트.
 * 내부적으로 StoryData와 UIState 컨텍스트로 분리하여 관리합니다.
 * @param {object} props - { children: React.ReactNode }
 */
export const StoryProvider = ({ children }) => {
    const { storyDataState, uiState } = useStateManager();

    const showToast = useCallback((message) => {
        uiState.setToast({ show: true, message });
    }, [uiState]);

    const addApiLogEntry = useCallback((entry) => {
        if (!entry) return;
        storyDataState.setApiLog(prev => {
            const newLog = [entry, ...prev.log].slice(0, 15);
            const newSummary = { ...prev.summary };
            const modelKey = entry.model ? entry.model.toLowerCase() : 'unknown';
            if (!newSummary[modelKey]) newSummary[modelKey] = { calls: 0, totalTokens: 0 };
            newSummary[modelKey].calls += 1;
            newSummary[modelKey].totalTokens += entry.totalTokens;
            return { log: newLog, summary: newSummary };
        });
    }, [storyDataState]);

    const persistenceHandlers = useStoryPersistence(storyDataState, uiState, showToast);
    const generationHandlers = useStoryGeneration(storyDataState, uiState, showToast, addApiLogEntry, persistenceHandlers);
    
    // --- 최종 로직 핸들러 ---
    const handleProposeReEvaluation = useCallback(async (characterId) => {
        if (uiState.isProcessing || !storyDataState.storyId) return;
        const character = storyDataState.characters.find(c => c.id === characterId);
        if (!character) return;
        uiState.setReEvaluation({ isOpen: true, isLoading: true, character, proposal: null });
        const recentMessages = storyDataState.messages.slice(-10).map(m => m.sender === 'player' ? `${character.name}: ${m.text}` : `상대: ${m.content.map(c => c.text || c.line).join(' ')}`).join('\n');
        try {
            const { proposal, logEntry } = await geminiService.reEvaluateCoreBeliefs(character, recentMessages, storyDataState.aiSettings.auxModel);
            addApiLogEntry(logEntry);
            uiState.setReEvaluation(prev => ({ ...prev, isLoading: false, proposal }));
        } catch (error) {
            showToast("심리 재평가 제안 중 오류 발생");
            uiState.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
        }
    }, [storyDataState, uiState, addApiLogEntry, showToast]);

    const handleConfirmReEvaluation = useCallback(async (isAccepted) => {
        const { character, proposal } = uiState.reEvaluation;
        if (isAccepted && proposal?.isChangeRecommended && character && storyDataState.storyId) {
            const updatedCharacters = storyDataState.characters.map(c => c.id === character.id ? { ...c, ...proposal.newProfile } : c);
            storyDataState.setCharacters(updatedCharacters);
            const updatedCharForVector = updatedCharacters.find(c => c.id === character.id);
            if (updatedCharForVector) {
                const profileText = `[캐릭터 프로필] 이름: ${updatedCharForVector.name}, 노트: ${updatedCharForVector.note}. 결정적 경험: ${updatedCharForVector.formativeEvent}. 핵심 원칙: ${updatedCharForVector.corePrinciple}. 코어 디자이어: ${updatedCharForVector.coreDesire}.`;
                await generationHandlers._addEntryToIndex('characterIndex', { id: `L0_char_${character.id}`, text: profileText, level: 0, source_ids: [character.id.toString()] }, storyDataState.storyId);
            }
            showToast(`${character.name}의 심리가 변화했습니다.`);
        }
        uiState.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
    }, [storyDataState, uiState, generationHandlers, showToast]);

    const handleRequestSaveCharacterTemplate = (character) => {
        if (!character) return;
        uiState.setCharacterToSave(character);
    };

    const handleConfirmSaveCharacterTemplate = (templateName) => {
        if (!templateName.trim() || !uiState.characterToSave) {
            showToast("프리셋 이름을 입력해주세요.");
            return;
        }
        const characterData = {
            ...uiState.characterToSave,
            name: templateName,
        };
        persistenceHandlers.handleSaveCharacterTemplate(characterData);
        uiState.setCharacterToSave(null);
    };


    const allHandlers = useMemo(() => ({
        ...persistenceHandlers,
        ...generationHandlers,
        handleProposeReEvaluation,
        handleConfirmReEvaluation,
        handleRequestSaveCharacterTemplate,
        handleConfirmSaveCharacterTemplate,
    }), [persistenceHandlers, generationHandlers, handleProposeReEvaluation, handleConfirmReEvaluation, handleRequestSaveCharacterTemplate, handleConfirmSaveCharacterTemplate]);

    // 최종적으로 각 Context에 전달될 값들을 생성합니다.
    // 상태(state)와 모든 핸들러 함수(setters, handlers)를 포함합니다.
    const storyDataContextValue = useMemo(() => ({
        ...storyDataState,
        ...allHandlers,
    }), [storyDataState, allHandlers]);

    const uiStateContextValue = useMemo(() => ({
        ...uiState,
        ...allHandlers,
    }), [uiState, allHandlers]);


    return (
        <StoryDataContext.Provider value={storyDataContextValue}>
            <UIStateContext.Provider value={uiStateContextValue}>
                {children}
            </UIStateContext.Provider>
        </StoryDataContext.Provider>
    );
};
