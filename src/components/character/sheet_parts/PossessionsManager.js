import React from 'react';
import { ICONS } from '../../../constants';

const PossessionsManager = ({ possessions, onUpdate }) => {
    const handleAdd = () => {
        const newPossessions = [...(possessions || []), { id: Date.now(), name: '', story: '' }];
        onUpdate('space.cherishedPossessions', newPossessions);
    };

    const handleChange = (index, field, value) => {
        const newPossessions = JSON.parse(JSON.stringify(possessions));
        newPossessions[index][field] = value;
        onUpdate('space.cherishedPossessions', newPossessions);
    };
    
    const handleDelete = (index) => {
        const newPossessions = JSON.parse(JSON.stringify(possessions));
        newPossessions.splice(index, 1);
        onUpdate('space.cherishedPossessions', newPossessions);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {(possessions || []).map((item, index) => (
                    <div key={item.id || `possession-${index}`} className="p-2.5 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)]">
                        <div className="flex items-center mb-2">
                            <input type="text" value={item.name} onChange={e => handleChange(index, 'name', e.target.value)} placeholder="물건 이름" className="flex-grow bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)]" />
                            <button onClick={() => handleDelete(index)} className="ml-2 text-[var(--text-secondary)] hover:text-[var(--danger)] p-1"><ICONS.LucideTrash2 size={14} /></button>
                        </div>
                        <textarea value={item.story} onChange={e => handleChange(index, 'story', e.target.value)} placeholder="물건에 얽힌 사연" rows="2" className="w-full bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)] resize-y" />
                    </div>
                ))}
            </div>
            <button onClick={handleAdd} className="w-full text-xs py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] rounded-md transition-colors">+ 소중한 물건 추가</button>
        </div>
    );
};

export default PossessionsManager;
