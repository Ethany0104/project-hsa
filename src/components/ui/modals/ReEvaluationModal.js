import React from 'react';
import { ICONS } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';
import { Spinner } from '../widgets';

const ProposalItem = ({ title, content }) => {
    if (!content) return null;
    return (
        <div>
            <label className="text-xs text-[var(--text-secondary)] font-bold">{title}</label>
            <p className="text-sm text-[var(--text-primary)] mt-1">{content}</p>
        </div>
    );
};

export const ReEvaluationModal = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { reEvaluation } = storyProps;
    const { handleConfirmReEvaluation } = handlerProps;

    const { isOpen, isLoading, character, proposal } = reEvaluation;

    const handleClose = () => {
        handleConfirmReEvaluation(false);
    };

    const handleConfirm = (isAccepted) => {
        handleConfirmReEvaluation(isAccepted);
    };

    if (!isOpen) return null;

    const newProfile = proposal?.newProfile;

    return (
        // [Z-INDEX] 재평가 모달: 140
        <div 
            // [수정] z-index를 CSS 변수로 관리
            className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
            style={{ zIndex: 'var(--z-re-evaluation-modal)' }}
        >
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-[var(--border-primary)]">
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                        <ICONS.LucideBrainCircuit className="w-5 h-5 mr-3" />
                        {character?.name}의 핵심 심리 재평가
                    </h2>
                    <button onClick={handleClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
                </header>
                <div className="p-6 overflow-y-auto font-sans">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
                            <Spinner />
                            <p className="mt-4">AI가 {character?.name}의 내면을 분석 중입니다...</p>
                        </div>
                    )}
                    {proposal && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="font-semibold text-md text-[var(--text-primary)] mb-2">AI 심리 분석 결과</h3>
                                <p className="text-sm bg-[var(--panel-bg)] p-4 rounded-md border border-[var(--border-primary)] leading-relaxed">{proposal.reason}</p>
                            </div>
                            {proposal.isChangeRecommended && newProfile ? (
                                <div className="space-y-4 p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg">
                                    <h3 className="font-semibold text-md text-[var(--success)] mb-2">변화 제안</h3>
                                    <div className="space-y-3">
                                        <ProposalItem title="새로운 결정적 경험" content={newProfile.formativeEvent} />
                                        <ProposalItem title="새로운 핵심 원칙" content={newProfile.corePrinciple} />
                                        <ProposalItem title="새로운 코어 디자이어" content={newProfile.coreDesire} />

                                        {newProfile.lifestyle && <hr className="border-[var(--success)]/20 my-3"/>}
                                        <ProposalItem title="변화된 삶의 태도" content={newProfile.lifestyle?.attitude} />
                                        <ProposalItem title="변화된 일상 루틴" content={newProfile.lifestyle?.routines} />
                                        <ProposalItem title="변화된 사소한 기쁨" content={newProfile.lifestyle?.pleasures} />

                                        {newProfile.psyche && <hr className="border-[var(--success)]/20 my-3"/>}
                                        <ProposalItem title="변화된 방어기제" content={newProfile.psyche?.defenseMechanism} />

                                        {newProfile.libido && <hr className="border-[var(--success)]/20 my-3"/>}
                                        <ProposalItem title="변화된 성적 태도" content={newProfile.libido?.attitude} />
                                        <ProposalItem title="변화된 친밀감 스타일" content={newProfile.libido?.intimacyStyle} />
                                        <ProposalItem title="변화된 성적 기벽" content={newProfile.libido?.kinks} />

                                        {newProfile.preferences && <hr className="border-[var(--success)]/20 my-3"/>}
                                        <ProposalItem title="변화된 좋아하는 것" content={newProfile.preferences?.likes} />
                                        <ProposalItem title="변화된 싫어하는 것" content={newProfile.preferences?.dislikes} />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                                     <p className="text-sm text-blue-300">AI는 현재 캐릭터의 심리에 큰 변화가 필요하지 않다고 판단했습니다.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {proposal && (
                    <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end space-x-3 flex-shrink-0">
                        <button onClick={() => handleConfirm(false)} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200">
                           {proposal.isChangeRecommended ? '거절' : '닫기'}
                        </button>
                        {proposal.isChangeRecommended && (
                            <button onClick={() => handleConfirm(true)} className="px-4 py-2 bg-[var(--success)] hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200">수락</button>
                        )}
                    </footer>
                )}
            </div>
        </div>
    );
};
