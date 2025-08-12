import React, { useState, useEffect } from 'react';
import { ICONS } from '../../../constants';

/**
 * Modal for saving a character as a template.
 */
export const SaveCharacterTemplateModal = ({ character, onSave, onClose }) => {
    const [name, setName] = useState(character?.name || '');

    useEffect(() => {
        if (character) {
            setName(character.name);
        }
    }, [character]);

    if (!character) return null;

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
        }
    };

    return (
        <div 
            // [수정] z-index를 CSS 변수로 관리
            className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
            style={{ zIndex: 'var(--z-save-template-modal)' }}
        >
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border-primary)]">
                <div className="p-6 font-sans">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)] mb-4 flex items-center">
                        <ICONS.LucideFileArchive className="w-5 h-5 mr-2" />
                        캐릭터 프리셋 저장
                    </h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        '<strong className="text-[var(--text-primary)]">{character.name}</strong>' 캐릭터를 프리셋으로 저장합니다. 프리셋에 사용할 다른 이름을 지정할 수 있습니다.
                    </p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
                        placeholder="프리셋 이름"
                    />
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={onClose} className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200">취소</button>
                        <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 bg-[var(--success)] hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200 disabled:opacity-50">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
