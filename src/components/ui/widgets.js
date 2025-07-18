import { useEffect, useState } from 'react';
import { ICONS } from '../../constants';
// Accordion 컴포넌트는 layouts.js에서 직접 가져오도록 수정했습니다.
import { Accordion } from './layouts';

/**
 * 날씨 문자열에 따라 적절한 아이콘을 반환하는 헬퍼 함수.
 * 순환 참조 문제를 해결하기 위해 forms.js에서 이곳으로 이동했습니다.
 * @param {string} weather - 날씨 상태 문자열 (예: "맑음", "비")
 * @returns {React.ElementType} Lucide 아이콘 컴포넌트
 */
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

const FLAVOR_TEXTS = [ "이야기의 실타래를 푸는 중...", "존재하지 않던 세계를 조각하는 중...", "기억의 파편을 재구성하는 중...", "다음 문장을 고르는 중...", "가능성을 저울질하는 중...", "기억을 재정리하는 중..."];

/**
 * 로딩 상태를 나타내는 스피너(Spinner) 컴포넌트
 */
export const Spinner = ({ className = ""}) => <div className={`w-5 h-5 border-2 border-[var(--text-secondary)] border-t-[var(--accent)] border-solid rounded-full animate-spin ${className}`}></div>;

/**
 * 세계의 시간과 날씨를 표시하는 위젯
 */
export const WorldClock = ({ worldState }) => {
    const { day, hour, minute, weather } = worldState;
    const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    const WeatherIcon = getWeatherIcon(weather);
    const TimeIcon = (hour >= 6 && hour < 18) ? ICONS.LucideSun : ICONS.LucideMoon;
    return (
        <div className="flex items-center justify-center gap-x-3 text-xs text-[var(--text-secondary)] font-sans mt-1">
            <div className="flex items-center gap-x-1"><span>Day {day}</span></div>
            <div className="flex items-center gap-x-1.5"><TimeIcon size={14} /><span>{timeString}</span></div>
            <div className="flex items-center gap-x-1.5"><WeatherIcon size={14} /><span>{weather}</span></div>
        </div>
    );
};

/**
 * AI 컨텍스트 사용량을 시각적으로 보여주는 위젯
 */
