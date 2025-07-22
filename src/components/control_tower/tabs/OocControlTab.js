import React, { useState } from 'react';
import { Card, CardHeader } from '../../ui/layouts';
import { ICONS } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';

const OocControlTab = ({ onTogglePdChat }) => {
        const { storyProps, handlerProps } = useStoryContext();
    const { isProcessing } = storyProps;
    const { handleIntervention, handleMemoryCompression } = handlerProps;

    const [interventionText, setInterventionText] = useState('');

    const handleInterveneClick = () => {
        if (!interventionText.trim()) return;
        handleIntervention(interventionText);
        setInterventionText('');
    };
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideMessageCircle} title="OOC 컨트롤 (Out-of-Character)" />
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">연기자가 아닌, 감독의 시점에서 AI에게 직접 지시를 내립니다.</p>
                    <textarea
                        placeholder="예: 페르소나 A가 페르소나 B를 질투하게 만들어줘."
                        value={interventionText}
                        onChange={e => setInterventionText(e.target.value)}
                        rows="4"
                        className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm border border-[var(--border-primary)] resize-y"
                    />
                    <button onClick={handleInterveneClick} disabled={isProcessing || !interventionText.trim()} className="w-full flex items-center justify-center px-4 py-2.5 bg-[var(--danger)] text-white hover:opacity-90 rounded-lg text-sm font-bold disabled:opacity-50 transition-colors">
                        <ICONS.LucideZap className="w-4 h-4 mr-2" /> OOC 전송
                    </button>
                </div>
            </Card>
            <Card>
                <CardHeader icon={ICONS.LucideBrainCog} title="기억 및 보조 기능" />
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">장면 기록을 압축하거나, PD AI와 대화하며 아이디어를 얻으세요.</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleMemoryCompression(1)} disabled={isProcessing} className="flex items-center justify-center px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">장면 압축 (L1)</button>
                        <button onClick={() => handleMemoryCompression(2)} disabled={isProcessing} className="flex items-center justify-center px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg text-sm font-semibold disabled:opacity-50 transition-colors">에피소드 압축 (L2)</button>
                    </div>
                    <button onClick={onTogglePdChat} className="w-full flex items-center justify-center px-4 py-2.5 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 rounded-lg text-sm font-bold transition-colors">
                        <ICONS.LucideBot className="w-4 h-4 mr-2" /> PD에게 질문하기
                    </button>
                </div>
            </Card>
        </div>
    );
};

export default OocControlTab;
