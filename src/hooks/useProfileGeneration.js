import { useCallback } from 'react';
import { profileGenerator } from '../services';

/**
 * 페르소나 프로필 생성 관련 로직을 전담하는 훅
 */
export const useProfileGeneration = (storyDataState, uiState, showToast, addApiLogEntry, _addEntryToIndex) => {
    const { characters, aiSettings, storyId, setCharacters } = storyDataState;
    const { isProcessing, setIsProcessing } = uiState;

    const handleGenerateFullProfile = useCallback(async (characterId) => {
        if (isProcessing) return;
        const characterToUpdate = characters.find(c => c.id === characterId);
        if (!characterToUpdate || characterToUpdate.isUser) {
            showToast("페르소나 프로필만 생성할 수 있습니다.", 'error');
            return null;
        }
        setIsProcessing(true);
        let tempProfile = { ...characterToUpdate };
        try {
            const auxModel = aiSettings.auxModel;

            const generationSteps = [
                { name: "서사 프로필", generator: profileGenerator.generateNarrativeProfile },
                { name: "연기 가이드", generator: profileGenerator.generateRoleplayGuide },
                { name: "성격 프로필(BIG5)", generator: profileGenerator.generateBig5Profile },
                { name: "생활 양식 & 취향", generator: profileGenerator.generateLifestyle },
                { name: "방어기제", generator: profileGenerator.generatePsyche },
                { name: "리비도 & 친밀감", generator: profileGenerator.generateLibido },
                { name: "공간과 사물", generator: profileGenerator.generateSpace }
            ];

            for (const step of generationSteps) {
                showToast(`AI가 ${step.name}을(를) 생성 중입니다...`);
                const { data, logEntry } = await step.generator(tempProfile, auxModel);
                addApiLogEntry(logEntry);
                tempProfile = { ...tempProfile, ...data };
            }
            
            const updatedCharacters = characters.map(c => c.id === characterId ? tempProfile : c);
            setCharacters(updatedCharacters);
            
            if (storyId) {
                const profileText = `[페르소나 프로필] 이름: ${tempProfile.name}. 서사: ${tempProfile.formativeEvent}. 성격: ${JSON.stringify(tempProfile.big5)}.`;
                await _addEntryToIndex('characterIndex', { id: `L0_char_${characterId}`, text: profileText, level: 0, source_ids: [characterId.toString()] }, storyId);
            }
            showToast(`${characterToUpdate.name}의 AI 전체 프로필이 완성되었습니다.`);
            return tempProfile;
        } catch (error) {
            showToast(`AI 프로필 생성 오류: ${error.message}`, 'error');
            return null;
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, characters, aiSettings.auxModel, addApiLogEntry, _addEntryToIndex, storyId, setCharacters, setIsProcessing, showToast]);

    const handleGenerateSchedule = useCallback(async (characterId) => {
        if (isProcessing) return;
        const characterToUpdate = characters.find(c => c.id === characterId);
        if (!characterToUpdate || characterToUpdate.isUser) {
            showToast("페르소나의 시간표만 생성할 수 있습니다.", 'error');
            return;
        }
        setIsProcessing(true);
        showToast(`${characterToUpdate.name}의 하루를 생성하는 중...`);
        try {
            const { data, logEntry } = await profileGenerator.generateDailySchedule(characterToUpdate, aiSettings.auxModel);
            addApiLogEntry(logEntry);
            const updatedCharacters = characters.map(c => c.id === characterId ? { ...c, dailySchedule: data.dailySchedule } : c);
            setCharacters(updatedCharacters);
            showToast(`${characterToUpdate.name}의 시간표가 생성되었습니다.`);
        } catch (error) {
            showToast(`시간표 생성 오류: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, characters, aiSettings.auxModel, setCharacters, addApiLogEntry, showToast, setIsProcessing]);

    const handleGenerateEmotionProfile = useCallback(async (characterId) => {
        if (isProcessing) return;
        const characterToUpdate = characters.find(c => c.id === characterId);
        if (!characterToUpdate || characterToUpdate.isUser) {
            showToast("페르소나의 감정 프로필만 생성할 수 있습니다.", 'error');
            return;
        }
        setIsProcessing(true);
        showToast(`${characterToUpdate.name}의 감정 프로필을 분석하는 중...`);
        try {
            const { data, logEntry } = await profileGenerator.generateEmotionProfile(characterToUpdate, aiSettings.auxModel);
            addApiLogEntry(logEntry);
            const updatedCharacters = characters.map(c => c.id === characterId ? { ...c, ...data } : c);
            setCharacters(updatedCharacters);
            showToast(`${characterToUpdate.name}의 감정 프로필이 생성되었습니다.`);
        } catch (error) {
            showToast(`감정 프로필 생성 오류: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [isProcessing, characters, aiSettings.auxModel, setCharacters, addApiLogEntry, showToast, setIsProcessing]);

    return {
        handleGenerateFullProfile,
        handleGenerateSchedule,
        handleGenerateEmotionProfile,
    };
};
