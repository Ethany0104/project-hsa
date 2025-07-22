// --- Start of file: components/control_tower/tabs/ContextTab.js ---

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Accordion } from '../../ui/layouts';
import { EditableField } from '../../ui/forms';
import { ICONS } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';

const ContextTab = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { contextSettings } = storyProps;
    const { setContextSettings, _addEntryToIndex, setIsTemplateModalOpen } = handlerProps;

    const [newDetail, setNewDetail] = useState({ category: '인물', keyword: '', description: '' });
    const LORE_CATEGORIES = ['인물', '장소', '사건', '규칙', '기타'];

    const handleContextChange = (field, value) => setContextSettings(prev => ({ ...prev, [field]: value }));
    const handleDetailChange = (field, value) => setNewDetail(prev => ({ ...prev, [field]: value }));

    const handleAddDetail = () => {
        if (!newDetail.keyword.trim() || !newDetail.description.trim()) return;
        const newEntryData = { ...newDetail, id: Date.now() };
        const updatedDetails = [...(contextSettings.details || []), newEntryData];
        setContextSettings(prev => ({ ...prev, details: updatedDetails }));
        const text = `[${newEntryData.category}] ${newEntryData.keyword}: ${newEntryData.description}`;
        // storyId는 _addEntryToIndex 함수 내부에서 처리되므로 여기서 넘길 필요가 없습니다.
        _addEntryToIndex('loreIndex', { id: `L0_lore_${newEntryData.id}`, text: text, level: 0, source_ids: [newEntryData.id.toString()] });
        setNewDetail({ category: '인물', keyword: '', description: '' });
    };

    const handleDeleteDetail = (id) => {
        setContextSettings(prev => ({ ...prev, details: prev.details.filter(d => d.id !== id) }));
    };

    const groupedDetails = useMemo(() => (contextSettings.details || []).reduce((acc, detail) => { (acc[detail.category] = acc[detail.category] || []).push(detail); return acc; }, {}), [contextSettings.details]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideClipboardList} title="상황 설정 (Situation)">
                    <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center px-3 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs transition-colors font-sans whitespace-nowrap">
                        <ICONS.LucideFileArchive className="w-3 h-3 mr-1.5" /> 템플릿 관리
                    </button>
                </CardHeader>
                <div className="space-y-3">
                    <EditableField
                        isTextarea
                        label="현재 상황 (Situation)"
                        value={contextSettings.situation || ''}
                        onChange={e => handleContextChange('situation', e.target.value)}
                        placeholder="장면이 시작될 때의 구체적인 시공간적 배경과 분위기를 서술합니다. AI는 이 정보를 바탕으로 첫 장면을 묘사합니다."
                        rows={8}
                    />
                </div>
            </Card>

            <Card>
                <CardHeader icon={ICONS.LucideClock} title="시작 시간 및 날씨 설정" />
                <div className="space-y-4">
                    <EditableField
                        label="시작 시간"
                        type="time"
                        value={contextSettings.startTime || '09:00'}
                        onChange={e => handleContextChange('startTime', e.target.value)}
                    />
                    <EditableField
                        label="시작 날씨"
                        type="text"
                        value={contextSettings.startWeather || '실내'}
                        onChange={e => handleContextChange('startWeather', e.target.value)}
                        placeholder="장면 시작 시점의 날씨를 입력합니다. (맑음, 흐림, 비, 눈, 실내 등)"
                    />
                </div>
            </Card>

            <Card>
                <CardHeader icon={ICONS.LucideLibrary} title="세부 설정 (Details)" />
                <div className="space-y-4">
                    <div className="p-3 bg-[var(--input-bg)] border border-dashed border-[var(--border-primary)] rounded-lg space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <select value={newDetail.category} onChange={e => handleDetailChange('category', e.target.value)} className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]">{LORE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                            <input type="text" placeholder="키워드" value={newDetail.keyword} onChange={e => handleDetailChange('keyword', e.target.value)} className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm border border-[var(--border-primary)]" />
                        </div>
                        <textarea placeholder="설명" value={newDetail.description} onChange={e => handleDetailChange('description', e.target.value)} rows="3" className="w-full bg-[var(--bg-secondary)] p-2 rounded-md text-sm resize-none border border-[var(--border-primary)]" />
                        <button onClick={handleAddDetail} className="w-full py-2 bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] rounded-lg text-sm font-semibold transition-colors">세부 설정 추가</button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">{Object.entries(groupedDetails).map(([cat, details]) => (<Accordion key={cat} title={cat} icon={ICONS.LucideBookCopy}> <div className="space-y-2 p-2"> {details.map(detail => (<div key={detail.id} className="bg-[var(--bg-tertiary)] p-2.5 rounded-lg text-sm"> <div className="flex justify-between items-start"> <p className="font-bold">{detail.keyword}</p> <button onClick={() => handleDeleteDetail(detail.id)} className="text-[var(--text-secondary)] hover:text-[var(--danger)]"><ICONS.LucideTrash2 className="w-4 h-4" /></button> </div> <p className="text-[var(--text-secondary)] mt-1 break-all">{detail.description}</p> </div>))} </div> </Accordion>))}</div>
                </div>
            </Card>
        </div>
    );
};

export default ContextTab;