import React, { useContext } from 'react';
import { ICONS } from '../../../constants';
import { UIStateContext } from '../../../contexts/UIStateContext';
import { StoryDataContext } from '../../../contexts/StoryDataContext';
import { Spinner } from '../widgets';

/**
 * 캐릭터 심리 재평가 제안 모달
 */
export const ReEvaluationModal = () => {
    const { reEvaluation, setReEvaluation } = useContext(UIStateContext);
    const { handleConfirmReEvaluation } = useContext(StoryDataContext);
    
    const { isOpen, isLoading, character, proposal } = reEvaluation;

    const handleClose = () => {
        setReEvaluation(prev => ({ ...prev, isOpen: false }));
    };

    const handleConfirm = (isAccepted) => {
        handleConfirmReEvaluation(isAccepted);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn backdrop-blur-sm">
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col border border-[var(--border)]">
                <header className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[var(--accent)] font-sans flex items-center">
                        <ICONS.LucideBrainCircuit className="inline-block w-5 h-5 mr-2" />
                        {character?.name}의 핵심 심리 재평가
                    </h2>
                    <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ICONS.LucideX /></button>
                </header>
                <div className="p-6 overflow-y-auto font-sans">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64">
                            <Spinner />
                            <p className="mt-4 text-[var(--text-secondary)]">AI가 {character?.name}의 내면을 분석 중입니다...</p>
                        </div>
                    )}
                    {proposal && (
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-bold text-[var(--text-primary)]">AI 심리 분석 결과</h3>
                                <p className="mt-1 text-sm bg-[var(--panel-bg-alt)] p-3 rounded-md border border-[var(--border)]">{proposal.reason}</p>
                            </div>
                            {proposal.isChangeRecommended && proposal.newProfile && (
                                <div className="space-y-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                                    <h3 className="font-bold text-green-400">변화 제안</h3>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)]">새로운 결정적 경험</label>
                                        <p className="text-sm text-[var(--text-primary)]">{proposal.newProfile.formativeEvent}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)]">새로운 핵심 원칙</label>
                                        <p className="text-sm text-[var(--text-primary)]">{proposal.newProfile.corePrinciple}</p>
                                    </div>
                                    <div>
                                        <label className="text-xs text-[var(--text-secondary)]">새로운 코어 디자이어</label>
                                        <p className="text-sm text-[var(--text-primary)]">{proposal.newProfile.coreDesire}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {proposal && (
                    <footer className="p-4 border-t border-[var(--border)] flex justify-end space-x-3">
                        <button onClick={() => handleConfirm(false)} className="px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200">거절</button>
                        {proposal.isChangeRecommended && (
                            <button onClick={() => handleConfirm(true)} className="px-4 py-2 bg-green-600 border border-green-700 hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200">수락</button>
                        )}
                    </footer>
                )}
            </div>
        </div>
    );
};
