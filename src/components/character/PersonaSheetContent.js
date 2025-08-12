import React, { useMemo } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import { updateNestedState } from '../../utils/stateUtils';
import { SheetHeader } from './SheetHeader';
import { NpcSheet } from './PersonaSheet';
import { useSyncedLocalState } from '../../hooks/useSyncedLocalState'; // [수정] 커스텀 훅 임포트

const formatCharacterToText = (character, allCharacters) => {
    let output = `≡≡≡ 페르소나 프로필: ${character.name} ≡≡≡\n\n`;

    const formatSection = (title, data) => {
        if (!data) return '';
        let sectionText = `--- ${title} ---\n`;
        Object.entries(data).forEach(([key, value]) => {
            if (value && typeof value !== 'object') {
                sectionText += `${key}: ${value}\n`;
            } else if (value && typeof value === 'object' && !Array.isArray(value)) {
                sectionText += `${key}:\n`;
                Object.entries(value).forEach(([subKey, subValue]) => {
                    if (subValue && typeof subValue !== 'object') {
                        sectionText += `  - ${subKey}: ${subValue}\n`;
                    }
                });
            }
        });
        return sectionText + '\n';
    };

    output += formatSection('기본 정보', {
        '이름': character.name,
        '나이': character.age,
        '직업': character.job,
        '외형': character.appearance,
        '생성 컨셉': character.generationConcept,
    });

    output += formatSection('서사적 프로필', {
        '결정적 경험': character.formativeEvent,
        '핵심 원칙': character.corePrinciple,
        '코어 디자이어': character.coreDesire,
    });

    output += formatSection('연기 가이드', character.roleplayGuide);
    output += formatSection('생활 양식', character.lifestyle);
    output += formatSection('내면 (방어기제)', character.psyche);
    output += formatSection('리비도 & 친밀감', {
        ...character.libido,
        bdsmProfile: `지배/복종: ${character.libido?.bdsmProfile?.dominance}, 가학/피학: ${character.libido?.bdsmProfile?.sadism}, 정신/육체: ${character.libido?.bdsmProfile?.psychological}`
    });
    output += formatSection('취향', character.preferences);
    output += formatSection('공간과 사물', { '거주 공간': character.space?.livingSpace });

    if (character.space?.cherishedPossessions?.length > 0) {
        output += '소중한 물건:\n';
        character.space.cherishedPossessions.forEach(item => {
            output += `  - ${item.name}: ${item.story}\n`;
        });
        output += '\n';
    }

    if (character.relationships?.length > 0) {
        output += '--- 관계망 ---\n';
        character.relationships.forEach(rel => {
            const targetName = allCharacters.find(c => c.id === rel.targetId)?.name || '알 수 없는 대상';
            output += `- 대상: ${targetName}\n`;
            output += `  유형: ${rel.type}\n`;
            output += `  역사: ${rel.history}\n`;
        });
        output += '\n';
    }

    return output;
};


export const PersonaSheetContent = ({ character, onUpdate, onClose }) => {
    // [수정] useState와 useEffect를 커스텀 훅으로 교체
    const [localCharacter, setLocalCharacter] = useSyncedLocalState(character);

    const { storyProps, handlerProps } = useStoryContext();
    const {
        characters,
        messages,
        latestEmotionAnalysis,
        isProcessing,
    } = storyProps;

    const {
        showToast,
        handleGenerateFullProfile,
        handleProposeReEvaluation,
        handleRequestSaveCharacterTemplate,
        handleGenerateSchedule,
        handleGenerateEmotionProfile,
        handleUploadProfileImage,
    } = handlerProps;

    const hasChanges = useMemo(() => JSON.stringify(localCharacter) !== JSON.stringify(character), [localCharacter, character]);
    const canReEvaluate = useMemo(() => messages.length >= 10, [messages]);

    const handleLocalChange = (path, value) => {
        setLocalCharacter(updateNestedState(path, value));
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const newUrl = await handleUploadProfileImage(file, localCharacter.id);
            if (newUrl) {
                handleLocalChange('profileImageUrl', newUrl);
            }
        }
    };

    const handleGenerateProfile = async () => {
        const newProfile = await handleGenerateFullProfile(localCharacter.id);
        if (newProfile) {
            setLocalCharacter(newProfile);
        }
    };

    const handleExportCharacter = () => {
        try {
            const textData = formatCharacterToText(localCharacter, characters);
            const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${localCharacter.name}_profile.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast(`${localCharacter.name}의 프로필을 내보냈습니다.`, 'success');
        } catch (error) {
            console.error("프로필 내보내기 오류:", error);
            showToast("프로필을 내보내는 중 오류가 발생했습니다.", 'error');
        }
    };

    return (
        <>
            <SheetHeader
                character={localCharacter}
                hasChanges={hasChanges}
                onUpdate={() => onUpdate(localCharacter)}
                onClose={onClose}
                onGenerateProfile={handleGenerateProfile}
                onReEvaluate={() => handleProposeReEvaluation(localCharacter.id)}
                onSaveTemplate={() => handleRequestSaveCharacterTemplate(localCharacter)}
                onExport={handleExportCharacter}
                isProcessing={isProcessing}
                canReEvaluate={canReEvaluate}
            />
            <div className="p-4 md:p-6 flex-grow overflow-y-auto bg-[var(--bg-primary)]">
                <NpcSheet
                    localCharacter={localCharacter}
                    allCharacters={characters}
                    handleLocalChange={handleLocalChange}
                    handleImageUpload={handleImageUpload}
                    handleGenerateSchedule={() => handleGenerateSchedule(localCharacter.id)}
                    handleGenerateEmotionProfile={() => handleGenerateEmotionProfile(localCharacter.id)}
                    latestEmotionAnalysis={latestEmotionAnalysis}
                />
            </div>
        </>
    );
};
