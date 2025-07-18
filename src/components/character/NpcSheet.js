import React, { useState } from 'react';
import { ICONS } from '../../constants';
import { Card, CardHeader } from '../ui/layouts';
import { EditableField } from '../ui/forms';
import { Big5Slider } from '../ui/widgets';
import { RisuAiCardForm } from './RisuAiCardForm';

// RelationshipManager는 NpcSheet에서만 사용되므로, 여기에 포함시킵니다.
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
            <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {(character.relationships || []).length > 0 ? (
                    (character.relationships || []).map(rel => (
                        <div key={rel.id} className="p-2 bg-[var(--input-bg)] rounded-md border border-[var(--border)]">
                            <div className="flex justify-between items-center text-sm">
                                <span className="font-bold">{allCharacters.find(c => c.id === rel.targetId)?.name || '알 수 없는 대상'}</span>
                                <span className="text-[var(--accent)]">{rel.type}</span>
                                <button onClick={() => handleDeleteRelationship(rel.id)} className="text-[var(--text-secondary)] hover:text-red-500"><ICONS.LucideTrash2 size={14} /></button>
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] mt-1">{rel.history}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-xs text-center text-[var(--text-secondary)] py-4">설정된 관계가 없습니다.</p>
                )}
            </div>
            <div className="p-2 border border-dashed border-[var(--border)] rounded-lg space-y-2">
                <div className="grid grid-cols-2 gap-2">
                    <select value={newRelationship.targetId} onChange={e => setNewRelationship(p => ({ ...p, targetId: e.target.value }))} className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm border border-[var(--border)]">
                        <option value="">대상 선택</option>
                        {otherCharacters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input type="text" placeholder="관계 유형 (예: 우호)" value={newRelationship.type} onChange={e => setNewRelationship(p => ({ ...p, type: e.target.value }))} className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm border border-[var(--border)]" />
                </div>
                <textarea placeholder="관계의 역사, 주요 사건 등" value={newRelationship.history} onChange={e => setNewRelationship(p => ({ ...p, history: e.target.value }))} rows="2" className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm resize-y border border-[var(--border)]" />
                <button onClick={handleAddRelationship} className="w-full py-1.5 bg-[var(--accent)] text-white text-xs rounded-md hover:opacity-90">관계 추가</button>
            </div>
        </div>
    );
};


/**
 * NPC 캐릭터 시트 컴포넌트
 * @param {object} props - { localCharacter, allCharacters, handleLocalChange, handleImageUpload }
 */
