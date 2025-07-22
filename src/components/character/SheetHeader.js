import React from 'react';
import { ICONS } from '../../constants';
import { Spinner } from '../ui';

/**
 * 사용자 및 페르소나 시트의 공통 헤더 컴포넌트
 */
// [FEATURE] onExport prop 추가
export const SheetHeader = ({ character, hasChanges, onUpdate, onClose, onGenerateProfile, onReEvaluate, onSaveTemplate, onExport, isProcessing, canReEvaluate }) => {
    
    const getGenerateButtonTooltip = () => {
        if (hasChanges) {
            return "변경사항을 먼저 저장해야 AI 프로필 생성이 가능합니다.";
        }
        if (!character.name || !character.appearance) {
            return "이름과 외형을 모두 입력해야 AI 프로필 생성이 가능합니다.";
        }
        return "AI 전체 프로필 자동 생성";
    };
    
    const isGenerateDisabled = isProcessing || !character.name || !character.appearance || hasChanges;

    return (
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0 sticky top-0 bg-[var(--panel-bg)] z-10">
            {/* 캐릭터 정보 (이름, 타입) */}
            <div className="flex items-center min-w-0">
                <ICONS.LucideUserCog className="w-8 h-8 mr-4 text-[var(--accent-primary)] flex-shrink-0" />
                <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-[var(--text-secondary)]">{character.isUser ? 'User Sheet' : 'Persona Sheet'}</span>
                    <span className="text-2xl font-bold text-[var(--text-primary)] leading-tight -mt-0.5 truncate">{character.name || "새 인물"}</span>
                </div>
            </div>

            {/* 액션 버튼 그룹 */}
            <div className="flex items-center space-x-1.5 flex-shrink-0">
                {/* 저장되지 않은 변경사항 알림 */}
                {hasChanges && <div className="w-2.5 h-2.5 bg-[var(--warning)] rounded-full animate-pulse mr-2" title="저장되지 않은 변경사항이 있습니다."></div>}
                
                {/* 페르소나 전용 버튼 (AI 기능) */}
                {!character.isUser && (
                    <>
                        <button onClick={onReEvaluate} disabled={!canReEvaluate || isProcessing} title={canReEvaluate ? "핵심 심리 재평가 제안" : "의미있는 사건 발생 후 활성화 (대화 10개 이상 필요)"} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] disabled:opacity-50">
                            <ICONS.LucideBrainCircuit className="w-5 h-5" />
                        </button>
                        <button onClick={onGenerateProfile} disabled={isGenerateDisabled} title={getGenerateButtonTooltip()} className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)] disabled:opacity-50">
                            {isProcessing ? <Spinner className="w-5 h-5"/> : <ICONS.LucideSparkles className="w-5 h-5" />}
                        </button>
                    </>
                )}

                {/* 공통 버튼 */}
                <button onClick={onUpdate} disabled={!hasChanges || isProcessing} title="변경사항 저장" className="p-2 rounded-md text-white bg-[var(--success)] hover:bg-green-700 disabled:bg-gray-600">
                    <ICONS.LucideSave className="w-5 h-5" />
                </button>
                <div className="w-px h-6 bg-[var(--border-primary)] mx-1.5"></div>
                <button onClick={onSaveTemplate} disabled={isProcessing} title="템플릿으로 저장" className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)]">
                    <ICONS.LucideFileArchive className="w-5 h-5" />
                </button>
                {/* [FEATURE] 내보내기 버튼 추가 */}
                {onExport && (
                    <button onClick={onExport} disabled={isProcessing} title="TXT 파일로 내보내기" className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)]">
                        <ICONS.LucideFileDown className="w-5 h-5" />
                    </button>
                )}
                <button onClick={onClose} title="닫기" className="p-2 rounded-md text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--accent-primary)]">
                    <ICONS.LucideX className="w-5 h-5" />
                </button>
            </div>
        </header>
    );
}