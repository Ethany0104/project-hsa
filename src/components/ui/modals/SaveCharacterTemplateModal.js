import React, { useState, useEffect } from 'react';

/**
 * 캐릭터 프리셋 저장 모달
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
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60] animate-fadeIn backdrop-blur-sm">
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border)]">
                <div className="p-6 font-sans">
                    <h2 className="text-lg font-bold text-[var(--accent)] mb-4">캐릭터 프리셋 저장</h2>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        '<strong className="text-[var(--text-primary)]">{character.name}</strong>' 캐릭터를 프리셋으로 저장합니다. 프리셋에 사용할 다른 이름을 지정할 수 있습니다.
                    </p>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
                        placeholder="프리셋 이름"
                    />
                    <div className="flex justify-end space-x-3 mt-6">
                        <button onClick={onClose} className="px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200">취소</button>
                        <button onClick={handleSave} disabled={!name.trim()} className="px-4 py-2 bg-green-600 border border-green-700 hover:bg-green-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200 disabled:opacity-50">저장</button>
                    </div>
                </div>
            </div>
        </div>
    );
};
