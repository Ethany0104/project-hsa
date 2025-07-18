import React, { useState } from 'react';
import { ICONS } from '../../../constants';
import { ConfirmationModal } from './ConfirmationModal'; // 분리된 모달 import

/**
 * 개별 템플릿 항목을 위한 아코디언 컴포넌트
 */
const TemplateListItem = ({ template, onSelect, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border)] overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between p-3 group cursor-pointer hover:bg-[var(--border)]" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center">
                     <ICONS.LucideChevronRight className={`w-5 h-5 mr-2 text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    <span className="font-semibold text-[var(--text-primary)] font-sans">{template.name}</span>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(template); }} className="px-3 py-1 bg-[var(--accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity">불러오기</button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(template); }} className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-[var(--border)] bg-[var(--panel-bg-alt)] text-sm animate-fadeIn">
                    <div className="max-h-60 overflow-y-auto space-y-4 pr-3">
                        <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] font-sans">장르</h4>
                            <p className="text-[var(--text-primary)] mt-1 font-sans">{template.genre || '미설정'}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] font-sans">세계관</h4>
                            <p className="text-[var(--text-primary)] mt-1 whitespace-pre-wrap font-sans leading-relaxed">{template.worldview || '미설정'}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] font-sans">플롯</h4>
                            <p className="text-[var(--text-primary)] mt-1 whitespace-pre-wrap font-sans leading-relaxed">{template.plot || '미설정'}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * 설계도 템플릿 관리 모달
 */
export const BlueprintTemplateModal = ({ isOpen, templates, onSave, onLoad, onDelete, onClose }) => {
    const [templateName, setTemplateName] = useState('');
    const [templateToDelete, setTemplateToDelete] = useState(null);

    if (!isOpen) return null;

    const handleSaveClick = () => {
        onSave(templateName);
        setTemplateName('');
    };

    const handleLoadClick = (template) => {
        onLoad(template);
        onClose();
    };

    const confirmDelete = (template) => {
        setTemplateToDelete(template);
    };

    const executeDelete = () => {
        if (templateToDelete) {
            onDelete(templateToDelete.id);
            setTemplateToDelete(null);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn backdrop-blur-sm">
                <div className="panel-ui rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-[var(--border)]">
                    <header className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                        <h2 className="text-lg font-bold text-[var(--accent)] font-sans flex items-center">
                            <ICONS.LucideFileArchive className="w-5 h-5 mr-2" />
                            설계도 템플릿 관리
                        </h2>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ICONS.LucideX /></button>
                    </header>
                    <div className="flex-grow p-4 overflow-y-auto space-y-4">
                        <div>
                            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 font-sans">현재 설계도 저장</h3>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="새 템플릿 이름"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="flex-grow bg-[var(--input-bg)] p-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors font-sans"
                                />
                                <button onClick={handleSaveClick} disabled={!templateName.trim()} className="px-4 py-2 bg-[var(--accent)] text-white rounded-lg text-sm font-semibold hover:opacity-90 disabled:bg-gray-400 disabled:cursor-not-allowed transition-opacity">
                                    저장
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 font-sans">저장된 템플릿 목록</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                                {templates.length === 0 ? (
                                    <p className="text-[var(--text-secondary)] text-center py-8 font-sans text-sm">저장된 템플릿이 없습니다.</p>
                                ) : (
                                    templates.map(template => (
                                        <TemplateListItem 
                                            key={template.id}
                                            template={template}
                                            onSelect={handleLoadClick}
                                            onDelete={confirmDelete}
                                        />
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmationModal 
                isOpen={!!templateToDelete} 
                onClose={() => setTemplateToDelete(null)} 
                onConfirm={executeDelete} 
                title="템플릿 삭제 확인"
            >
                <p className="font-sans">정말로 <strong className="text-[var(--accent)]">{templateToDelete?.name}</strong> 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </ConfirmationModal>
        </>
    );
};
