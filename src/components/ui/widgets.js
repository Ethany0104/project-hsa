// --- Start of file: components/ui/widgets.js ---

import { useEffect, useState, useMemo } from 'react';
import { ICONS } from '../../constants';
import { Accordion } from './layouts';

// [FEATURE] API 작업 로그에 표시될 이름, 아이콘, 프로그레스 바 색상을 매핑하는 객체
const API_LOG_DISPLAY_MAP = {
    // Profile Generation
    generateNarrativeProfile: { label: "서사 프로필", icon: ICONS.LucideDrama, color: 'bg-pink-500' },
    generateRoleplayGuide: { label: "연기 가이드", icon: ICONS.LucideTheater, color: 'bg-pink-400' },
    generateBig5Profile: { label: "BIG5 성격", icon: ICONS.LucideBrainCircuit, color: 'bg-purple-500' },
    generateLifestyle: { label: "생활/취향", icon: ICONS.LucideCoffee, color: 'bg-indigo-400' },
    generatePsyche: { label: "방어기제", icon: ICONS.LucideShield, color: 'bg-purple-400' },
    generateLibido: { label: "리비도 프로필", icon: ICONS.LucideHeartPulse, color: 'bg-rose-500' },
    generateSpace: { label: "공간/사물", icon: ICONS.LucideHome, color: 'bg-indigo-500' },
    generateDailySchedule: { label: "하루 일과", icon: ICONS.LucideCalendarDays, color: 'bg-teal-500' },
    generateEmotionProfile: { label: "감정 프로필", icon: ICONS.LucideSmilePlus, color: 'bg-yellow-500' },
    // Utility Generation
    getPdResponse: { label: "PD와 대화", icon: ICONS.LucideBot, color: 'bg-sky-500' },
    deduceTime: { label: "시간 흐름", icon: ICONS.LucideClock, color: 'bg-green-500' },
    updatePersonalGoals: { label: "목표 설정", icon: ICONS.LucideZap, color: 'bg-orange-500' },
    analyzeEmotion: { label: "감정 분석", icon: ICONS.LucideBrainCog, color: 'bg-red-500' },
    reEvaluateCoreBeliefs: { label: "심리 재평가", icon: ICONS.LucideBrainCircuit, color: 'bg-fuchsia-500' },
    summarizeEvents: { label: "기억 압축", icon: ICONS.LucideMemoryStick, color: 'bg-blue-500' },
    // Default
    default: { label: "알 수 없는 작업", icon: ICONS.LucideSettings, color: 'bg-gray-500' },
};


// ... (getWeatherIcon, FLAVOR_TEXTS, Spinner, WorldClock are unchanged)
export const getWeatherIcon = (weather) => {
    if (!weather) return ICONS.LucideSun;
    const lowerCaseWeather = weather.toLowerCase();
    if (lowerCaseWeather.includes('비')) return ICONS.LucideCloudRain;
    if (lowerCaseWeather.includes('맑음')) return ICONS.LucideSun;
    if (lowerCaseWeather.includes('눈')) return ICONS.LucideCloudSnow;
    if (lowerCaseWeather.includes('안개')) return ICONS.LucideCloudFog;
    if (lowerCaseWeather.includes('구름') || lowerCaseWeather.includes('흐림')) return ICONS.LucideCloud;
    return ICONS.LucideSun;
};

const FLAVOR_TEXTS = [ "페르소나의 감정을 조율하는 중...", "장면의 조명을 맞추는 중...", "기억의 파편을 재구성하는 중...", "다음 대사를 고르는 중...", "가능성을 저울질하는 중...", "기억을 재정리하는 중..."];

export const Spinner = ({ className = ""}) => <div className={`w-6 h-6 border-2 border-[var(--text-secondary)] border-t-[var(--accent-primary)] border-solid rounded-full animate-spin ${className}`}></div>;

export const WorldClock = ({ worldState }) => {
    const { day, hour, minute, weather } = worldState;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const WeatherIcon = getWeatherIcon(weather);
    const TimeIcon = (hour >= 6 && hour < 18) ? ICONS.LucideSun : ICONS.LucideMoon;
    return (
        <div className="flex items-center justify-center gap-x-3 text-xs text-[var(--text-secondary)] font-sans mt-1.5">
            <div className="flex items-center gap-x-1.5"><ICONS.LucideCalendarDays size={14} /><span>Day {day}</span></div>
            <div className="flex items-center gap-x-1.5"><TimeIcon size={14} /><span>{timeString}</span></div>
            <div className="flex items-center gap-x-1.5"><WeatherIcon size={14} /><span>{weather}</span></div>
        </div>
    );
};


