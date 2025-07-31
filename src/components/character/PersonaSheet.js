import React, { useState } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import { ICONS } from '../../constants';
import { Card, CardHeader } from '../ui/layouts';
import { EditableField } from '../ui/forms';
import { Spinner, EmotionAnalysisViewer } from '../ui/widgets';
import RelationshipManager from './sheet_parts/RelationshipManager';
import ScheduleManager from './sheet_parts/ScheduleManager';
import BdsmSlider from './sheet_parts/BdsmSlider';
import PossessionsManager from './sheet_parts/PossessionsManager';

// [BUG FIX] 실시간 감정 분석 결과를 표시하기 위해 latestEmotionAnalysis prop을 받습니다.
const ProfileTabContent = ({ localCharacter, handleLocalChange, handleImageUpload, latestEmotionAnalysis }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: 기본 정보 및 연기 가이드 */}
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideFileText} title="기본 정보" />
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">프로필 이미지</label>
                        <div className="w-full aspect-[2/3] rounded-lg bg-[var(--input-bg)] flex items-center justify-center border border-dashed border-[var(--border-primary)] overflow-hidden mb-3">
                            {localCharacter.profileImageUrl ? (
                                <img src={localCharacter.profileImageUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                            ) : (
                                <ICONS.LucideImage className="w-16 h-16 text-[var(--text-secondary)] opacity-50" />
                            )}
                        </div>
                        <div className="flex flex-col items-center">
                            <label htmlFor={`npc-profile-image-upload-${localCharacter.id}`} className="cursor-pointer bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary)] hover:bg-[var(--border-secondary)] rounded-lg px-4 py-2 text-sm font-semibold transition-colors">
                                이미지 업로드
                            </label>
                            <p className="text-xs text-[var(--text-secondary)] mt-2">최대 2MB (PNG, JPG, WEBP)</p>
                        </div>
                        <input id={`npc-profile-image-upload-${localCharacter.id}`} type="file" accept="image/png, image/jpeg, image/webp" onChange={handleImageUpload} className="hidden" />
                    </div>
                    <EditableField label="이름" value={localCharacter.name || ''} onChange={e => handleLocalChange('name', e.target.value)} placeholder="페르소나의 이름을 입력합니다." />
                    <div className="grid grid-cols-2 gap-4">
                        <EditableField label="나이" type="number" value={localCharacter.age || ''} onChange={e => handleLocalChange('age', parseInt(e.target.value) || 0)} placeholder="페르소나의 나이를 입력합니다." />
                        <EditableField label="직업" value={localCharacter.job || ''} onChange={e => handleLocalChange('job', e.target.value)} placeholder="페르소나의 직업을 입력합니다." />
                    </div>
                    <EditableField isTextarea rows={5} label="외형" value={localCharacter.appearance || ''} onChange={e => handleLocalChange('appearance', e.target.value)} placeholder="페르소나의 외모, 체형, 자주 입는 옷차림 등을 구체적으로 묘사합니다." />
                    <EditableField isTextarea rows={3} label="생성 컨셉 (AI 참고용)" value={localCharacter.Concept || ''} onChange={e => handleLocalChange('Concept', e.target.value)} placeholder="AI 프로필 자동 생성 시에만 참고할 페르소나의 핵심 컨셉이나 키워드를 서술합니다." />
                </div>
            </Card>
            <Card>
                <CardHeader icon={ICONS.LucideDrama} title="서사적 프로필 (동기)" />
                <div className="space-y-4">
                    <EditableField isTextarea rows={4} label="결정적 경험" value={localCharacter.formativeEvent || ''} onChange={e => handleLocalChange('formativeEvent', e.target.value)} placeholder="페르소나의 가치관을 형성한 인생의 전환점, 트라우마, 운명적 사건 등을 서술합니다." />
                    <EditableField isTextarea rows={4} label="핵심 원칙" value={localCharacter.corePrinciple || ''} onChange={e => handleLocalChange('corePrinciple', e.target.value)} placeholder="결정적 경험을 통해 얻게 된, 페르소나가 결코 타협하지 않는 삶의 신조나 규칙을 서술합니다." />
                    <EditableField isTextarea rows={4} label="코어 디자이어" value={localCharacter.coreDesire || ''} onChange={e => handleLocalChange('coreDesire', e.target.value)} placeholder="페르소나가 삶 전체를 통해 무의식적으로 추구하는 궁극적인 욕망(사랑, 복수, 안정, 인정 등)을 서술합니다." />
                </div>
            </Card>
        </div>
        {/* Column 2: 연기 가이드 및 실시간 상태 */}
        <div className="space-y-6">
            <Card>
                <CardHeader icon={ICONS.LucideTheater} title="연기 가이드" />
                <div className="space-y-4">
                    <EditableField isTextarea rows={2} label="인물 요약 (Summary)" value={localCharacter.roleplayGuide?.summary || ''} onChange={e => handleLocalChange('roleplayGuide.summary', e.target.value)} placeholder="페르소나의 핵심 정체성을 한 문장으로 요약하여 서술합니다." />
                    <EditableField isTextarea rows={3} label="말투 및 화법 (Speech Style)" value={localCharacter.roleplayGuide?.speechStyle || ''} onChange={e => handleLocalChange('roleplayGuide.speechStyle', e.target.value)} placeholder="페르소나의 평소 말투, 자주 사용하는 어휘, 목소리 톤 등을 구체적으로 서술합니다."/>
                    <EditableField isTextarea rows={3} label="행동 방식 및 버릇 (Mannerisms)" value={localCharacter.roleplayGuide?.mannerisms || ''} onChange={e => handleLocalChange('roleplayGuide.mannerisms', e.target.value)} placeholder="무의식적으로 반복하는 행동이나 버릇, 특정 상황에서 드러나는 습관을 서술합니다." />
                    <EditableField isTextarea rows={3} label="핵심 지식 (Core Knowledge)" value={localCharacter.roleplayGuide?.coreKnowledge || ''} onChange={e => handleLocalChange('roleplayGuide.coreKnowledge', e.target.value)} placeholder="페르소나가 전문적으로 알고 있는 지식 분야나, 반대로 전혀 모르는 분야를 서술합니다." />
                </div>
            </Card>
            {/* [BUG FIX] 실시간 감정 분석 결과를 프로필 탭으로 이동합니다. */}
            <Card>
                <CardHeader icon={ICONS.LucideBrainCircuit} title="실시간 감정 분석 (읽기 전용)" />
                <EmotionAnalysisViewer analysis={latestEmotionAnalysis} characterId={localCharacter.id} />
            </Card>
            <Card>
                <CardHeader icon={ICONS.LucideZap} title="AI의 단기 목표 (읽기 전용)" />
                <div className="space-y-4 text-sm p-2">
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">주요 목표 (Primary Goal)</label>
                        <p className="p-2.5 bg-[var(--input-bg)] rounded-lg text-[var(--text-secondary)] border border-[var(--border-primary)] min-h-[44px]">
                            {localCharacter.goals?.primaryGoal || 'AI가 설정한 목표가 여기에 표시됩니다.'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">대안 목표 (Alternative Goal)</label>
                        <p className="p-2.5 bg-[var(--input-bg)] rounded-lg text-[var(--text-secondary)] border border-[var(--border-primary)] min-h-[44px]">
                            {localCharacter.goals?.alternativeGoal || 'AI가 설정한 대안 목표가 여기에 표시됩니다.'}
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    </div>
);

const LifestyleTabContent = ({ localCharacter, allCharacters, handleLocalChange, handleGenerateSchedule, isProcessing }) => {
    const attitudeOptions = ['현실주의적', '낙관주의적', '염세주의적', '쾌락주의적', '허무주의적'];

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: 생활, 공간 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideCoffee} title="생활 양식" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">삶의 태도</label>
                            <select value={localCharacter.lifestyle?.attitude || '현실주의적'} onChange={e => handleLocalChange('lifestyle.attitude', e.target.value)} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)]">
                                {attitudeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <EditableField isTextarea rows={4} label="일상의 루틴 & 습관" value={localCharacter.lifestyle?.routines || ''} onChange={e => handleLocalChange('lifestyle.routines', e.target.value)} placeholder="매일 반복하는 일상의 습관이나 규칙적인 활동을 서술합니다." />
                        <EditableField isTextarea rows={4} label="사소한 기쁨" value={localCharacter.lifestyle?.pleasures || ''} onChange={e => handleLocalChange('lifestyle.pleasures', e.target.value)} placeholder="페르소나에게 소소한 행복이나 만족감을 주는 것들을 서술합니다." />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideHome} title="공간과 사물" />
                    <div className="space-y-4">
                        <EditableField isTextarea rows={5} label="거주 공간" value={localCharacter.space?.livingSpace || ''} onChange={e => handleLocalChange('space.livingSpace', e.target.value)} placeholder="페르소나가 주로 생활하는 공간의 인테리어, 분위기, 특징 등을 묘사합니다." />
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5 flex items-center"><ICONS.LucideArchive size={14} className="mr-2" /> 소중한 물건</label>
                            <PossessionsManager possessions={localCharacter.space?.cherishedPossessions} onUpdate={handleLocalChange} />
                        </div>
                    </div>
                </Card>
            </div>
            {/* Column 2: 시간표, 관계망 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideCalendarDays} title="일과 시간표" />
                    <ScheduleManager character={localCharacter} onUpdate={handleLocalChange} onGenerate={handleGenerateSchedule} isProcessing={isProcessing} />
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideHeartHandshake} title="관계망" />
                    <RelationshipManager character={localCharacter} allCharacters={allCharacters} onUpdate={(field, value) => handleLocalChange(field, value)} />
                </Card>
            </div>
        </div>
    );
};


const PsycheTabContent = ({ localCharacter, handleLocalChange, handleGenerateEmotionProfile, isProcessing }) => {
    const defenseMechanismOptions = ['선택 안 함', '합리화', '투사', '부정', '억압', '반동 형성', '지성화', '유머', '승화'];
    const sexualAttitudeOptions = ['쾌락주의적', '관계중심적', '권력지향적', '보수적/소극적'];
    const intimacyStyleOptions = ['안정형', '불안형', '회피형'];

    const handleRandomizeBdsm = () => {
        const getRandomValue = () => Math.floor(Math.random() * 201) - 100;
        handleLocalChange('libido.bdsmProfile.dominance', getRandomValue());
        handleLocalChange('libido.bdsmProfile.sadism', getRandomValue());
        handleLocalChange('libido.bdsmProfile.psychological', getRandomValue());
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Column 1: 감정 프로필 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideSmilePlus} title="감정 프로필" />
                    <div className="space-y-6">
                        <button
                            onClick={() => handleGenerateEmotionProfile(localCharacter.id)}
                            disabled={isProcessing}
                            className="w-full flex items-center justify-center px-4 py-2 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/20 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                        >
                            {isProcessing ? <Spinner className="w-4 h-4 mr-2" /> : <ICONS.LucideSparkles className="w-4 h-4 mr-2" />}
                            AI로 감정 프로필 자동 생성
                        </button>
                        
                        <div>
                            <h4 className="font-semibold text-md text-[var(--text-primary)] mb-2">분노 (Anger)</h4>
                            <div className="space-y-3 pl-2 border-l-2 border-[var(--border-primary)]">
                                <EditableField isTextarea rows={3} label="내향적 분노 반응" value={localCharacter.emotionProfile?.anger?.introverted || ''} onChange={e => handleLocalChange('emotionProfile.anger.introverted', e.target.value)} placeholder="분노를 안으로 삭일 때의 행동, 표정, 내면 상태를 서술합니다." />
                                <EditableField isTextarea rows={3} label="외향적 분노 반응" value={localCharacter.emotionProfile?.anger?.extroverted || ''} onChange={e => handleLocalChange('emotionProfile.anger.extroverted', e.target.value)} placeholder="분노를 겉으로 표출할 때의 행동, 말투, 파괴적인 성향 등을 서술합니다." />
                                <EditableField isTextarea rows={3} label="수동-공격적 분노 반응" value={localCharacter.emotionProfile?.anger?.passiveAggressive || ''} onChange={e => handleLocalChange('emotionProfile.anger.passiveAggressive', e.target.value)} placeholder="분노를 간접적, 비꼬는 방식으로 표출할 때의 행동을 서술합니다." />
                            </div>
                        </div>

                        <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>

                        <div>
                            <h4 className="font-semibold text-md text-[var(--text-primary)] mb-2">슬픔 (Sadness)</h4>
                            <div className="space-y-3 pl-2 border-l-2 border-[var(--border-primary)]">
                                <EditableField isTextarea rows={3} label="내향적 슬픔 반응" value={localCharacter.emotionProfile?.sadness?.introverted || ''} onChange={e => handleLocalChange('emotionProfile.sadness.introverted', e.target.value)} placeholder="혼자 슬픔을 감내할 때의 행동, 습관, 내면 상태를 서술합니다." />
                                <EditableField isTextarea rows={3} label="외향적 슬픔 반응" value={localCharacter.emotionProfile?.sadness?.extroverted || ''} onChange={e => handleLocalChange('emotionProfile.sadness.extroverted', e.target.value)} placeholder="타인에게 슬픔을 드러낼 때의 행동, 위로를 구하는 방식 등을 서술합니다." />
                            </div>
                        </div>

                        <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>

                        <div>
                            <h4 className="font-semibold text-md text-[var(--text-primary)] mb-2">기쁨 (Joy)</h4>
                            <div className="space-y-3 pl-2 border-l-2 border-[var(--border-primary)]">
                                <EditableField isTextarea rows={3} label="내향적 기쁨 반응" value={localCharacter.emotionProfile?.joy?.introverted || ''} onChange={e => handleLocalChange('emotionProfile.joy.introverted', e.target.value)} placeholder="조용히 기쁨을 음미할 때의 미묘한 표정 변화나 행동을 서술합니다." />
                                <EditableField isTextarea rows={3} label="외향적 기쁨 반응" value={localCharacter.emotionProfile?.joy?.extroverted || ''} onChange={e => handleLocalChange('emotionProfile.joy.extroverted', e.target.value)} placeholder="기쁨을 숨기지 않고 표현할 때의 행동, 웃음소리, 타인과의 상호작용을 서술합니다." />
                            </div>
                        </div>

                        <div className="w-full h-px bg-[var(--border-primary)] opacity-50"></div>

                        <div>
                            <h4 className="font-semibold text-md text-[var(--text-primary)] mb-2">두려움 (Fear)</h4>
                            <div className="space-y-3 pl-2 border-l-2 border-[var(--border-primary)]">
                                <EditableField isTextarea rows={3} label="내향적 두려움 반응" value={localCharacter.emotionProfile?.fear?.introverted || ''} onChange={e => handleLocalChange('emotionProfile.fear.introverted', e.target.value)} placeholder="두려움으로 인해 얼어붙거나 회피할 때의 행동, 신체 반응을 서술합니다." />
                                <EditableField isTextarea rows={3} label="외향적 두려움 반응" value={localCharacter.emotionProfile?.fear?.extroverted || ''} onChange={e => handleLocalChange('emotionProfile.fear.extroverted', e.target.value)} placeholder="두려움을 비명, 도망 등 외부로 표출할 때의 행동을 서술합니다." />
                            </div>
                        </div>
                    </div>
                </Card>
            </div>
            {/* Column 2: 방어기제, 리비도, 취향 */}
            <div className="space-y-6">
                <Card>
                    <CardHeader icon={ICONS.LucideShield} title="방어기제" />
                    <div>
                        <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">주된 방어기제</label>
                        <select value={localCharacter.psyche?.defenseMechanism || '선택 안 함'} onChange={e => handleLocalChange('psyche.defenseMechanism', e.target.value)} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)]">
                            {defenseMechanismOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideHeartPulse} title="리비도 & 친밀감" />
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">성적 태도</label>
                            <select value={localCharacter.libido?.attitude || '관계중심적'} onChange={e => handleLocalChange('libido.attitude', e.target.value)} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)]">
                                {sexualAttitudeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">친밀감 스타일</label>
                            <select value={localCharacter.libido?.intimacyStyle || '안정형'} onChange={e => handleLocalChange('libido.intimacyStyle', e.target.value)} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm text-[var(--text-primary)] border border-[var(--border-primary)]">
                                {intimacyStyleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="pt-2">
                             <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2 flex items-center"><ICONS.LucideSwords size={16} className="mr-2 text-[var(--accent-primary)]" /> BDSM 성향 분석</h4>
                             <div className="space-y-3">
                                <BdsmSlider label="지배/복종" value={localCharacter.libido?.bdsmProfile?.dominance || 0} onChange={v => handleLocalChange('libido.bdsmProfile.dominance', v)} labels={['복종', '지배']} />
                                <BdsmSlider label="가학/피학" value={localCharacter.libido?.bdsmProfile?.sadism || 0} onChange={v => handleLocalChange('libido.bdsmProfile.sadism', v)} labels={['피학', '가학']} />
                                <BdsmSlider label="정신/육체" value={localCharacter.libido?.bdsmProfile?.psychological || 0} onChange={v => handleLocalChange('libido.bdsmProfile.psychological', v)} labels={['정신', '육체']} />
                             </div>
                             <button
                                onClick={handleRandomizeBdsm}
                                className="w-full text-xs py-1.5 mt-4 bg-[var(--bg-tertiary)] hover:bg-[var(--border-secondary)] rounded-md transition-colors flex items-center justify-center"
                            >
                                <ICONS.LucideZap size={14} className="mr-2" />
                                성향 랜덤 설정
                            </button>
                        </div>
                        <EditableField isTextarea rows={4} label="성적 기벽 (Kinks)" value={localCharacter.libido?.kinks || ''} onChange={e => handleLocalChange('libido.kinks', e.target.value)} placeholder="페르소나를 성적으로 흥분시키는 특정 행위, 상황, 대상 등을 구체적으로 서술합니다." />
                    </div>
                </Card>
                <Card>
                    <CardHeader icon={ICONS.LucideHeart} title="취향 (Preferences)" />
                    <div className="space-y-4">
                        <EditableField isTextarea rows={4} label="좋아하는 것 (Likes)" value={localCharacter.preferences?.likes || ''} onChange={e => handleLocalChange('preferences.likes', e.target.value)} placeholder="음식, 색상, 음악, 활동 등 페르소나가 긍정적으로 반응하는 것들을 서술합니다." />
                        <EditableField isTextarea rows={4} label="싫어하는 것 (Dislikes)" value={localCharacter.preferences?.dislikes || ''} onChange={e => handleLocalChange('preferences.dislikes', e.target.value)} placeholder="페르소나가 기피하거나 부정적으로 반응하는 것들을 서술합니다." />
                    </div>
                </Card>
            </div>
        </div>
    );
};

