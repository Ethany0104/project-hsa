// --- Start of file: components/control_tower/tabs/ContextTab.js ---

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, Accordion } from '../../ui/layouts';
import { EditableField } from '../../ui/forms';
import { Spinner } from '../../ui/widgets'; // Spinner import
import { ICONS } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';

const WorldviewRulesManager = ({ rules, onUpdate }) => {
    const handleAddRule = () => {
        const newRules = [...(rules || []), { id: Date.now(), keyword: '', description: '' }];
        onUpdate('worldview.rules', newRules);
    };

    const handleRuleChange = (index, field, value) => {
        const newRules = JSON.parse(JSON.stringify(rules));
        newRules[index][field] = value;
        onUpdate('worldview.rules', newRules);
    };

    const handleDeleteRule = (index) => {
        const newRules = JSON.parse(JSON.stringify(rules));
        newRules.splice(index, 1);
        onUpdate('worldview.rules', newRules);
    };

    return (
        <div className="space-y-3">
            <div className="space-y-2">
                {(rules || []).map((rule, index) => (
                    <div key={rule.id || `rule-${index}`} className="p-2.5 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)]">
                        <div className="flex items-center mb-2">
                            <input
                                type="text"
                                value={rule.keyword}
                                onChange={e => handleRuleChange(index, 'keyword', e.target.value)}
                                placeholder="규칙 이름 (예: 마법의 원리)"
                                className="flex-grow bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)]"
                            />
                            <button onClick={() => handleDeleteRule(index)} className="ml-2 text-[var(--text-secondary)] hover:text-[var(--danger)] p-1">
                                <ICONS.LucideTrash2 size={14} />
                            </button>
                        </div>
                        <textarea
                            value={rule.description}
                            onChange={e => handleRuleChange(index, 'description', e.target.value)}
                            placeholder="규칙에 대한 상세 설명"
                            rows="2"
                            className="w-full bg-[var(--bg-secondary)] p-1.5 rounded-md text-sm border border-[var(--border-primary)] resize-y"
                        />
                    </div>
                ))}
            </div>
            <button onClick={handleAddRule} className="w-full text-xs py-1.5 bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] rounded-md transition-colors">
                + 핵심 규칙 추가
            </button>
        </div>
    );
};

const ContextTab = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { contextSettings, isProcessing } = storyProps;
    // [FEATURE] handleGenerateWorldview 핸들러를 가져옵니다.
    const { setContextSettings, _addEntryToIndex, setIsTemplateModalOpen, handleGenerateWorldview } = handlerProps;

    const [newDetail, setNewDetail] = useState({ category: '인물', keyword: '', description: '' });
    const LORE_CATEGORIES = ['인물', '장소', '사건', '규칙', '기타'];

    const handleContextChange = (field, value) => {
        if (field.startsWith('worldview.')) {
            const keys = field.split('.');
            const worldviewField = keys[1];
            
            setContextSettings(prev => {
                const newWorldview = { ...(prev.worldview || {}) };
                let current = newWorldview;

                for (let i = 1; i < keys.length - 1; i++) {
                    current[keys[i]] = { ...(current[keys[i]] || {}) };
                    current = current[keys[i]];
                }
                current[keys[keys.length - 1]] = value;

                return { ...prev, worldview: newWorldview };
            });

        } else {
            setContextSettings(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleDetailChange = (field, value) => setNewDetail(prev => ({ ...prev, [field]: value }));

    const handleAddDetail = () => {
        if (!newDetail.keyword.trim() || !newDetail.description.trim()) return;
        const newEntryData = { ...newDetail, id: Date.now() };
        const updatedDetails = [...(contextSettings.details || []), newEntryData];
        setContextSettings(prev => ({ ...prev, details: updatedDetails }));
        const text = `[${newEntryData.category}] ${newEntryData.keyword}: ${newEntryData.description}`;
        _addEntryToIndex('loreIndex', { id: `L0_lore_${newEntryData.id}`, text: text, level: 0, source_ids: [newEntryData.id.toString()] });
        setNewDetail({ category: '인물', keyword: '', description: '' });
    };

    const handleDeleteDetail = (id) => {
        setContextSettings(prev => ({ ...prev, details: prev.details.filter(d => d.id !== id) }));
    };

    const groupedDetails = useMemo(() => (contextSettings.details || []).reduce((acc, detail) => { (acc[detail.category] = acc[detail.category] || []).push(detail); return acc; }, {}), [contextSettings.details]);
    
    const worldview = contextSettings.worldview || { genre: '', generationConcept: '', details: '', rules: [] };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideClipboardList} title="시작 장면 (Situation)">
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
                {/* [FEATURE] 헤더에 AI 자동 생성 버튼을 추가합니다. */}
                <CardHeader icon={ICONS.LucideGlobe} title="세계관 설정 (Worldview)">
                    <button 
                        onClick={handleGenerateWorldview}
                        disabled={isProcessing || !worldview.generationConcept?.trim()}
                        className="flex items-center px-3 py-1 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 rounded-md text-xs transition-colors font-sans whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isProcessing ? <Spinner className="w-3 h-3 mr-1.5" /> : <ICONS.LucideSparkles className="w-3 h-3 mr-1.5" />}
                        AI로 자동 생성
                    </button>
                </CardHeader>
                <div className="space-y-4">
                    <EditableField
                        label="장르 (Genre)"
                        value={worldview.genre}
                        onChange={e => handleContextChange('worldview.genre', e.target.value)}
                        placeholder="이야기의 장르를 입력합니다. (예: 판타지, SF, 현대 로맨스)"
                    />
                    {/* [FEATURE] summary 필드를 generationConcept과 details 필드로 분리합니다. */}
                    <EditableField
                        isTextarea
                        label="세계관 컨셉 (AI 참고용)"
                        value={worldview.generationConcept}
                        onChange={e => handleContextChange('worldview.generationConcept', e.target.value)}
                        placeholder="AI가 세계관을 자동으로 생성할 때 참고할 핵심 아이디어나 키워드를 자유롭게 서술합니다. 이 내용은 실제 연기 AI에게는 전달되지 않습니다."
                        rows={4}
                    />
                    <EditableField
                        isTextarea
                        label="세계관 상세 (AI 연기용)"
                        value={worldview.details}
                        onChange={e => handleContextChange('worldview.details', e.target.value)}
                        placeholder="이 세계의 배경, 분위기, 주요 특징 등을 요약하여 서술합니다. AI 자동 생성 버튼을 누르면 이 필드가 채워집니다."
                        rows={8}
                    />
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">핵심 규칙 (Core Rules)</label>
                        <WorldviewRulesManager
                            rules={worldview.rules}
                            onUpdate={(field, value) => handleContextChange(field, value)}
                        />
                    </div>
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
