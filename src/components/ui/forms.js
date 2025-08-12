// src/components/ui/forms.js

import { useState } from 'react';
import { ICONS } from '../../constants/icons';

/**
 * 대화나 대사를 표시하는 말풍선 컴포넌트.
 * isPlayer prop에 따라 유저(오른쪽 정렬)와 AI(왼쪽 정렬) 스타일을 구분합니다.
 * @param {object} props - { character, line, thought, isPlayer, className }
 */
export const DialogueBlock = ({ character, line, thought, isPlayer = false, className = "" }) => {
    const [isThoughtVisible, setIsThoughtVisible] = useState(false);

    const characterName = character?.name || '???';
    const characterImageUrl = character?.profileImageUrl;

    const bubbleClasses = isPlayer ? 'bg-[var(--accent-secondary)]/10' : 'bg-[var(--bg-tertiary)]';
    const characterColor = isPlayer ? 'text-[var(--accent-secondary)]' : 'text-[var(--accent-primary)]';
    
    return (
        <div className={`group/dialogue flex flex-col ${isPlayer ? 'items-end' : 'items-start'} w-full ${className}`}>
            {/* Part 1: Avatar and Bubble Row */}
            <div className={`flex w-full max-w-2xl ${isPlayer ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
                <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex-shrink-0 flex items-center justify-center font-bold text-lg overflow-hidden">
                    {characterImageUrl ? (
                        <img src={characterImageUrl} alt={characterName} className="w-full h-full object-cover" />
                    ) : (
                        characterName.charAt(0)
                    )}
                </div>
                <div className={`relative px-4 py-3 rounded-lg ${bubbleClasses}`}>
                    <p className={`text-lg italic text-[var(--text-primary)] leading-relaxed font-serif`}>
                        <strong className={`font-bold not-italic ${characterColor} mr-2`}>{characterName}:</strong>
                        "{line}"
                    </p>
                    {thought && !isPlayer && (
                        <div className="absolute top-1 -right-8 opacity-0 group-hover/dialogue:opacity-100 transition-opacity">
                            <button 
                                onClick={() => setIsThoughtVisible(!isThoughtVisible)} 
                                className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                                title="속마음 보기"
                            >
                                <ICONS.LucideBrainCircuit size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
             {/* Part 2: Thought Bubble (이제 문서 흐름에 포함됩니다) */}
             {isThoughtVisible && thought && !isPlayer && (
                <div className="mt-2 p-3 bg-black/20 rounded-lg animate-fadeIn border border-white/10 max-w-xl ml-14 w-[calc(100%-3.5rem)]">
                    <p className="text-sm text-[var(--text-secondary)] italic font-serif leading-relaxed">{thought}</p>
                </div>
            )}
        </div>
    );
};

/**
 * 편집 가능한 입력 필드 컴포넌트.
 * isTextarea prop에 따라 <input> 또는 <textarea>로 렌더링됩니다.
 */
export const EditableField = ({ label, value, onChange, isTextarea = false, placeholder = "", rows=3, type="text" }) => ( 
    <div className="font-sans w-full">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
        {isTextarea ? (
            <textarea 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                rows={rows} 
                className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all resize-y break-all" 
            />
        ) : (
            <input 
                type={type} 
                value={value} 
                onChange={onChange} 
                placeholder={placeholder} 
                className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all" 
            />
        )}
    </div> 
);