export const ContextMeter = ({ contextInfo, maxTokens }) => {
    const { system, world, memory, lore, chat, total } = contextInfo;
    const segments = [
        { key: 'system', value: system, color: 'bg-red-500', textColor: 'text-red-400', label: 'System', icon: ICONS.LucideFileText },
        { key: 'world', value: world, color: 'bg-green-500', textColor: 'text-green-400', label: 'World', icon: ICONS.LucideGlobe },
        { key: 'lore', value: lore, color: 'bg-blue-500', textColor: 'text-blue-400', label: 'Lore/Chars', icon: ICONS.LucideBookUser },
        { key: 'memory', value: memory, color: 'bg-yellow-500', textColor: 'text-yellow-400', label: 'Memory', icon: ICONS.LucideMemoryStick },
        { key: 'chat', value: chat, color: 'bg-purple-500', textColor: 'text-purple-400', label: 'Chat', icon: ICONS.LucideMessageSquare },
    ];

    return (
        <div className="space-y-3 font-sans">
            <div>
                <div className="flex justify-between items-center mb-1 text-xs">
                    <span className="font-bold text-[var(--text-secondary)]">컨텍스트 사용량</span>
                    <span className="font-mono">{total.toLocaleString()} / {maxTokens.toLocaleString()}</span>
                </div>
                <div className="w-full bg-white/5 rounded-full h-2.5 flex overflow-hidden">
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

/**
 * AI가 응답 생성 시 참조한 기억(메모리) 목록을 보여주는 뷰어
 */
export const RetrievedMemoryViewer = ({ memories }) => {
    const getMemoryIcon = (id) => {
        if (id.includes('_lore_')) return { Icon: ICONS.LucideBookOpen, color: 'text-blue-400', label: '로어북' };
        if (id.includes('_char_')) return { Icon: ICONS.LucideBookUser, color: 'text-purple-400', label: '캐릭터' };
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
                            <div key={index} className="bg-[var(--panel-bg-alt)] p-2.5 rounded-lg text-sm border border-[var(--border)]">
                                <div className="flex justify-between items-center mb-1.5">
                                    <div className="flex items-center text-xs font-semibold">
                                        <Icon className={`w-4 h-4 mr-2 ${color}`} />
                                        <span className={color}>{label}</span>
                                    </div>
                                    <span className="text-xs font-mono text-[var(--accent)]">유사도: {(mem.score * 100).toFixed(1)}%</span>
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

/**
 * 이야기 저장, 새로 시작, 목록 보기 버튼 그룹
 */
export const SettingsButtons = ({ onSave, onNewStory, onListOpen, isLoading, isNewStoryDisabled, storyId }) => ( 
    <div className="space-y-2.5 font-sans"> 
        <button onClick={onNewStory} disabled={isLoading || isNewStoryDisabled} className="w-full flex items-center justify-center px-4 py-3 bg-[var(--accent)] text-white font-bold hover:opacity-90 rounded-lg text-sm disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 dark:disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-[var(--accent-shadow)]" title={isNewStoryDisabled ? "새 이야기를 시작하려면 [로어북]에서 장르와 세계관을, [캐릭터]에서 인물을 설정해야 합니다." : "새로운 이야기를 시작합니다."}>
            <ICONS.LucidePlayCircle className="w-5 h-5 mr-2"/> 새 이야기 시작
        </button> 
        <div className="flex space-x-2.5"> 
            <button onClick={onSave} disabled={isLoading || !storyId} className="flex-1 flex items-center justify-center px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200" title={!storyId ? "저장할 이야기가 없습니다." : "현재 이야기 저장"}>
                <ICONS.LucideSave className="w-4 h-4 mr-2"/> 저장
            </button> 
            <button onClick={onListOpen} disabled={isLoading} className="flex items-center justify-center p-2.5 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                <ICONS.LucideLibrary className="w-4 h-4"/>
            </button> 
        </div> 
    </div> 
);

/**
 * Big5 성격 요인 값을 조절하는 슬라이더
 */
export const Big5Slider = ({ label, value, onChange }) => (
    <div className="font-sans">
        <div className="flex justify-between items-center mb-1">
            <label className="text-sm font-medium text-[var(--text-primary)]">{label}</label>
            <span className="text-sm font-mono text-[var(--accent)] w-12 text-right">{value}</span>
        </div>
        <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={value}
            onInput={e => onChange(parseInt(e.target.value, 10))}
            className="w-full h-1.5 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
        />
    </div>
);

/**
 * 일반적인 설정 값을 조절하는 슬라이더
 */
export const SettingSlider = ({ label, description, value, min, max, step, onChange }) => (
    <div className="font-sans">
      <div className="flex justify-between items-baseline">
        <label className="block text-sm font-medium text-[var(--text-primary)]">{label}</label>
        <span className="text-sm font-mono text-[var(--accent)] w-16 text-right">{Number.isInteger(step) ? value : value.toFixed(2)}</span>
      </div>
      <p className="text-xs text-[var(--text-secondary)] mb-2">{description}</p>
      <div className="flex items-center space-x-3">
        <input type="range" min={min} max={max} step={step} value={value} onInput={e => onChange(parseFloat(e.target.value))} 
               className="w-full h-2 bg-[var(--border)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
      </div>
    </div>
);

/**
 * 아이콘과 라벨이 있는 작은 컨트롤 버튼
 */
export const ControlButton = ({ icon: Icon, label, onClick }) => ( 
    <button onClick={onClick} className="flex items-center px-3 py-1.5 bg-[var(--panel-bg)] rounded-full text-xs text-[var(--text-secondary)] transition-all duration-200 hover:bg-[var(--border)] hover:text-[var(--text-primary)] border border-[var(--border)] shadow-sm">
        <Icon className="w-3.5 h-3.5 mr-1.5" />{label}
    </button> 
);

/**
 * AI 응답 대기 중 표시되는 로딩 블록
 */
export const LoadingBlock = () => {
    const [flavorText, setFlavorText] = useState(FLAVOR_TEXTS[0]);
    useEffect(() => {
        const interval = setInterval(() => {
            setFlavorText(FLAVOR_TEXTS[Math.floor(Math.random() * FLAVOR_TEXTS.length)]);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="my-6 flex items-center justify-center space-x-3 text-[var(--text-secondary)] animate-fadeIn">
          <Spinner />
          <p className="text-sm font-serif italic">{flavorText}</p>
        </div>
    );
};