export const NpcSheet = ({ localCharacter, allCharacters, handleLocalChange, handleImageUpload }) => {
    return (
        <>
            {/* Column 1 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideFileText} title="기본 정보" />
                    <div className="space-y-3">
                        <EditableField label="이름" value={localCharacter.name || ''} onChange={e => handleLocalChange('name', e.target.value)} />
                        <EditableField isTextarea rows={5} label="외형" value={localCharacter.appearance || ''} onChange={e => handleLocalChange('appearance', e.target.value)} />
                        <EditableField isTextarea rows={5} label="캐릭터 노트" value={localCharacter.note || ''} onChange={e => handleLocalChange('note', e.target.value)} />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideDrama} title="서사적 프로필 (동기)" />
                    <div className="space-y-3">
                        <EditableField isTextarea rows={4} label="결정적 경험" value={localCharacter.formativeEvent || ''} onChange={e => handleLocalChange('formativeEvent', e.target.value)} />
                        <EditableField isTextarea rows={4} label="핵심 원칙" value={localCharacter.corePrinciple || ''} onChange={e => handleLocalChange('corePrinciple', e.target.value)} />
                        <EditableField isTextarea rows={4} label="코어 디자이어" value={localCharacter.coreDesire || ''} onChange={e => handleLocalChange('coreDesire', e.target.value)} />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideZap} title="운명과 결함" />
                    <div className="space-y-3">
                        <EditableField label="서사적 테마 (Thematic Arc)" value={localCharacter.thematicArc || ''} onChange={e => handleLocalChange('thematicArc', e.target.value)} placeholder="예: 구원, 복수, 몰락, 성장"/>
                        <EditableField label="비극적 결함 (Tragic Flaw)" value={localCharacter.tragicFlaw || ''} onChange={e => handleLocalChange('tragicFlaw', e.target.value)} placeholder="예: 오만, 의심, 집착"/>
                    </div>
                </Card>
            </div>
            {/* Column 2 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideBrainCog} title="성격적 프로필 (BIG5)" />
                    <div className="space-y-4">
                        <Big5Slider label="개방성" value={localCharacter.big5?.openness || 50} onChange={v => handleLocalChange('big5.openness', v)} />
                        <Big5Slider label="성실성" value={localCharacter.big5?.conscientiousness || 50} onChange={v => handleLocalChange('big5.conscientiousness', v)} />
                        <Big5Slider label="외향성" value={localCharacter.big5?.extraversion || 50} onChange={v => handleLocalChange('big5.extraversion', v)} />
                        <Big5Slider label="우호성" value={localCharacter.big5?.agreeableness || 50} onChange={v => handleLocalChange('big5.agreeableness', v)} />
                        <Big5Slider label="신경성" value={localCharacter.big5?.neuroticism || 50} onChange={v => handleLocalChange('big5.neuroticism', v)} />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideEyeOff} title="내면의 그림자" />
                    <div className="space-y-3">
                        <EditableField isTextarea rows={2} label="말투" value={localCharacter.innerShadow?.speechPatterns || ''} onChange={e => handleLocalChange('innerShadow.speechPatterns', e.target.value)} />
                        <EditableField isTextarea rows={2} label="버릇과 기행" value={localCharacter.innerShadow?.quirks || ''} onChange={e => handleLocalChange('innerShadow.quirks', e.target.value)} />
                        <EditableField isTextarea rows={3} label="숨겨진 비밀" value={localCharacter.innerShadow?.secrets || ''} onChange={e => handleLocalChange('innerShadow.secrets', e.target.value)} />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideHeartHandshake} title="관계망" />
                    <RelationshipManager character={localCharacter} allCharacters={allCharacters} onUpdate={(field, value) => handleLocalChange(field, value)} />
                </Card>
            </div>
            {/* Column 3 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideBot} title="RisuAI 카드 설정" />
                    <RisuAiCardForm
                        localCharacter={localCharacter}
                        handleLocalChange={handleLocalChange}
                        handleImageUpload={handleImageUpload}
                    />
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideStar} title="단기 목표" />
                    <div className="space-y-3 font-sans text-sm">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">주요 목표</p>
                            <p className="p-2.5 bg-[var(--input-bg)] rounded-lg text-[var(--text-primary)] min-h-[40px] border border-[var(--border)]">
                                {localCharacter.goals?.primaryGoal || <span className="text-[var(--text-secondary)] italic">자동 업데이트 대기 중...</span>}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] mb-1">대체 목표</p>
                            <p className="p-2.5 bg-[var(--input-bg)] rounded-lg text-[var(--text-primary)] min-h-[40px] border border-[var(--border)]">
                                {localCharacter.goals?.alternativeGoal || <span className="text-[var(--text-secondary)] italic">자동 업데이트 대기 중...</span>}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideBrainCircuit} title="무의식" />
                    <div className="space-y-3">
                        <EditableField isTextarea rows={2} label="반복되는 상징 (Recurring Symbols)" placeholder="쉼표로 구분하여 입력 (예: 물,깨진 거울)" value={(localCharacter.subconscious?.recurringSymbols || []).join(', ')} onChange={e => handleLocalChange('subconscious.recurringSymbols', e.target.value.split(',').map(s=>s.trim()))} />
                        <div className="font-sans">
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">무의식 스트림 (읽기 전용)</label>
                                <p className="text-xs p-2.5 bg-[var(--input-bg)] rounded-lg text-[var(--text-secondary)] min-h-[40px] border border-[var(--border)] italic">
                                {localCharacter.subconscious?.subconsciousStream || "응답 생성 시 자동 업데이트됩니다."}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>
        </>
    );
};
