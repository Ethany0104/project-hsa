// --- Start of file: components/control_tower/tabs/SettingsTab.js ---

import React from 'react';
import { Card, CardHeader, Accordion } from '../../ui/layouts';
import { EditableField } from '../../ui/forms';
// [BUG FIX] EmotionAnalysisViewer import를 제거합니다.
import { RetrievedMemoryViewer, SettingSlider, ContextMeter, ApiLogViewer } from '../../ui/widgets';
import { ICONS, GEMINI_MODELS, NARRATIVE_STYLES, getSystemInstruction } from '../../../constants';
import { useStoryContext } from '../../../contexts/StoryProvider';

const SettingsTab = () => {
    const { storyProps, handlerProps } = useStoryContext();
    // [BUG FIX] 불필요해진 latestEmotionAnalysis와 characters를 제거합니다.
    const { aiSettings, contextInfo, retrievedMemories, apiLog } = storyProps;
    const { setAiSettings } = handlerProps;

    const handleSettingChange = (key, value) => {
      const numericFields = ['temperature', 'topK', 'topP', 'maxOutputTokens', 'maxContextTokens', 'shortTermMemoryTurns', 'retrievalTopK'];
      const finalValue = numericFields.includes(key) ? Number(value) : value;

      if (key === 'narrativeStyle') {
          const newInstruction = getSystemInstruction(finalValue);
          setAiSettings(prev => ({
              ...prev,
              narrativeStyle: finalValue,
              systemInstruction: newInstruction
          }));
      } else {
          setAiSettings(prev => ({ ...prev, [key]: finalValue }));
      }
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
                          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors flex items-center justify-center gap-2 ${value === style.id ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'}`}
                      >
                          {Icon && <Icon size={16} />}
                          {style.name}
                      </button>
                  );
              })}
          </div>
      </div>
    );

    const ModelSelector = ({ label, description, value, onChange }) => (
      <div className="font-sans">
          <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
          <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
          <select
              value={value}
              onChange={onChange}
              className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-all"
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
              <NarrativeStyleSelector value={aiSettings.narrativeStyle} onChange={handleSettingChange} />
              <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>
              <ModelSelector label="메인 엔진 (Main Engine)" description="페르소나 연기, 장면 묘사를 담당합니다." value={aiSettings.mainModel} onChange={e => handleSettingChange('mainModel', e.target.value)} />
              <ModelSelector label="보조 엔진 (Auxiliary Engine)" description="페르소나 프로필 생성 등 보조 작업을 처리합니다." value={aiSettings.auxModel} onChange={e => handleSettingChange('auxModel', e.target.value)} />
          </div>
        </Card>
        <Card>
          <CardHeader icon={ICONS.LucideSparkles} title="AI 생성 설정" />
          <div className="space-y-4">
              <SettingSlider label="온도 (Temperature)" description="높을수록 창의적이고 예측 불가능한 연기를 선보입니다." value={aiSettings.temperature} min={0} max={2} step={0.05} onChange={value => handleSettingChange('temperature', value)} />
              <SettingSlider label="Top-K" description="다음 단어 선택 시, 가장 확률 높은 K개의 단어 중에서만 고릅니다." value={aiSettings.topK} min={1} max={100} step={1} onChange={value => handleSettingChange('topK', value)} />
              <SettingSlider label="Top-P" description="온도와 함께 사용되며, 생성될 단어의 후보군을 동적으로 조절합니다." value={aiSettings.topP} min={0} max={1} step={0.05} onChange={value => handleSettingChange('topP', value)} />
          </div>
        </Card>
        <Card>
          <CardHeader icon={ICONS.LucideFileText} title="AI 지시문 (System Prompt)" />
          <textarea value={aiSettings.systemInstruction} onChange={e => handleSettingChange('systemInstruction', e.target.value)} rows="12" className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:border-[var(--accent-primary)] focus:ring-2 focus:ring-[var(--accent-primary)]/20 transition-colors resize-y font-mono" />
        </Card>
        <Card>
          <CardHeader icon={ICONS.LucideBrainCircuit} title="컨텍스트 및 기억 시스템" />
          <div className="space-y-4">
              <ContextMeter contextInfo={contextInfo} maxTokens={aiSettings.maxContextTokens} />
              {/* [BUG FIX] EmotionAnalysisViewer를 여기서 제거합니다. */}
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
    );
};

export default SettingsTab;
