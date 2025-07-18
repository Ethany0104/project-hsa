import { useCallback, useMemo } from 'react';
import { useStateManager } from './useStateManager';
import { useStoryPersistence } from './useStoryPersistence';
import { useStoryGeneration } from './useStoryGeneration';
import { geminiService } from '../services/geminiService';

/**
 * 애플리케이션의 모든 로직을 총괄하고, 최종 Context 값을 제공하는 최상위 커스텀 훅입니다.
 * 각 전문 훅들(useStateManager, useStoryPersistence, useStoryGeneration)을 호출하고
 * 그 결과들을 조합하여 최종 `value` 객체를 생성합니다.
 * @returns {object} storyProps와 handlerProps를 포함하는 최종 value 객체
 */
export const useStory = () => {
    // 1. 상태 전문가를 고용한다.
    const allStates = useStateManager();
    
    // 2. 보조 함수들을 준비한다.
    const showToast = useCallback((message) => allStates.setToast({ show: true, message }), [allStates.setToast]);
    const addApiLogEntry = useCallback((entry) => {
        if (!entry) return;
        allStates.setApiLog(prev => {
            const newLog = [entry, ...prev.log].slice(0, 15);
            const newSummary = { ...prev.summary };
            const modelKey = entry.model ? entry.model.toLowerCase() : 'unknown';
            if (!newSummary[modelKey]) newSummary[modelKey] = { calls: 0, totalTokens: 0 };
            newSummary[modelKey].calls += 1;
            newSummary[modelKey].totalTokens += entry.totalTokens;
            return { log: newLog, summary: newSummary };
        });
    }, [allStates.setApiLog]);

    // 3. 데이터 저장/로드 전문가를 고용한다.
    const persistenceHandlers = useStoryPersistence(allStates, showToast);
    
    // 4. AI 스토리 생성 전문가를 고용한다.
    const generationHandlers = useStoryGeneration(allStates, showToast, addApiLogEntry, persistenceHandlers);

    // 5. 아직 분리되지 않은 나머지 핸들러들을 정의한다. (심리 재평가 등)
    const handleProposeReEvaluation = useCallback(async (characterId) => {
        if (allStates.isProcessing || !allStates.storyId) return;
        const character = allStates.characters.find(c => c.id === characterId);
        if (!character) return;
        allStates.setReEvaluation({ isOpen: true, isLoading: true, character, proposal: null });
        const recentMessages = allStates.messages.slice(-10).map(m => m.sender === 'player' ? `${character.name}: ${m.text}` : `상대: ${m.content.map(c => c.text || c.line).join(' ')}`).join('\n');
        try {
            const { proposal, logEntry } = await geminiService.reEvaluateCoreBeliefs(character, recentMessages);
            addApiLogEntry(logEntry);
            allStates.setReEvaluation(prev => ({ ...prev, isLoading: false, proposal }));
        } catch (error) {
            showToast("심리 재평가 제안 중 오류 발생");
            allStates.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
        }
    }, [allStates, addApiLogEntry, showToast]);

    const handleConfirmReEvaluation = useCallback(async (isAccepted) => {
        const { character, proposal } = allStates.reEvaluation;
        if (isAccepted && proposal?.isChangeRecommended && character && allStates.storyId) {
            const updatedCharacters = allStates.characters.map(c => c.id === character.id ? { ...c, ...proposal.newProfile } : c);
            allStates.setCharacters(updatedCharacters);
            const updatedCharForVector = updatedCharacters.find(c => c.id === character.id);
            if (updatedCharForVector) {
                const profileText = `[캐릭터 프로필] 이름: ${updatedCharForVector.name}, 노트: ${updatedCharForVector.note}. 결정적 경험: ${updatedCharForVector.formativeEvent}. 핵심 원칙: ${updatedCharForVector.corePrinciple}. 코어 디자이어: ${updatedCharForVector.coreDesire}.`;
                await generationHandlers._addEntryToIndex('characterIndex', { id: `L0_char_${character.id}`, text: profileText, level: 0, source_ids: [character.id.toString()] }, allStates.storyId);
            }
            showToast(`${character.name}의 심리가 변화했습니다.`);
        }
        allStates.setReEvaluation({ isOpen: false, isLoading: false, character: null, proposal: null });
    }, [allStates, generationHandlers, showToast]);

    const handleRequestSaveCharacterTemplate = (character) => {
        if (!character) return;
        allStates.setCharacterToSave(character);
    };

    const handleConfirmSaveCharacterTemplate = (templateName) => {
        if (!templateName.trim() || !allStates.characterToSave) {
            showToast("프리셋 이름을 입력해주세요.");
            return;
        }
        const characterData = {
            ...allStates.characterToSave,
            name: templateName, // Use the new name from the modal
        };
        persistenceHandlers.handleSaveCharacterTemplate(characterData);
        allStates.setCharacterToSave(null); // Close modal
    };

    // 6. 모든 전문가들의 결과물을 모아 최종적으로 제공할 `value`를 조립한다.
    return useMemo(() => ({
        storyProps: allStates,
        handlerProps: {
            ...allStates, // 모든 set 함수들을 포함
            ...persistenceHandlers,
            ...generationHandlers,
            handleProposeReEvaluation,
            handleConfirmReEvaluation,
            handleRequestSaveCharacterTemplate,
            handleConfirmSaveCharacterTemplate,
        }
    }), [allStates, persistenceHandlers, generationHandlers, handleProposeReEvaluation, handleConfirmReEvaluation]);
};
