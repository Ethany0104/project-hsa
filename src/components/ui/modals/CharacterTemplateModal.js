import React, { useState } from 'react';
import { ICONS } from '../../../constants';
import { ConfirmationModal } from './ConfirmationModal';

export const CharacterTemplateModal = ({ isOpen, templates, onLoad, onDelete, onClose }) => {
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [activeFilter, setActiveFilter] = useState('user'); // 'user' or 'npc'

    if (!isOpen) return null;

    const confirmDelete = (template) => {
        setTemplateToDelete(template);
    };

    const executeDelete = () => {
        if (templateToDelete) {
            onDelete(templateToDelete.id);
            setTemplateToDelete(null);
        }
    };

    const handleLoad = (template) => {
        onLoad(template);
        onClose();
    };

    const filteredTemplates = templates.filter(template => {
        if (activeFilter === 'user') return template.isUser;
        return !template.isUser;
    });

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[140] animate-fadeIn backdrop-blur-sm p-4">
                <div className="panel-ui rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-[var(--border-primary)]">
                    <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                            <ICONS.LucideUsers className="w-5 h-5 mr-3" />
                            페르소나 불러오기
                        </h2>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
                    </header>
                    
                    <div className="p-2 border-b border-[var(--border-primary)] flex-shrink-0">
                        <div className="flex bg-[var(--bg-primary)] rounded-lg p-1">
                            <button
                                onClick={() => setActiveFilter('user')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'user' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                            >
                                유저
                            </button>
                            <button
                                onClick={() => setActiveFilter('npc')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'npc' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                            >
                                페르소나
                            </button>
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <div className="text-center py-16 text-[var(--text-secondary)]">
                                <ICONS.LucideUserX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p className="font-sans">
                                    {activeFilter === 'user' ? '저장된 유저 프리셋이 없습니다.' : '저장된 페르소나 프리셋이 없습니다.'}
                                </p>
                            </div>
                        ) : (
                            <ul className="space-y-2 p-2">
                                {filteredTemplates.map(template => {
                                    // [BUG FIX] isUser 값에 따라 다른 컨셉 필드를 사용하도록 수정합니다.
                                        const conceptText = template.generationConcept;                                    return (
                                        <li key={template.id} className="p-3 bg-[var(--panel-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-200 font-sans group">
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex items-center min-w-0">
                                                    {template.profileImageUrl ? (
                                                        <img src={template.profileImageUrl} alt={template.name} className="w-10 h-10 rounded-full object-cover mr-4 flex-shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-[var(--input-bg)] flex-shrink-0 mr-4 flex items-center justify-center font-bold">{template.name.charAt(0)}</div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-[var(--text-primary)] truncate">{template.name}</h3>
                                                        <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{conceptText || '컨셉 미설정'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                    <button onClick={() => handleLoad(template)} className="px-3 py-1 bg-[var(--accent-primary)] text-white text-xs rounded-md hover:bg-[var(--accent-secondary)] transition-opacity whitespace-nowrap">불러오기</button>
                                                    <button onClick={() => confirmDelete(template)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-full hover:bg-red-500/10 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
            <ConfirmationModal 
                isOpen={!!templateToDelete} 
                onClose={() => setTemplateToDelete(null)} 
                onConfirm={executeDelete} 
                title="캐릭터 프리셋 삭제"
            >
                <p className="font-sans">정말로 <strong className="text-[var(--accent-primary)]">{templateToDelete?.name}</strong> 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </ConfirmationModal>
        </>
    );
};
