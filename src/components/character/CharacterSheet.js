import React, { useEffect, useState, useMemo, useContext } from 'react';
import { ICONS } from '../../constants';
import { convertAnimaToRisu } from '../../services/cardService';

// --- Context Imports ---
import { StoryDataContext } from '../../contexts/StoryDataContext';
import { UIStateContext } from '../../contexts/UIStateContext';

// --- UI Component Imports ---
import { Spinner } from '../ui/widgets';
import { ProtagonistSheet } from './ProtagonistSheet';
import { NpcSheet } from './NpcSheet';

// --- User needs to install these packages ---
// npm install png-chunks-extract png-chunks-encode png-chunk-text
import extract from 'png-chunks-extract';
import encode from 'png-chunks-encode';
import { encode as encodeTextChunk } from 'png-chunk-text';


/**
 * 캐릭터 시트의 최상위 컴포넌트.
 * 캐릭터 타입(주인공/NPC)에 따라 적절한 시트를 렌더링하고,
 * 공통 로직(헤더, 상태 관리, 버튼 액션)을 처리합니다.
 */
export const CharacterSheet = ({ character, onUpdate, onClose }) => {
    // 필요한 상태와 핸들러를 각 Context에서 분리하여 가져옵니다.
    const { messages, characters, handleGenerateFullProfile, handleProposeReEvaluation, handleRequestSaveCharacterTemplate } = useContext(StoryDataContext);
    const { isProcessing, setToast } = useContext(UIStateContext);
    
    const [localCharacter, setLocalCharacter] = useState(character);

    useEffect(() => {
        setLocalCharacter(character);
    }, [character]);
    
    const handleLocalChange = (path, value) => {
        setLocalCharacter(prev => {
            const newState = JSON.parse(JSON.stringify(prev));
            const keys = path.split('.');
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (typeof current[key] !== 'object' || current[key] === null) {
                    current[key] = {};
                }
                current = current[key];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    };
    
    const hasChanges = useMemo(() => JSON.stringify(localCharacter) !== JSON.stringify(character), [localCharacter, character]);
    const canReEvaluate = useMemo(() => character && !character.isProtagonist && messages.length >= 10, [character, messages]);
    
    if (!character) return null;

    const isGenerateDisabled = !character || character.isProtagonist || !character.name?.trim() || !character.appearance?.trim() || !character.note?.trim();
    
    const generateButtonTitle = () => {
        if (character.isProtagonist) return "주인공 프로필은 생성할 수 없습니다.";
        if (isGenerateDisabled) return "이름, 외형, 노트를 모두 입력해야 AI 프로필 생성이 가능합니다.";
        return "AI 전체 프로필 자동 생성";
    };
    
    const handleSaveAsTemplateClick = () => {
        handleRequestSaveCharacterTemplate(localCharacter);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { // 2MB size limit
                setToast({ show: true, message: "이미지 파일은 2MB를 초과할 수 없습니다."});
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                handleLocalChange('profileImageUrl', reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleExportToRisu = async () => {
        try {
            const risuData = convertAnimaToRisu(localCharacter);
            if (!risuData) {
                setToast({ show: true, message: "캐릭터 데이터가 없어 내보낼 수 없습니다." });
                return;
            }
            
            const jsonString = JSON.stringify(risuData);
            const base64Data = btoa(unescape(encodeURIComponent(jsonString)));

            const imageSrc = localCharacter.profileImageUrl || `https://placehold.co/512x768/333333/FFFFFF?text=${encodeURIComponent(localCharacter.name || 'ANIMA')}`;
            
            const response = await fetch(imageSrc);
            if (!response.ok) throw new Error('이미지를 불러올 수 없습니다.');
            const imageBlob = await response.blob();
            const pngArrayBuffer = await imageBlob.arrayBuffer();

            const chunks = extract(new Uint8Array(pngArrayBuffer));
            const textChunk = encodeTextChunk('chara', base64Data);
            const iendIndex = chunks.findIndex(c => c.name === 'IEND');
            chunks.splice(iendIndex, 0, textChunk); 

            const newPngData = encode(chunks);
            const blob = new Blob([newPngData], { type: 'image/png' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${localCharacter.name || 'character'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);

            setToast({ show: true, message: `'${localCharacter.name}' RisuAI 카드 생성 완료!` });

        } catch (error) {
            console.error("RisuAI 카드 내보내기 오류:", error);
            setToast({ show: true, message: `카드 생성 오류: ${error.message}` });
        }
    };

    return (
        <>
            <header className="p-4 border-b border-[var(--border)] flex justify-between items-center flex-shrink-0">
                <div className="flex items-center">
                    <ICONS.LucideUserCog className="w-7 h-7 mr-4 text-[var(--accent)] flex-shrink-0" />
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-[var(--text-secondary)]">캐릭터 시트</span>
                        <span className="text-2xl font-bold text-[var(--text-primary)] leading-tight -mt-0.5">{localCharacter.name || "새 인물"}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2">
                    {hasChanges && <span className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-pulse mr-2" title="저장되지 않은 변경사항이 있습니다."></span>}
                    
                    {!localCharacter.isProtagonist && (
                        <>
                            <button 
                                onClick={() => handleProposeReEvaluation(localCharacter.id)} 
                                disabled={!canReEvaluate || isProcessing} 
                                className="flex items-center px-3 py-1.5 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs transition-colors font-sans disabled:opacity-50 whitespace-nowrap" 
                                title={canReEvaluate ? "핵심 심리 재평가 제안" : "의미있는 사건 발생 후 활성화 (대화 10개 이상 필요)"}
                            >
                                <ICONS.LucideBrainCircuit className="w-4 h-4 mr-1.5" /> 재해석
                            </button>
                            <button 
                                onClick={() => handleGenerateFullProfile(localCharacter.id)} 
                                disabled={isProcessing || isGenerateDisabled} 
                                className="flex items-center px-3 py-1.5 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs transition-colors font-sans disabled:opacity-50 whitespace-nowrap" 
                                title={generateButtonTitle()}
                            >
                                {isProcessing ? <Spinner /> : <ICONS.LucideSparkles className="w-4 h-4 mr-1.5" />} 프로필 생성
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => onUpdate(localCharacter)} 
                        disabled={!hasChanges || isProcessing} 
                        className="flex items-center px-3 py-1.5 bg-green-600 text-white border border-green-700 hover:bg-green-700 rounded-md text-xs transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                        <ICONS.LucideSave className="w-4 h-4 mr-1.5" /> 변경사항 저장
                    </button>
                    <button
                        onClick={handleSaveAsTemplateClick}
                        disabled={isProcessing}
                        className="flex items-center px-3 py-1.5 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs transition-colors font-sans disabled:opacity-50 whitespace-nowrap"
                        title="템플릿으로 저장"
                    >
                        <ICONS.LucideFileArchive className="w-4 h-4 mr-1.5" /> 템플릿 저장
                    </button>
                    <button
                        onClick={handleExportToRisu}
                        disabled={isProcessing}
                        className="flex items-center px-3 py-1.5 bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 rounded-md text-xs transition-colors font-sans disabled:opacity-50 whitespace-nowrap"
                        title="RisuAI 카드로 내보내기"
                    >
                        <ICONS.LucideShare2 className="w-4 h-4 mr-1.5" /> RisuAI로 내보내기
                    </button>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2">
                        <ICONS.LucideX />
                    </button>
                </div>
            </header>

            <div className="p-4 md:p-6 flex-grow overflow-y-auto">
                <div className={`grid grid-cols-1 ${!localCharacter.isProtagonist ? 'lg:grid-cols-3' : 'lg:max-w-md mx-auto'} gap-6`}>
                    {localCharacter.isProtagonist ? (
                        <ProtagonistSheet 
                            localCharacter={localCharacter}
                            handleLocalChange={handleLocalChange}
                            handleImageUpload={handleImageUpload}
                            handleSaveAsTemplateClick={handleSaveAsTemplateClick}
                            isProcessing={isProcessing}
                        />
                    ) : (
                        <NpcSheet 
                            localCharacter={localCharacter}
                            allCharacters={characters}
                            handleLocalChange={handleLocalChange}
                            handleImageUpload={handleImageUpload}
                        />
                    )}
                </div>
            </div>
        </>
    );
};
