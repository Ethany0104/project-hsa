import React, { useState } from 'react';
import { ICONS } from '../../../constants';

const RelationshipManager = ({ character, allCharacters, onUpdate }) => {
    const [newRelationship, setNewRelationship] = useState({ targetId: '', type: '우호', history: '' });
    const otherCharacters = allCharacters.filter(c => c.id !== character.id);

    const handleAddRelationship = () => {
        if (!newRelationship.targetId || !newRelationship.type) return;
        const newRel = { ...newRelationship, id: Date.now(), targetId: parseInt(newRelationship.targetId, 10) };
        const updatedRelationships = [...(character.relationships || []), newRel];
        onUpdate('relationships', updatedRelationships);
        setNewRelationship({ targetId: '', type: '우호', history: '' });
    };

    const handleDeleteRelationship = (relationshipId) => {
        const updatedRelationships = character.relationships.filter(r => r.id !== relationshipId);
        onUpdate('relationships', updatedRelationships);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {(character.relationships || []).length > 0 ? (
                    (character.relationships || []).map(rel => (
                        <div key={rel.id} className="p-2.5 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold">{allCharacters.find(c => c.id === rel.targetId)?.name || '알 수 없는 대상'}</span>
                                <span className="text-[var(--accent-primary)]">{rel.type}</span>
                                <button onClick={() => handleDeleteRelationship(rel.id)} className="text-[var(--text-secondary)] hover:text-[var(--danger)]"><ICONS.LucideTrash2 size={14} /></button>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{rel.history}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-center text-[var(--text-secondary)] py-4">설정된 관계가 없습니다.</p>
                )}
            </div>
            <div className="p-2 border border-dashed border-[var(--border-primary)] rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <select value={newRelationship.targetId} onChange={e => setNewRelationship(p => ({ ...p, targetId: e.target.value }))} className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]">
                        <option value="">대상 선택</option>
                        {otherCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="text" placeholder="관계 유형 (예: 우호)" value={newRelationship.type} onChange={e => setNewRelationship(p => ({ ...p, type: e.target.value }))} className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]" />
                </div>
                <textarea placeholder="관계의 역사, 주요 사건 등" value={newRelationship.history} onChange={e => setNewRelationship(p => ({ ...p, history: e.target.value }))} rows="2" className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm resize-y border border-[var(--border-primary)]" />
                <button onClick={handleAddRelationship} className="w-full py-1.5 bg-[var(--accent-primary)] text-white text-xs rounded-md hover:opacity-90 transition-colors">관계 추가</button>
            </div>
        </div>
    );
};

export default RelationshipManager;
