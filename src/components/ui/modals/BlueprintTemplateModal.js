import React, { useState } from 'react';
import { ICONS } from '../../../constants';
import { ConfirmationModal } from './ConfirmationModal';

const TemplateListItem = ({ template, onSelect, onDelete }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    // [FEATURE] 새로운 contextSettings 구조에 맞게 표시할 내용을 가져옵니다.
    const situation = template.contextSettings?.situation || '시작 장면 정보 없음';
    const worldviewDetails = template.contextSettings?.worldview?.details || '세계관 정보 없음';
    const worldviewGenre = template.contextSettings?.worldview?.genre || '장르 미설정';

    return (
        <div className="bg-[var(--panel-bg)] rounded-lg border border-[var(--border-primary)] overflow-hidden transition-all duration-300">
            <div className="flex items-center justify-between p-3 group cursor-pointer hover:bg-[var(--bg-tertiary)]" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center min-w-0">
                     <ICONS.LucideChevronRight className={`w-5 h-5 mr-3 text-[var(--text-secondary)] transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`} />
                    <div className="min-w-0">
                        <span className="font-semibold text-[var(--text-primary)] font-sans truncate block">{template.name}</span>
                        <span className="text-xs text-[var(--text-secondary)] font-sans truncate">{worldviewGenre}</span>
                    </div>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); onSelect(template); }} className="px-3 py-1 bg-[var(--accent-primary)] text-white text-xs rounded-md hover:bg-[var(--accent-secondary)] transition-opacity">불러오기</button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(template); }} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-full hover:bg-red-500/10 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
                </div>
            </div>
            {isExpanded && (
                <div className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] text-sm animate-fadeIn">
                    <div className="max-h-60 overflow-y-auto space-y-4 pr-3">
                        {/* [FEATURE] 새로운 데이터 구조에 맞춰 UI를 수정합니다. */}
                        <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] font-sans">세계관 상세</h4>
                            <p className="text-[var(--text-primary)] mt-1 whitespace-pre-wrap font-sans leading-relaxed">{worldviewDetails}</p>
                        </div>
                         <div>
                            <h4 className="text-xs font-bold text-[var(--text-secondary)] font-sans">시작 장면</h4>
                            <p className="text-[var(--text-primary)] mt-1 whitespace-pre-wrap font-sans leading-relaxed">{situation}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

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
            <div 
                // [수정] z-index를 CSS 변수로 관리
                className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
                style={{ zIndex: 'var(--z-blueprint-template-modal)' }}
            >
                <div className="panel-ui rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-[var(--border-primary)]">
                    <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                        <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                            <ICONS.LucideFileArchive className="w-5 h-5 mr-3" />
                            설계도 템플릿 관리
                        </h2>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
                    </header>
                    <div className="flex-grow p-4 overflow-y-auto space-y-6">
                        <div>
                            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 font-sans">현재 설계도 저장</h3>
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    placeholder="새 템플릿 이름"
                                    value={templateName}
                                    onChange={(e) => setTemplateName(e.target.value)}
                                    className="flex-grow bg-[var(--input-bg)] p-2 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-1 focus:ring-[var(--accent-primary)]/20 transition-colors font-sans"
                                />
                                <button onClick={handleSaveClick} disabled={!templateName.trim()} className="px-4 py-2 bg-[var(--success)] text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 transition-opacity">
                                    저장
                                </button>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-md font-semibold text-[var(--text-primary)] mb-2 font-sans">저장된 템플릿 목록</h3>
                            <div className="space-y-2 max-h-96 overflow-y-auto p-1">
                                {templates.length === 0 ? (
                                    <div className="text-center py-16 text-[var(--text-secondary)]">
                                        <ICONS.LucideArchiveX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p className="font-sans">저장된 템플릿이 없습니다.</p>
                                    </div>
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
                <p className="font-sans">정말로 <strong className="text-[var(--accent-primary)]">{templateToDelete?.name}</strong> 템플릿을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            </ConfirmationModal>
        </>
    );
};
