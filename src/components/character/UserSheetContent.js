import React, { useState, useEffect, useMemo } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import { updateNestedState } from '../../utils/stateUtils';
import { SheetHeader } from './SheetHeader';
import { UserSheet } from './UserSheet';

const formatUserToText = (character) => {
    let output = `≡≡≡ 유저 프로필: ${character.name} ≡≡≡\n\n`;
    output += `--- 기본 정보 ---\n`;
    output += `이름: ${character.name || ''}\n`;
    output += `외형: ${character.appearance || ''}\n`;
    output += `유저 컨셉: ${character.generationConcept  || ''}\n`;
    return output;
};

export const UserSheetContent = ({ character, onUpdate, onClose }) => {
    const [localCharacter, setLocalCharacter] = useState(character);

    const { storyProps, handlerProps } = useStoryContext();
    const { isProcessing } = storyProps;
    const { 
        showToast, 
        handleRequestSaveCharacterTemplate,
        handleUploadProfileImage,
    } = handlerProps;

    const hasChanges = useMemo(() => JSON.stringify(localCharacter) !== JSON.stringify(character), [localCharacter, character]);

    // [수정] character prop이 변경될 때마다 항상 localCharacter 상태를 동기화합니다.
    useEffect(() => {
        setLocalCharacter(character);
    }, [character]);

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
    
    const handleExportCharacter = () => {
        try {
            const textData = formatUserToText(localCharacter);
            const blob = new Blob([textData], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${localCharacter.name || 'User'}_profile.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            showToast(`${localCharacter.name || '유저'}의 프로필을 내보냈습니다.`, 'success');
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
                onExport={handleExportCharacter}
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