export const ContextMeter = ({ contextInfo, maxTokens }) => {
    const { system, world, memory, lore, chat, total } = contextInfo;
    const percentage = maxTokens > 0 ? (total / maxTokens) * 100 : 0;
    const segments = [
        { key: 'system', value: system, color: 'bg-red-500', textColor: 'text-red-400', label: 'System', icon: ICONS.LucideFileText },
        { key: 'world', value: world, color: 'bg-green-500', textColor: 'text-green-400', label: 'Situation', icon: ICONS.LucideClipboardList },
        { key: 'lore', value: lore, color: 'bg-blue-500', textColor: 'text-blue-400', label: 'Persona', icon: ICONS.LucideBookUser },
        { key: 'memory', value: memory, color: 'bg-yellow-500', textColor: 'text-yellow-400', label: 'Memory', icon: ICONS.LucideMemoryStick },
        { key: 'chat', value: chat, color: 'bg-purple-500', textColor: 'text-purple-400', label: 'Chat', icon: ICONS.LucideMessageSquare },
    ];

    return (
        <div className="space-y-3 font-sans">
            <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-[var(--text-secondary)]">컨텍스트 사용량 (메인 엔진)</span>
                    <span className="font-mono">{total.toLocaleString()} / {maxTokens.toLocaleString()} ({percentage.toFixed(1)}%)</span>
                </div>
                <div className="w-full bg-[var(--input-bg)] rounded-full h-2.5 flex overflow-hidden border border-[var(--border-primary)]">
                    {segments.map(seg => (
                        total > 0 && seg.value > 0 && <div key={seg.key} className={`${seg.color} transition-all duration-300`} style={{ width: `${(seg.value / total) * 100}%` }}></div>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                {segments.map(seg => (
                    <div key={seg.key} className="flex items-center justify-between">
                        <div className="flex items-center">
                            <seg.icon className={`w-3.5 h-3.5 mr-2 ${seg.textColor}`} />
                            <span className={`font-medium text-[var(--text-secondary)]`}>{seg.label}</span>
                        </div>
                        <span className="font-mono text-[var(--text-primary)]">{seg.value.toLocaleString()}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const RetrievedMemoryViewer = ({ memories }) => {
    const getMemoryIcon = (id) => {
        if (id.includes('_lore_')) return { Icon: ICONS.LucideBookOpen, color: 'text-blue-400', label: '세부설정' };
        if (id.includes('_char_')) return { Icon: ICONS.LucideBookUser, color: 'text-purple-400', label: '페르소나' };
        return { Icon: ICONS.LucideFileText, color: 'text-yellow-400', label: '장면' };
    };

    return (
        <Accordion title={`참조된 기억 (${memories.length})`} icon={ICONS.LucideHistory} defaultOpen={false}>
            <div className="space-y-2 max-h-60 overflow-y-auto p-1 pr-2 font-sans">
                {memories.length === 0 ? (
                    <p className="text-xs text-center text-[var(--text-secondary)] py-4">AI 응답 생성 시 참조된 기억이 여기에 표시됩니다.</p>
                ) : (
                    memories.map((mem, index) => {
                        const { Icon, color, label } = getMemoryIcon(mem.id);
                        return (
                            <div key={index} className="bg-[var(--panel-bg-alt)] p-2.5 rounded-lg text-sm border border-[var(--border-primary)]">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center text-xs font-semibold">
                                        <Icon className={`w-4 h-4 mr-2 ${color}`} />
                                        <span className={color}>{label}</span>
                                    </div>
                                    <span className="text-xs font-mono text-[var(--accent-primary)]">유사도: {(mem.score * 100).toFixed(1)}%</span>
                                </div>
                                <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-all">{mem.text}</p>
                            </div>
                        );
                    })
                )}
            </div>
        </Accordion>
    );
};

export const EmotionAnalysisViewer = ({ analysis, characterId }) => {
    const emotionData = analysis ? analysis[characterId] : null;

    const emotionColors = {
        anger: 'bg-red-500',
        sadness: 'bg-blue-500',
        joy: 'bg-yellow-500',
        fear: 'bg-purple-500',
    };

    const emotionLabels = {
        anger: '분노',
        sadness: '슬픔',
        joy: '기쁨',
        fear: '두려움',
    };

    const sortedEmotions = emotionData ? Object.entries(emotionData.emotionRatios).sort(([, a], [, b]) => b - a) : [];

    return (
        <Accordion title="AI 감정 분석 결과 (최신)" icon={ICONS.LucideBrainCircuit} defaultOpen={true}>
            <div className="p-2 space-y-3 font-sans">
                {!emotionData ? (
                    <p className="text-xs text-center text-[var(--text-secondary)] py-4">AI의 감정 분석 결과가 여기에 표시됩니다.</p>
                ) : (
                    <>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)]">분석 요약</label>
                            <p className="text-sm text-[var(--text-primary)] mt-1 p-2 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)]">{emotionData.reason}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-[var(--text-secondary)] mb-1.5 block">감정 분포</label>
                            <div className="w-full bg-[var(--input-bg)] rounded-full h-4 flex overflow-hidden border border-[var(--border-primary)]">
                                {sortedEmotions.map(([key, value]) => (
                                    value > 0 && <div key={key} className={`${emotionColors[key]} transition-all duration-300`} style={{ width: `${value * 100}%` }} title={`${emotionLabels[key]}: ${(value * 100).toFixed(1)}%`}></div>
                                ))}
                            </div>
                            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                                {sortedEmotions.map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-2 h-2 rounded-full ${emotionColors[key]} mr-2`}></div>
                                            <span className="text-[var(--text-secondary)]">{emotionLabels[key]}</span>
                                        </div>
                                        <span className="font-mono text-[var(--text-primary)]">{(value * 100).toFixed(1)}%</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Accordion>
    );
};

export const ApiLogViewer = ({ apiLog }) => {
    const { log } = apiLog;

    const auxLog = useMemo(() => {
        return log.filter(entry => !entry.functionName.toLowerCase().includes('response'));
    }, [log]);

    const totalAuxTokens = useMemo(() => {
        return auxLog.reduce((total, entry) => total + (entry.totalTokens || 0), 0);
    }, [auxLog]);

    const lastTurnInfo = useMemo(() => {
        if (auxLog.length === 0) {
            return { logs: [], total: 0 };
        }
        const latestTimestamp = auxLog[0].id;
        const lastTurnLogs = auxLog.filter(entry => latestTimestamp - entry.id < 2000);
        const lastTurnTotal = lastTurnLogs.reduce((sum, entry) => sum + entry.totalTokens, 0);
        return { logs: lastTurnLogs, total: lastTurnTotal };
    }, [auxLog]);

    return (
        <Accordion title="API 작업 로그 (보조 엔진)" icon={ICONS.LucideHistory} defaultOpen={true}>
            <div className="p-2 space-y-4 font-sans">
                {/* 총 누적 사용량 표시 */}
                <div className="p-2 bg-[var(--input-bg)] rounded-md border border-[var(--border-primary)] text-center">
                    <p className="text-xs text-[var(--text-secondary)]">이번 세션 총 사용량</p>
                    <p className="text-lg font-bold font-mono text-[var(--accent-primary)]">{totalAuxTokens.toLocaleString()} 토큰</p>
                </div>

                {/* 마지막 작업 사용량 */}
                {lastTurnInfo.logs.length > 0 && (
                    <div>
                        <div className="flex justify-between items-center text-xs px-1">
                            <span className="font-bold text-[var(--text-secondary)]">방금 작업 사용량</span>
                            <span className="font-mono text-[var(--text-primary)]">{lastTurnInfo.total.toLocaleString()} 토큰</span>
                        </div>
                    </div>
                )}
                
                {/* 전체 작업 로그 목록 */}
                <div className="space-y-2 max-h-60 overflow-y-auto p-1 pr-2 border-t border-[var(--border-primary)] pt-3">
                    <h4 className="text-xs font-bold text-[var(--text-secondary)] px-1 pb-1">전체 작업 기록</h4>
                    {auxLog.length === 0 ? (
                        <p className="text-xs text-center text-[var(--text-secondary)] py-4">보조 AI 작업 기록이 없습니다.</p>
                    ) : (
                        auxLog.map(entry => {
                            const displayInfo = API_LOG_DISPLAY_MAP[entry.functionName] || API_LOG_DISPLAY_MAP.default;
                            const Icon = displayInfo.icon;
                            return (
                                <div key={entry.id} className="flex items-center justify-between text-xs p-2 bg-[var(--panel-bg-alt)] rounded-md">
                                    <div className="flex items-center min-w-0">
                                        <Icon className="w-4 h-4 mr-2 text-[var(--text-secondary)] flex-shrink-0" />
                                        <div className="flex-grow min-w-0">
                                            <p className="text-[var(--text-primary)] truncate">{displayInfo.label}</p>
                                            <p className="text-[var(--text-secondary)] text-[10px] truncate">{entry.model}</p>
                                        </div>
                                    </div>
                                    <span className="font-mono text-[var(--accent-primary)] flex-shrink-0 ml-2">{entry.totalTokens.toLocaleString()} 토큰</span>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </Accordion>
    );
};


export const SettingsButtons = ({ onSave, onNewStory, onListOpen, isLoading, isNewStoryDisabled, storyId, newStoryButtonText = "새 이야기 시작", newStoryButtonTooltip = "새로운 이야기를 시작합니다." }) => ( 
    <div className="space-y-2.5 font-sans"> 
        <button 
            onClick={onNewStory} 
            disabled={isLoading || isNewStoryDisabled} 
            className="w-full flex items-center justify-center px-4 py-3 bg-[var(--accent-primary)] text-white font-bold hover:bg-[var(--accent-secondary)] rounded-lg text-base disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[var(--accent-shadow)]" 
            title={newStoryButtonTooltip}
        >
            <ICONS.LucidePlayCircle className="w-5 h-5 mr-2"/> {newStoryButtonText}
        </button> 
        <div className="flex space-x-2.5"> 
            <button onClick={onSave} disabled={isLoading || !storyId} className="flex-1 flex items-center justify-center px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" title={!storyId ? "저장할 장면이 없습니다." : "현재 장면 저장"}>
                <ICONS.LucideSave className="w-4 h-4 mr-2"/> 저장
            </button> 
            <button onClick={onListOpen} disabled={isLoading} className="flex items-center justify-center p-2.5 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-[var(--text-primary)] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" title="장면 목록 보기">
                <ICONS.LucideLibrary className="w-4 h-4"/>
            </button> 
        </div> 
    </div> 
);

export const Big5Slider = ({ label, value, onChange }) => (
    <div className="font-sans">
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
            <span className="text-sm font-mono text-[var(--accent-primary)] w-12 text-right">{value}</span>
        </div>
        <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onInput={e => onChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[var(--border-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]"
        />
    </div>
);

export const SettingSlider = ({ label, description, value, min, max, step, onChange }) => (
    <div className="font-sans">
      <div className="flex justify-between items-baseline">
        <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <span className="text-sm font-mono text-[var(--accent-primary)] w-16 text-right">{Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
      <div className="flex items-center space-x-3">
        <input type="range" min={min} max={max} step={step} value={value} onInput={e => onChange(parseFloat(e.target.value))} 
               className="w-full h-2 bg-[var(--border-primary)] rounded-lg appearance-none cursor-pointer accent-[var(--accent-primary)]" />
      </div>
    </div>
);

export const ControlButton = ({ icon: Icon, label, onClick }) => ( 
    <button onClick={onClick} className="flex items-center px-3 py-1.5 bg-[var(--bg-secondary)] rounded-full text-xs text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] shadow-sm">
        <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
    </button> 
);

export const LoadingBlock = () => {
    const [flavorText, setFlavorText] = useState(FLAVOR_TEXTS[0]);
    useEffect(() => {
        const interval = setInterval(() => {
            setFlavorText(FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="my-6 flex items-center justify-center space-x-4 text-[var(--text-secondary)] animate-fadeIn">
          <Spinner />
          <p className="text-sm font-serif italic">{flavorText}</p>
        </div>
    );
};
