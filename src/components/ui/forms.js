import { useState } from 'react';
import { ICONS } from '../../constants/icons';

// CharacterSheet와 관련된 모든 코드가 제거되었습니다.
// 이제 이 파일은 순수한 Form 관련 컴포넌트만 포함합니다.

/**
 * 대화 블록을 표시하는 컴포넌트
 * @param {object} props - { character: string, line: string, thought?: string }
 */
export const DialogueBlock = ({ character, line, thought }) => {
    const [isThoughtVisible, setIsThoughtVisible] = useState(false);

    return (
        <div className="my-4 pl-4 border-l-2 border-[var(--accent)] relative group/dialogue">
            <p className="text-lg italic text-[var(--text-primary)] opacity-80 leading-relaxed font-serif">
                <strong className="font-bold not-italic text-[var(--accent)] mr-2">{character}:</strong>
                "{line}"
            </p>
            {thought && (
                <div className="absolute top-0 -right-5 opacity-0 group-hover/dialogue:opacity-100 transition-opacity">
                    <button 
                        onClick={() => setIsThoughtVisible(!isThoughtVisible)} 
                        className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent)]"
                        title="속마음 보기"
                    >
                        <ICONS.LucideBrainCircuit size={16} />
                    </button>
                </div>
            )}
            {isThoughtVisible && thought && (
                <div className="mt-2 p-3 bg-black/10 dark:bg-black/20 rounded-lg animate-fadeIn border border-white/5">
                    <p className="text-sm text-[var(--text-secondary)] italic font-serif leading-relaxed">{thought}</p>
                </div>
            )}
        </div>
    );
};

/**
 * 편집 가능한 입력 필드 컴포넌트
 * @param {object} props - { label: string, value: string, onChange: function, isTextarea?: boolean, placeholder?: string, rows?: number, type?: string }
 */
export const EditableField = ({ label, value, onChange, isTextarea = false, placeholder = "", rows=3, type="text" }) => ( 
    <div className="font-sans">
        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
        {isTextarea ? (
            <textarea value={value} onChange={onChange} placeholder={placeholder} rows={rows} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors resize-y break-all" />
        ) : (
            <input type={type} value={value} onChange={onChange} placeholder={placeholder} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors" />
        )}
    </div> 
);
