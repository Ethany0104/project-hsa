import React, { useState, useMemo, useContext } from 'react';

// --- UI Component Imports ---
// 수정: 이제 모든 모달을 './ui'에서 한번에 가져올 수 있습니다.
import { 
    ReEvaluationModal, StoryListModal, ConfirmationModal, BlueprintTemplateModal, 
    CharacterTemplateModal, SaveCharacterTemplateModal 
} from './ui';
import { SettingsButtons, WorldClock, RetrievedMemoryViewer, SettingSlider, ContextMeter } from './ui/widgets';
import { Card, CardHeader, Accordion } from './ui/layouts';
import { EditableField } from './ui/forms';

import { ICONS, DEFAULT_NPC, GEMINI_MODELS } from '../constants';
// --- Context Imports ---
import { StoryDataContext } from '../contexts/StoryDataContext';
import { UIStateContext } from '../contexts/UIStateContext';


const SettingsTab = React.memo(() => {
  const { aiSettings, contextInfo, retrievedMemories, setAiSettings } = useContext(StoryDataContext);
  
  const handleSettingChange = (key, value) => {
    const numericFields = ['temperature', 'topK', 'topP', 'maxOutputTokens', 'maxContextTokens', 'shortTermMemoryTurns', 'retrievalTopK'];
    const finalValue = numericFields.includes(key) ? Number(value) : value;
    setAiSettings(prev => ({ ...prev, [key]: finalValue }));
  };

  const ModelSelector = ({ label, description, value, onChange }) => (
    <div className="font-sans">
        <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
        <select 
            value={value} 
            onChange={onChange}
            className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors"
        >
            {GEMINI_MODELS.map(model => (
                <option key={model.id} value={model.id}>{model.name}</option>
            ))}
        </select>
    </div>
  );
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader icon={ICONS.LucideCpu} title="AI 엔진 설정" />
        <div className="space-y-6">
            <ModelSelector
                label="메인 엔진 (Main Engine)"
                description="이야기의 핵심 서사, 문체, 창의성을 담당합니다. 더 깊이 있는 묘사를 원하면 Pro, 빠른 전개를 원하면 Flash를 선택하세요."
                value={aiSettings.mainModel}
                onChange={e => handleSettingChange('mainModel', e.target.value)}
            />
            <ModelSelector
                label="보조 엔진 (Auxiliary Engine)"
                description="캐릭터 프로필 생성, 기억 요약 등 보조 작업을 처리합니다. 대부분의 경우 Flash로 충분하지만, 더 정교한 분석을 원하면 Pro를 선택할 수 있습니다."
                value={aiSettings.auxModel}
                onChange={e => handleSettingChange('auxModel', e.target.value)}
            />
        </div>
      </Card>
      <Card>
        <CardHeader icon={ICONS.LucideSparkles} title="AI 생성 설정" />
        <div className="space-y-4">
            <SettingSlider label="온도 (Temperature)" description="높을수록 창의적이고 예측 불가능한 응답을 생성합니다." value={aiSettings.temperature} min={0} max={2} step={0.05} onChange={value => handleSettingChange('temperature', value)} />
            <SettingSlider label="Top-K" description="다음 단어 선택 시, 가장 확률 높은 K개의 단어 중에서만 고릅니다." value={aiSettings.topK} min={1} max={100} step={1} onChange={value => handleSettingChange('topK', value)} />
            <SettingSlider label="Top-P" description="온도와 함께 사용되며, 생성될 단어의 후보군을 동적으로 조절합니다." value={aiSettings.topP} min={0} max={1} step={0.05} onChange={value => handleSettingChange('topP', value)} />
        </div>
      </Card>
      <Card>
        <CardHeader icon={ICONS.LucideFileText} title="AI 지시문 (System Prompt)" />
        <textarea value={aiSettings.systemInstruction} onChange={e => handleSettingChange('systemInstruction', e.target.value)} rows="12" className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border)] focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)] transition-colors resize-y font-mono" />
      </Card>
      <Card>
        <CardHeader icon={ICONS.LucideBrainCircuit} title="컨텍스트 및 기억 시스템" />
        <div className="space-y-4">
            <ContextMeter contextInfo={contextInfo} maxTokens={aiSettings.maxContextTokens} />
            <RetrievedMemoryViewer memories={retrievedMemories} />
            <Accordion title="세부 설정" icon={ICONS.LucideGripVertical}>
                <div className="space-y-4 p-2">
                    <EditableField label="최대 출력 토큰" value={aiSettings.maxOutputTokens} onChange={e => handleSettingChange('maxOutputTokens', e.target.value)} type="number" />
                    <EditableField label="최대 컨텍스트 토큰" value={aiSettings.maxContextTokens} onChange={e => handleSettingChange('maxContextTokens', e.target.value)} type="number" />
                    <EditableField label="단기 기억 턴 수" value={aiSettings.shortTermMemoryTurns} onChange={e => handleSettingChange('shortTermMemoryTurns', e.target.value)} type="number" />
                    <EditableField label="기억 인출 개수 (Top-K)" value={aiSettings.retrievalTopK} onChange={e => handleSettingChange('retrievalTopK', e.target.value)} type="number" />
                </div>
            </Accordion>
        </div>
      </Card>
    </div>
  );
});

