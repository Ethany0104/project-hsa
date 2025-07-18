import React, { useState } from 'react';
import { ICONS } from '../../../constants';
import { ConfirmationModal } from './ConfirmationModal'; // 분리된 모달 import

/**
 * 저장된 캐릭터 프리셋 목록 모달
 */
export const CharacterTemplateModal = ({ isOpen, templates, onLoad, onDelete, onClose }) => {
    const [templateToDelete, setTemplateToDelete] = useState(null);
    const [activeFilter, setActiveFilter] = useState('protagonist'); // 'protagonist' or 'npc'

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
        if (activeFilter === 'protagonist') {
            return template.isProtagonist;
        }
        return !template.isProtagonist;
    });

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn backdrop-blur-sm">
                <div className="panel-ui rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-[var(--border)]">
                    <header className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[var(--accent)] font-sans flex items-center">
                            <ICONS.LucideUsers className="w-5 h-5 mr-2" />
                            캐릭터 불러오기
                        </h2>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ICONS.LucideX /></button>
                    </header>
                    
                    <div className="p-2 border-b border-[var(--border)] flex-shrink-0">
                        <div className="flex bg-[var(--panel-bg)] rounded-lg p-1">
                            <button
                                onClick={() => setActiveFilter('protagonist')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'protagonist' ? 'bg-[var(--accent)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                            >
                                주인공
                            </button>
                            <button
                                onClick={() => setActiveFilter('npc')}
                                className={`flex-1 py-1.5 text-sm font-semibold rounded-md transition-colors ${activeFilter === 'npc' ? 'bg-[var(--accent)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--border)]'}`}
                            >
                                NPC
                            </button>
                        </div>
                    </div>

                    <div className="p-2 overflow-y-auto">
                        {filteredTemplates.length === 0 ? (
                            <p className="text-[var(--text-secondary)] text-center py-8 font-sans">
                                {activeFilter === 'protagonist' ? '저장된 주인공 프리셋이 없습니다.' : '저장된 NPC 프리셋이 없습니다.'}
                            </p>
                        ) : (
                            <ul className="space-y-2 p-2">
                                {filteredTemplates.map(template => (
                                    <li key={template.id} className="p-3 bg-[var(--panel-bg-alt)] hover:bg-[var(--border)] rounded-lg transition-colors duration-200 font-sans group">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-[var(--text-primary)] truncate">{template.name}</h3>
                                                <p className="text-xs text-[var(--text-secondary)] mt-1 truncate">{template.note || '노트 없음'}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                                <button onClick={() => handleLoad(template)} className="px-3 py-1 bg-[var(--accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity whitespace-nowrap">불러오기</button>
                                                <button onClick={() => confirmDelete(template)} className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
                                            </div>
                                        </div>
                                    </li>
                                ))}
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
                <p className="font-sans">정말로 <strong className="text-[var(--accent)]">{templateToDelete?.name}</strong> 프리셋을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </ConfirmationModal>
        </>
    );
};
