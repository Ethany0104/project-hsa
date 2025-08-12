// --- Start of file: components/control_tower/tabs/SettingsTab.js ---

import React, { useState } from 'react';
import { Card, CardHeader, Accordion } from '../../ui/layouts';
import { EditableField } from '../../ui/forms';
import { RetrievedMemoryViewer, SettingSlider, ContextMeter, ApiLogViewer, ToggleSwitch } from '../../ui/widgets';
import { ICONS, GEMINI_MODELS, NARRATIVE_STYLES, getSystemInstruction } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';
import CodeEditor from '../../ui/CodeEditor';

// --- [신규] 시스템 프롬프트 편집 전용 모달 ---
const SystemPromptModal = ({ isOpen, onClose, value, onChange }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4" style={{ zIndex: 'var(--z-confirmation-modal)' }}>
            <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col border border-[var(--border-primary)] overflow-hidden">
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                        <ICONS.LucideFileText size={20} className="mr-3" />
                        AI 지시문 편집기 (System Prompt)
                    </h2>
                    <button onClick={onClose} className="px-4 py-2 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-colors">
                        완료
                    </button>
                </header>
                <div className="flex-grow min-h-0">
                    <CodeEditor language="markdown" value={value} onChange={onChange} height="100%" />
                </div>
            </div>
        </div>
    );
};


const AdvancedSettingsModal = ({ isOpen, onClose, settings, onSettingChange }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
            style={{ zIndex: 'var(--z-re-evaluation-modal)' }}
        >
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-lg border border-[var(--border-primary)]">
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                        <ICONS.LucideSparkles className="w-5 h-5 mr-3" />
                        AI 생성 세부 설정
                    </h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)]">
                        <ICONS.LucideX />
                    </button>
                </header>
                <div className="p-6 space-y-6">
                    <ToggleSwitch
                        label="AI 동적 평가 활성화"
                        description="AI가 매 턴마다 페르소나의 감정과 목표를 스스로 갱신합니다."
                        checked={settings.enableDynamicEvaluation}
                        onChange={() => onSettingChange('enableDynamicEvaluation', !settings.enableDynamicEvaluation)}
                    />
                    <ToggleSwitch
                        label="NSFW 묘사 활성화"
                        description="AI가 노골적인 성적, 폭력적 묘사를 생성하도록 허용합니다."
                        checked={settings.enableNsfw}
                        onChange={() => onSettingChange('enableNsfw', !settings.enableNsfw)}
                    />
                    <ToggleSwitch
                        label="이미지 연출 활성화"
                        description="AI가 응답에 맞춰 업로드된 에셋 이미지를 함께 표시합니다. (추가 비용 발생)"
                        checked={settings.enableImageGeneration}
                        onChange={() => onSettingChange('enableImageGeneration', !settings.enableImageGeneration)}
                    />
                    <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>
                    <ToggleSwitch
                        label="포지: UI 컴포넌트 활성화"
                        description="AI가 '포지'에 등록된 UI 컴포넌트(예: 스탯 판정)를 사용하도록 허용합니다."
                        checked={settings.enableInteractiveComponents}
                        onChange={() => onSettingChange('enableInteractiveComponents', !settings.enableInteractiveComponents)}
                    />
                    <ToggleSwitch
                        label="포지: 로직 스크립트 활성화"
                        description="AI가 '포지'에 등록된 로직(예: 데미지 계산)을 실행하도록 허용합니다."
                        checked={settings.enableLogicExecution}
                        onChange={() => onSettingChange('enableLogicExecution', !settings.enableLogicExecution)}
                    />
                    <ToggleSwitch
                        label="포지: 내장 프리셋 활성화"
                        description="AI에게 기본으로 제공되는 포지 기능(스탯 판정, 아이템 카드 등)을 사용하도록 허용합니다."
                        checked={settings.enableBuiltInTools}
                        onChange={() => onSettingChange('enableBuiltInTools', !settings.enableBuiltInTools)}
                    />
                </div>
                 <footer className="p-4 border-t border-[var(--border-primary)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200"
                    >
                        닫기
                    </button>
                </footer>
            </div>
        </div>
    );
};


