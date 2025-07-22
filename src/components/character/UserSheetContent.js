import React, { useState, useEffect, useMemo } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import { updateNestedState } from '../../utils/stateUtils';
import { SheetHeader } from './SheetHeader';
import { UserSheet } from './UserSheet';

// [FEATURE] 유저 데이터를 텍스트로 변환하는 헬퍼 함수
const formatUserToText = (character) => {
    let output = `≡≡≡ 유저 프로필: ${character.name} ≡≡≡\n\n`;
    output += `--- 기본 정보 ---\n`;
    output += `이름: ${character.name}\n`;
    output += `외형: ${character.appearance}\n`;
    output += `유저 노트: ${character.note}\n`;
    return output;
};

export const UserSheetContent = ({ character, onUpdate, onClose }) => {
    const [localCharacter, setLocalCharacter] = useState(character);

    const { storyProps, handlerProps } = useStoryContext();
    const { isProcessing } = storyProps;
    const { showToast, handleRequestSaveCharacterTemplate } = handlerProps;

    const hasChanges = useMemo(() => JSON.stringify(localCharacter) !== JSON.stringify(character), [localCharacter, character]);

    useEffect(() => {
        setLocalCharacter(character);
    }, [character]);

    const handleLocalChange = (path, value) => {
        setLocalCharacter(updateNestedState(path, value));
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB 제한
                showToast("이미지 파일은 2MB를 초과할 수 없습니다.", "error");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => handleLocalChange('profileImageUrl', reader.result);
            reader.readAsDataURL(file);
        }
    };
    
    // [FEATURE] 유저 정보 내보내기 핸들러
    const handleExportCharacter = () => {
        try {
            const textData = formatUserToText(localCharacter);
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
                onSaveTemplate={() => handleRequestSaveCharacterTemplate(localCharacter)}
                onExport={handleExportCharacter} // [FEATURE] 핸들러 전달
                isProcessing={isProcessing}
            />
            <div className="p-4 md:p-6 flex-grow overflow-y-auto bg-[var(--bg-primary)]">
                <UserSheet
                    localCharacter={localCharacter}
                    handleLocalChange={handleLocalChange}
                    handleImageUpload={handleImageUpload}
                />
            </div>
        </>
    );
};