const LorebookTab = React.memo(() => {
  const { lorebook, setLorebook, _addEntryToIndex } = useContext(StoryDataContext);
  const { setIsTemplateModalOpen } = useContext(UIStateContext);
  const [newDetail, setNewDetail] = useState({ category: '역사', keyword: '', description: '' });
  const LORE_CATEGORIES = ['역사', '장소', '인물', '단체', '물건', '사건', '규칙', '기타'];
  
  const handleLorebookChange = (field, value) => setLorebook(prev => ({...prev, [field]: value}));
  const handleDetailChange = (field, value) => setNewDetail(prev => ({...prev, [field]: value}));
  
  const handleAddDetail = () => {
    if (!newDetail.keyword.trim() || !newDetail.description.trim()) return;
    const newEntryData = { ...newDetail, id: Date.now() };
    const updatedDetails = [...(lorebook.details || []), newEntryData];
    setLorebook(prev => ({ ...prev, details: updatedDetails }));
    
    const text = `[${newEntryData.category}] ${newEntryData.keyword}: ${newEntryData.description}`;
    _addEntryToIndex('loreIndex', { id: `L0_lore_${newEntryData.id}`, text: text, level: 0, source_ids: [newEntryData.id.toString()] });
    setNewDetail({ category: '역사', keyword: '', description: '' });
  };

  const handleDeleteDetail = (id) => {
    setLorebook(prev => ({ ...prev, details: prev.details.filter(d => d.id !== id) }));
  };

  const groupedDetails = useMemo(() => (lorebook.details || []).reduce((acc, detail) => { (acc[detail.category] = acc[detail.category] || []).push(detail); return acc; }, {}), [lorebook.details]);
  
  return (
    <div className="space-y-6">
        <Card>
            <CardHeader icon={ICONS.LucideBookOpen} title="이야기 설계도 (Blueprint)">
                <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center px-3 py-1 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs transition-colors font-sans whitespace-nowrap">
                    <ICONS.LucideFileArchive className="w-3 h-3 mr-1.5"/> 템플릿 관리
                </button>
            </CardHeader>
            <div className="space-y-3">
                <EditableField label="장르 (Genre)" value={lorebook.genre} onChange={e => handleLorebookChange('genre', e.target.value)} placeholder="예: 사이버펑크 스릴러" />
                <EditableField isTextarea label="세계관 (Worldview)" value={lorebook.worldview} onChange={e => handleLorebookChange('worldview', e.target.value)} placeholder="예: 2077년, 거대 기업 '유로코프'가 모든 것을 지배하는 디스토피아 도시 '네오-서울'..." rows={8} />
                <EditableField isTextarea label="전체 플롯 (Plot)" value={lorebook.plot} onChange={e => handleLorebookChange('plot', e.target.value)} placeholder="예: 주인공은 삭제된 자신의 과거 기억을 되찾기 위해..." rows={8} />
            </div>
        </Card>
        <Card>
            <CardHeader icon={ICONS.LucideLibrary} title="세부 설정 (Details)" />
            <div className="space-y-4">
                <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                        <select value={newDetail.category} onChange={e => handleDetailChange('category', e.target.value)} className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm border border-[var(--border)]">{LORE_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select>
                        <input type="text" placeholder="키워드" value={newDetail.keyword} onChange={e => handleDetailChange('keyword', e.target.value)} className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm border border-[var(--border)]" />
                    </div>
                    <textarea placeholder="설명" value={newDetail.description} onChange={e => handleDetailChange('description', e.target.value)} rows="3" className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm resize-none border border-[var(--border)]" />
                    <button onClick={handleAddDetail} className="w-full py-2 bg-[var(--accent)] text-white hover:opacity-90 rounded-lg text-sm font-semibold">세부 설정 추가</button>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">{Object.entries(groupedDetails).map(([cat, details]) => ( <Accordion key={cat} title={cat} icon={ICONS.LucideBookCopy}> <div className="space-y-2 p-2"> {details.map(detail => ( <div key={detail.id} className="bg-[var(--panel-bg-alt)] p-2.5 rounded-lg text-sm"> <div className="flex justify-between items-start"> <p className="font-bold">{detail.keyword}</p> <button onClick={() => handleDeleteDetail(detail.id)} className="text-[var(--text-secondary)] hover:text-red-500"><ICONS.LucideTrash2 className="w-4 h-4" /></button> </div> <p className="text-[var(--text-secondary)] mt-1 break-all">{detail.description}</p> </div> ))} </div> </Accordion> ))}</div>
            </div>
        </Card>
    </div>
  );
});