export const NpcSheet = ({ localCharacter, allCharacters, handleLocalChange, handleImageUpload, handleGenerateSchedule, handleGenerateEmotionProfile, latestEmotionAnalysis }) => {
    const { storyProps } = useStoryContext();
    const { isProcessing } = storyProps;
    const [activeTab, setActiveTab] = useState('profile');

    const tabs = [
        { id: 'profile', label: '프로필', icon: ICONS.LucideFileText },
        { id: 'psyche', label: '내면', icon: ICONS.LucideBrainCircuit },
        { id: 'lifestyle', label: '생활', icon: ICONS.LucideCoffee },
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'profile':
                return <ProfileTabContent
                            localCharacter={localCharacter}
                            handleLocalChange={handleLocalChange}
                            handleImageUpload={handleImageUpload}
                            latestEmotionAnalysis={latestEmotionAnalysis}
                        />;
            case 'psyche':
                return <PsycheTabContent
                            localCharacter={localCharacter}
                            handleLocalChange={handleLocalChange}
                            handleGenerateEmotionProfile={handleGenerateEmotionProfile}
                            isProcessing={isProcessing}
                        />;
            case 'lifestyle':
                return <LifestyleTabContent
                            localCharacter={localCharacter}
                            allCharacters={allCharacters}
                            handleLocalChange={handleLocalChange}
                            handleGenerateSchedule={handleGenerateSchedule}
                            isProcessing={isProcessing}
                        />;
            default:
                return null;
        }
    };

    return (
        <>
            <div className="px-4 md:px-6 border-b border-[var(--border-primary)]">
                <div className="flex items-center space-x-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-3 text-sm font-semibold border-b-2 transition-colors duration-200 ${
                                activeTab === tab.id
                                    ? 'border-[var(--accent-primary)] text-[var(--accent-primary)]'
                                    : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            <tab.icon size={16} className="mr-2" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="p-4 md:p-6">
                {renderTabContent()}
            </div>
        </>
    );
};