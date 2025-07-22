// --- Start of file: components/ui/PersonaStatusFloater.js ---

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../../constants';
import { EmotionAnalysisViewer } from './widgets';
import { Card, CardHeader } from './layouts';

export const PersonaStatusFloater = ({ character, latestEmotionAnalysis, onClose }) => {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const floaterRef = useRef(null);
    const offsetRef = useRef({ x: 0, y: 0 });

    const handleMouseDown = (e) => {
        if (floaterRef.current) {
            const rect = floaterRef.current.getBoundingClientRect();
            offsetRef.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
            };
            setIsDragging(true);
        }
    };

    const handleMouseMove = useCallback((e) => {
        if (!isDragging) return;
        e.preventDefault();
        setPosition({
            x: e.clientX - offsetRef.current.x,
            y: e.clientY - offsetRef.current.y,
        });
    }, [isDragging]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        // 창이 처음 뜰 때 랜덤한 위치에 나타나도록 설정
        setPosition({
            x: 50 + Math.random() * (window.innerWidth - 450),
            y: 50 + Math.random() * (window.innerHeight - 550)
        });
    }, []);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, handleMouseMove, handleMouseUp]);

    return (
        <div
            ref={floaterRef}
            className="fixed w-96 bg-[var(--panel-bg)] rounded-xl shadow-2xl border border-[var(--border-primary)] z-[100] flex flex-col animate-fadeIn"
            style={{ top: position.y, left: position.x, transform: isDragging ? 'scale(1.02)' : 'scale(1)', transition: 'transform 0.1s ease-in-out' }}
        >
            <header
                className="p-3 border-b border-[var(--border-primary)] flex justify-between items-center cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
            >
                <div className="flex items-center font-sans">
                    <ICONS.LucideMonitor className="w-4 h-4 mr-2 text-[var(--accent-primary)]" />
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">{character.name} 현황</h3>
                </div>
                <button onClick={onClose} className="p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] rounded-full transition-colors">
                    <ICONS.LucideX size={16} />
                </button>
            </header>
            <div className="p-2 space-y-2 overflow-y-auto max-h-[60vh]">
                <EmotionAnalysisViewer analysis={latestEmotionAnalysis} characterId={character.id} />
                <Card>
                    <CardHeader icon={ICONS.LucideZap} title="단기 목표" />
                    <div className="space-y-2 text-sm p-1 font-sans">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">주요 목표</label>
                            <p className="p-2 bg-[var(--input-bg)] rounded-md text-[var(--text-secondary)] border border-[var(--border-primary)] min-h-[2.5rem]">
                                {character.goals?.primaryGoal || '...'}
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">대안 목표</label>
                            <p className="p-2 bg-[var(--input-bg)] rounded-md text-[var(--text-secondary)] border border-[var(--border-primary)] min-h-[2.5rem]">
                                {character.goals?.alternativeGoal || '...'}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};