const CharacterTab = React.memo(({ onEditCharacter }) => { 
    const { characters, setCharacters } = useContext(StoryDataContext);
    const { setIsCharacterTemplateModalOpen } = useContext(UIStateContext);

    const [isAddingNpc, setIsAddingNpc] = useState(false); 
    const [newNpcName, setNewNpcName] = useState(""); 
    const [npcToDelete, setNpcToDelete] = useState(null); 
    
    const handleConfirmAddNpc = () => { 
        if (!newNpcName.trim()) return; 
        const newNpc = { ...DEFAULT_NPC, id: Date.now(), name: newNpcName.trim() }; 
        setCharacters(prev => [...prev, newNpc]); 
        setNewNpcName(""); 
        setIsAddingNpc(false); 
    }; 

    const confirmDeleteNpc = (npc) => setNpcToDelete(npc); 
    
    const executeDeleteNpc = () => { 
        if (!npcToDelete) return; 
        setCharacters(prev => prev.filter(c => c.id !== npcToDelete.id)); 
        setNpcToDelete(null); 
    }; 

    const protagonist = useMemo(() => characters.find(c => c.isProtagonist), [characters]);
    const npcs = useMemo(() => characters.filter(c => !c.isProtagonist), [characters]);

    return ( 
    <> 
        <div className="space-y-6"> 
            {protagonist && (
                <Card>
                     <div className="flex justify-between items-center mb-2">
                        <CardHeader icon={ICONS.LucideStar} title="주인공" />
                        <button onClick={() => onEditCharacter(protagonist)} className="flex items-center px-3 py-1 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs">
                            <ICONS.LucideEdit className="w-3 h-3 mr-1.5"/> 편집
                        </button>
                    </div>
                    <div className="p-2">
                        <h3 className="font-bold text-lg">{protagonist.name || "이름 없음"}</h3>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 truncate">{protagonist.note || "노트 미설정"}</p>
                    </div>
                </Card>
            )} 
            <Card>
                <CardHeader icon={ICONS.LucideUsers} title="주변 인물 (NPC)">
                    <button onClick={() => setIsAddingNpc(true)} className="flex items-center px-2 py-1 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs">
                        <ICONS.LucidePlus className="w-4 h-4 mr-1"/> 새 인물
                    </button> 
                </CardHeader>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {isAddingNpc && (
                        <div className="p-3 bg-[var(--input-bg)] border border-[var(--border)] rounded-lg space-y-2">
                            <input type="text" placeholder="새 인물의 이름" value={newNpcName} onChange={(e) => setNewNpcName(e.target.value)} className="w-full bg-[var(--panel-bg)] p-2 rounded-md text-sm border border-[var(--border)]" autoFocus />
                            <div className="flex space-x-2">
                                <button onClick={handleConfirmAddNpc} className="flex-1 py-1 bg-[var(--accent)] text-white hover:opacity-90 rounded-md text-xs">추가</button>
                                <button onClick={() => setIsAddingNpc(false)} className="flex-1 py-1 bg-gray-600 hover:bg-gray-500 rounded-md text-xs">취소</button>
                            </div>
                        </div>
                    )} 
                    {npcs.map(char => (
                        <div key={char.id} className="flex items-center justify-between p-3 hover:bg-[var(--panel-bg-alt)] rounded-lg group">
                            <div>
                                <h3 className="font-bold">{char.name}</h3>
                                <p className="text-xs text-[var(--text-secondary)] break-words">{char.note || '노트 미설정'}</p>
                            </div>
                            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                                <button onClick={() => onEditCharacter(char)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent)]"><ICONS.LucideEdit size={16}/></button>
                                <button onClick={() => confirmDeleteNpc(char)} className="p-1.5 text-[var(--text-secondary)] hover:text-red-500"><ICONS.LucideTrash2 size={16}/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
            <div className="pt-2">
                <button onClick={() => setIsCharacterTemplateModalOpen(true)} className="w-full flex items-center justify-center px-4 py-3 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-sm font-semibold">
                    <ICONS.LucideFileArchive className="w-4 h-4 mr-2"/> 캐릭터 불러오기
                </button>
            </div>
        </div> 
        <ConfirmationModal isOpen={!!npcToDelete} onClose={() => setNpcToDelete(null)} onConfirm={executeDeleteNpc} title="인물 삭제 확인">
            <p>정말로 <strong>{npcToDelete?.name}</strong> 인물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
        </ConfirmationModal> 
    </> 
    ); 
});

const OocControlTab = React.memo(({ onTogglePdChat }) => {
    const { handleIntervention, handleMemoryCompression } = useContext(StoryDataContext);
    const { isProcessing } = useContext(UIStateContext);
    const [interventionText, setInterventionText] = useState('');

    const handleInterveneClick = () => {
        if (!interventionText.trim()) return;
        handleIntervention(interventionText);
        setInterventionText('');
    };
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideMessageCircle} title="OOC 컨트롤 (Out-of-Character)" />
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">캐릭터의 시점이 아닌, 작가의 시점에서 AI에게 직접 지시를 내립니다...</p>
                    <textarea placeholder="예: ((두 사람 사이에 흐르는 긴장감을 고조시켜줘.))" value={interventionText} onChange={e => setInterventionText(e.target.value)} rows="4" className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm border border-[var(--border)] resize-y" />
                    <button onClick={handleInterveneClick} disabled={isProcessing || !interventionText.trim()} className="w-full flex items-center justify-center px-4 py-2.5 bg-red-600 text-white hover:bg-red-700 rounded-lg text-sm font-bold disabled:bg-gray-600">
                        <ICONS.LucideZap className="w-4 h-4 mr-2"/> OOC 전송
                    </button>
                </div>
            </Card>
            <Card>
                <CardHeader icon={ICONS.LucideBrainCog} title="기억 및 보조 기능" />
                <div className="space-y-3">
                    <p className="text-sm text-[var(--text-secondary)]">이야기의 기록을 압축하거나, PD AI와 대화하며 아이디어를 얻으세요.</p>
                    <div className="flex space-x-2">
                        <button onClick={() => handleMemoryCompression(1)} disabled={isProcessing} className="flex-1 flex items-center justify-center px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] rounded-lg text-sm font-semibold disabled:opacity-50">장면 압축 (L1)</button>
                        <button onClick={() => handleMemoryCompression(2)} disabled={isProcessing} className="flex-1 flex items-center justify-center px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] rounded-lg text-sm font-semibold disabled:opacity-50">에피소드 압축 (L2)</button>
                    </div>
                    <button onClick={onTogglePdChat} className="w-full flex items-center justify-center px-4 py-2.5 bg-[var(--accent-bg)] border border-[var(--accent)]/30 text-[var(--accent)] hover:bg-[var(--accent)]/20 rounded-lg text-sm font-bold">
                        <ICONS.LucideBot className="w-4 h-4 mr-2"/> PD에게 질문하기
                    </button>
                </div>
            </Card>
        </div>
    );
});

