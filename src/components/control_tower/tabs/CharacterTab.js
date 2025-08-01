import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardHeader } from '../../ui/layouts';
import { ConfirmationModal } from '../../ui';
import { ICONS, DEFAULT_PERSONA } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';

const CharacterTab = ({ onEditCharacter, onToggleFloater }) => {
    const { storyProps, handlerProps } = useStoryContext();
    const { characters } = storyProps;
    const { setCharacters, setIsCharacterTemplateModalOpen } = handlerProps;

    const [isAddingPersona, setIsAddingPersona] = useState(false);
    const [newPersonaName, setNewPersonaName] = useState("");
    const [personaToDelete, setPersonaToDelete] = useState(null);
    
    const newPersonaInputRef = useRef(null);

    useEffect(() => {
        if (isAddingPersona && newPersonaInputRef.current) {
            newPersonaInputRef.current.focus();
        }
    }, [isAddingPersona]);

    const handleConfirmAddPersona = () => {
        if (!newPersonaName.trim()) return;
        const newPersona = { ...DEFAULT_PERSONA, id: Date.now(), name: newPersonaName.trim() };
        setCharacters(prev => [...prev, newPersona]);
        setNewPersonaName("");
        setIsAddingPersona(false);
    };

    const confirmDeletePersona = (persona) => setPersonaToDelete(persona);
    const executeDeletePersona = () => {
        if (!personaToDelete) return;
        setCharacters(prev => prev.filter(c => c.id !== personaToDelete.id));
        setPersonaToDelete(null);
    };

    const user = useMemo(() => characters.find(c => c.isUser), [characters]);
    const personas = useMemo(() => characters.filter(c => !c.isUser), [characters]);

    return (
        <>
            <div className="space-y-6">
                {user && (
                    <Card>
                        <CardHeader icon={ICONS.LucideUser} title="유저" />
                        <div className="p-2 bg-[var(--bg-tertiary)] rounded-lg cursor-pointer hover:bg-[var(--border-primary)] transition-colors flex items-center space-x-4" onClick={() => onEditCharacter(user)}>
                            <div className="w-12 h-12 rounded-full bg-[var(--input-bg)] flex-shrink-0 flex items-center justify-center font-bold overflow-hidden">
                                {user.profileImageUrl ? (
                                    <img src={user.profileImageUrl} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span>{user.name ? user.name.charAt(0) : '?'}</span>
                                )}
                            </div>
                            <div className="flex-grow min-w-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-lg text-[var(--text-primary)] truncate">{user.name || "이름 없음"}</h3>
                                    <ICONS.LucideEdit className="w-4 h-4 text-[var(--text-secondary)] flex-shrink-0 ml-2" />
                                </div>
                                <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">{user.Concept || "노트 미설정"}</p>
                            </div>
                        </div>
                    </Card>
                )}
                <Card>
                    <CardHeader icon={ICONS.LucideUsers} title="페르소나">
                        <button onClick={() => setIsAddingPersona(true)} className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs">
                            <ICONS.LucidePlus className="w-4 h-4 mr-1" /> 새 페르소나
                        </button>
                    </CardHeader>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {isAddingPersona && (
                            <div className="p-3 bg-[var(--input-bg)] border border-dashed border-[var(--border-primary)] rounded-lg space-y-2">
                                <input 
                                    ref={newPersonaInputRef}
                                    type="text" 
                                    placeholder="새 페르소나의 이름" 
                                    value={newPersonaName} 
                                    onChange={(e) => setNewPersonaName(e.target.value)} 
                                    className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]" 
                                />
                                <div className="flex space-x-2">
                                    <button onClick={handleConfirmAddPersona} className="flex-1 py-1 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] rounded-md text-xs">추가</button>
                                    <button onClick={() => setIsAddingPersona(false)} className="flex-1 py-1 bg-[var(--bg-tertiary)] hover:bg-[var(--border-primary)] rounded-md text-xs">취소</button>
                                </div>
                            </div>
                        )}
                        {personas.map(char => (
                            <div key={char.id} className="flex items-center justify-between p-3 hover:bg-[var(--bg-tertiary)] rounded-lg group">
                                <div className="flex items-center min-w-0 space-x-4 cursor-pointer flex-grow" onClick={() => onEditCharacter(char)}>
                                    <div className="w-10 h-10 rounded-full bg-[var(--input-bg)] flex-shrink-0 flex items-center justify-center font-bold overflow-hidden">
                                        {char.profileImageUrl ? (
                                            <img src={char.profileImageUrl} alt={char.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{char.name ? char.name.charAt(0) : '?'}</span>
                                        )}
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <h3 className="font-bold text-[var(--text-primary)] truncate">{char.name}</h3>
                                        {/* [BUG FIX] 'generationConcept'을 올바르게 참조하도록 수정합니다. */}
                                        <p className="text-xs text-[var(--text-secondary)] break-words truncate">{char.generationConcept || '노트 미설정'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-2">
                                    <button onClick={(e) => { e.stopPropagation(); onToggleFloater(char.id); }} title="현황 보기" className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><ICONS.LucideMonitor size={16} /></button>
                                    <button onClick={(e) => { e.stopPropagation(); confirmDeletePersona(char); }} title="삭제" className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)]"><ICONS.LucideTrash2 size={16} /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
                <div className="pt-2">
                    <button onClick={() => setIsCharacterTemplateModalOpen(true)} className="w-full flex items-center justify-center px-4 py-3 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold transition-colors">
                        <ICONS.LucideFileArchive className="w-4 h-4 mr-2" /> 페르소나 불러오기
                    </button>
                </div>
            </div>
            <ConfirmationModal isOpen={!!personaToDelete} onClose={() => setPersonaToDelete(null)} onConfirm={executeDeletePersona} title="페르소나 삭제 확인">
                <p>정말로 <strong>{personaToDelete?.name}</strong> 페르소나를 삭제하시겠습니까?</p>
            </ConfirmationModal>
        </>
    );
};

export default CharacterTab;