const SettingsTab = () => {
    const { storyProps, handlerProps } = useStoryContext();
    const { aiSettings, contextInfo, retrievedMemories, apiLog } = storyProps;
    const { setAiSettings } = handlerProps;

    const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
    // --- [신규] 프롬프트 편집 모달 상태 추가 ---
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);

    const handleSettingChange = (key, value) => {
      const numericFields = ['temperature', 'topK', 'topP', 'maxOutputTokens', 'maxContextTokens', 'shortTermMemoryTurns', 'retrievalTopK'];
      
      let finalValue = value;
      if (numericFields.includes(key)) {
          finalValue = value === '' ? '' : Number(value);
      }

      setAiSettings(prev => {
          const newSettings = { ...prev, [key]: finalValue };

          if (key === 'narrativeStyle' || key === 'enableNsfw') {
            newSettings.systemInstruction = getSystemInstruction({ 
              style: newSettings.narrativeStyle, 
              enableNsfw: newSettings.enableNsfw 
            });
          }
          return newSettings;
      });
    };

    const NarrativeStyleSelector = ({ value, onChange }) => (
      <div className="font-sans" title="연출 모드를 변경하면 AI가 혼란을 겪을 수 있으니, 변경 후에는 '새 장면 시작'을 권장합니다.">
          <label className="block text-sm font-medium text-[var(--text-primary)]">연출 모드 (Narrative Style)</label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">AI의 서술 방식을 선택합니다.</p>
          <div className="flex bg-[var(--input-bg)] rounded-lg p-1 border border-[var(--border-primary)]">
              {NARRATIVE_STYLES.map(style => {
                  const Icon = ICONS[style.icon];
                  return (
                      <button
                          key={style.id}
                          onClick={() => onChange('narrativeStyle', style.id)}
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 flex items-center justify-center gap-2 ${value === style.id ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                      >
                          {Icon && <Icon size={16} />}
                          {style.name}
                      </button>
                  );
              })}
          </div>
      </div>
    );

    const ModelSelector = ({ label, description, value, onChange, modelKey }) => (
      <div className="font-sans">
          <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
          <select
              value={value}
              onChange={(e) => onChange(modelKey, e.target.value)}
              className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
          >
              {GEMINI_MODELS.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
              ))}
          </select>
      </div>
    );

    return (
      <>
        <div className="space-y-6">
          <Card>
            <CardHeader icon={ICONS.LucideCpu} title="AI 엔진 설정" />
            <div className="space-y-6">
                <NarrativeStyleSelector value={aiSettings.narrativeStyle} onChange={handleSettingChange} />
                <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>
                <ModelSelector 
                  label="메인 엔진 (Main Engine)" 
                  description="페르소나 연기, 장면 묘사를 담당합니다. Pro 모델은 비싸지만 고품질입니다." 
                  value={aiSettings.mainModel} 
                  onChange={handleSettingChange}
                  modelKey="mainModel"
                />
                <ModelSelector 
                  label="보조 엔진 (Auxiliary Engine)" 
                  description="페르소나 프로필 생성 등 보조 작업을 처리합니다." 
                  value={aiSettings.auxModel} 
                  onChange={handleSettingChange}
                  modelKey="auxModel"
                />
            </div>
          </Card>
          <Card>
            <CardHeader icon={ICONS.LucideSparkles} title="AI 생성 설정" />
            <div className="space-y-4">
                <SettingSlider label="온도 (Temperature)" description="높을수록 창의적이고 예측 불가능한 연기를 선보입니다." value={aiSettings.temperature} min={0} max={2} step={0.05} onChange={value => handleSettingChange('temperature', value)} />
                <SettingSlider label="Top-K" description="다음 단어 선택 시, 가장 확률 높은 K개의 단어 중에서만 고릅니다." value={aiSettings.topK} min={1} max={100} step={1} onChange={value => handleSettingChange('topK', value)} />
                <SettingSlider label="Top-P" description="온도와 함께 사용되며, 생성될 단어의 후보군을 동적으로 조절합니다." value={aiSettings.topP} min={0} max={1} step={0.05} onChange={value => handleSettingChange('topP', value)} />
                <div className="w-full h-px bg-[var(--border-primary)] opacity-50 my-2"></div>
                <button
                  onClick={() => setIsAdvancedSettingsOpen(true)}
                  className="w-full flex items-center justify-center px-4 py-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold transition-colors"
                >
                  <ICONS.LucideSettings className="w-4 h-4 mr-2" />
                  세부 생성 설정...
                </button>
            </div>
          </Card>
          <Card>
            {/* --- [수정] CardHeader에 확대 버튼 추가 --- */}
            <CardHeader icon={ICONS.LucideFileText} title="AI 지시문 (System Prompt)">
                <button onClick={() => setIsPromptModalOpen(true)} title="전체 화면으로 편집" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]">
                    <ICONS.LucideExpand size={16} />
                </button>
            </CardHeader>
            <CodeEditor
              language="markdown"
              value={aiSettings.systemInstruction}
              onChange={value => handleSettingChange('systemInstruction', value)}
              height="300px"
            />
          </Card>
          <Card>
            <CardHeader icon={ICONS.LucideBrainCircuit} title="컨텍스트 및 기억 시스템" />
            <div className="space-y-4">
                <ContextMeter contextInfo={contextInfo} maxTokens={aiSettings.maxContextTokens} />
                <RetrievedMemoryViewer memories={retrievedMemories} />
                <ApiLogViewer apiLog={apiLog} />
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

        <AdvancedSettingsModal
          isOpen={isAdvancedSettingsOpen}
          onClose={() => setIsAdvancedSettingsOpen(false)}
          settings={aiSettings}
          onSettingChange={handleSettingChange}
        />

        {/* --- [신규] 프롬프트 편집 모달 렌더링 --- */}
        <SystemPromptModal
            isOpen={isPromptModalOpen}
            onClose={() => setIsPromptModalOpen(false)}
            value={aiSettings.systemInstruction}
            onChange={value => handleSettingChange('systemInstruction', value)}
        />
      </>
    );
};

export default SettingsTab;