function ControlTowerFunc({ isOpen, onToggle, theme, onToggleTheme, onEditCharacter, onTogglePdChat }) {
  const [activeTab, setActiveTab] = useState('character');
  const data = useContext(StoryDataContext);
  const ui = useContext(UIStateContext);
  
  const { storyId, storyTitle, storyList, blueprintTemplates, characterTemplates, worldState, characters, lorebook, handleNewStory, handleSaveStory, handleLoadStory, handleDeleteStory, handleSaveBlueprintTemplate, handleDeleteBlueprintTemplate, setLorebook, handleLoadCharacterTemplate, handleDeleteCharacterTemplate, handleConfirmSaveCharacterTemplate } = data;
  const { isProcessing, reEvaluation, isTemplateModalOpen, isCharacterTemplateModalOpen, characterToSave, setIsTemplateModalOpen, setIsCharacterTemplateModalOpen, setCharacterToSave } = ui;
  
  const [isStoryListOpen, setIsStoryListOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);

  const confirmDeleteStory = (story) => { setStoryToDelete(story); };
  const executeDeleteStory = () => { 
      if (!storyToDelete) return; 
      handleDeleteStory(storyToDelete.id); 
      setStoryToDelete(null); 
      setIsStoryListOpen(false);
  };

  const navItems = [
    { id: 'character', icon: ICONS.LucideUsers, label: '인물' },
    { id: 'lorebook', icon: ICONS.LucideBookCopy, label: '로어북' },
    { id: 'settings', icon: ICONS.LucideSettings, label: 'AI 설정' },
    { id: 'ooc', icon: ICONS.LucideMessageCircle, label: 'OOC' },
  ];

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'settings': return <SettingsTab />;
      case 'lorebook': return <LorebookTab />;
      case 'character': return <CharacterTab onEditCharacter={onEditCharacter} />;
      case 'ooc': return <OocControlTab onTogglePdChat={onTogglePdChat} />;
      default: return null;
    }
  }, [activeTab, onEditCharacter, onTogglePdChat]);

  const protagonist = characters.find(c => c.isProtagonist);
  const isNewStoryDisabled = !lorebook.genre || !lorebook.worldview || !protagonist?.name;

  const handleLoadBlueprint = (template) => {
    setLorebook(prev => ({ ...prev, genre: template.genre, worldview: template.worldview, plot: template.plot }));
  };

  return (
    <>
      <div className={`fixed inset-0 bg-black/50 z-30 md:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onToggle}></div>
      <aside className={`fixed inset-y-0 left-0 z-40 w-full max-w-md md:max-w-none md:relative md:w-[440px] flex transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="w-16 bg-[var(--panel-bg)] flex flex-col items-center justify-between py-4 border-r border-[var(--border)]">
            <div>
                <img src="/logo.png" alt="App Logo" className="w-8 h-8 rounded-lg mb-8 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/32x32/6D28D9/FFFFFF?text=A' }}/>
                <div className="space-y-2">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} title={item.label} className={`w-10 h-10 flex items-center justify-center rounded-lg transition-all duration-200 relative ${activeTab === item.id ? 'bg-[var(--accent-bg)] text-[var(--accent)]' : 'text-[var(--text-secondary)] hover:bg-[var(--panel-bg-alt)] hover:text-[var(--text-primary)]'}`}>
                            <item.icon size={22} />
                            {activeTab === item.id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[var(--accent)] rounded-r-full"></div>}
                        </button>
                    ))}
                </div>
            </div>
            <button onClick={onToggleTheme} className="w-10 h-10 flex items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--panel-bg-alt)] hover:text-[var(--text-primary)] transition-colors">
                {theme === 'light' ? <ICONS.LucideMoon size={22} /> : <ICONS.LucideSun size={22} />}
            </button>
        </div>
        <div className="flex-1 bg-[var(--bg)] flex flex-col min-h-0 min-w-0">
            <header className="p-4 border-b border-[var(--border)] text-center">
                <h1 className="text-lg font-bold text-[var(--text-primary)] truncate font-sans">{storyTitle || '새로운 이야기'}</h1>
                {storyId && <WorldClock worldState={worldState} />}
            </header>
            <div className="flex-grow p-4 overflow-y-auto min-h-0">{renderTabContent}</div>
            <footer className="p-3 border-t border-[var(--border)] bg-[var(--bg)]">
               <SettingsButtons onSave={handleSaveStory} onNewStory={handleNewStory} onListOpen={() => setIsStoryListOpen(true)} isLoading={isProcessing} isNewStoryDisabled={isNewStoryDisabled} storyId={storyId} />
            </footer>
        </div>
      </aside>
      
      <StoryListModal isOpen={isStoryListOpen} stories={storyList} onLoad={(id) => { handleLoadStory(id); setIsStoryListOpen(false); }} onDelete={confirmDeleteStory} onClose={() => setIsStoryListOpen(false)} />
      <ConfirmationModal isOpen={!!storyToDelete} onClose={() => setStoryToDelete(null)} onConfirm={executeDeleteStory} title="이야기 삭제 확인">
        <p className="font-sans">정말로 <strong className="text-[var(--accent)]">{storyToDelete?.title}</strong> 이야기를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      </ConfirmationModal>
      {/* 수정: ReEvaluationModal은 이제 props를 받지 않고 내부에서 Context를 사용합니다. */}
      <ReEvaluationModal />
      <BlueprintTemplateModal isOpen={isTemplateModalOpen} templates={blueprintTemplates} onSave={handleSaveBlueprintTemplate} onLoad={handleLoadBlueprint} onDelete={handleDeleteBlueprintTemplate} onClose={() => setIsTemplateModalOpen(false)} />
      <CharacterTemplateModal isOpen={isCharacterTemplateModalOpen} templates={characterTemplates} onLoad={handleLoadCharacterTemplate} onDelete={handleDeleteCharacterTemplate} onClose={() => setIsCharacterTemplateModalOpen(false)} />
      <SaveCharacterTemplateModal character={characterToSave} onSave={handleConfirmSaveCharacterTemplate} onClose={() => setCharacterToSave(null)} />
    </>
  );
}

const ControlTower = React.memo(ControlTowerFunc);
export default ControlTower;
