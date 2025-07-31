/**
 * @file defaults.js
 * @description 애플리케이션의 모든 기본 설정값과 데이터 구조를 정의합니다.
 * AI 모델 설정, 기본 페르소나 템플릿, 세계관 초기 상태 등을 포함합니다.
 */

import { getSystemInstruction } from './instructions.js';

// =================================================================
// [1] UI 및 설정 관련 상수
// =================================================================

export const NARRATIVE_STYLES = [
    { name: '소설 모드', id: 'Novel', icon: 'LucideFeather', description: '3인칭 관찰자 시점으로 서사를 진행합니다.' },
    { name: '채팅 모드', id: 'Chat', icon: 'LucideMessageSquare', description: '페르소나와 1인칭으로 직접 대화합니다.' },
];

export const GEMINI_MODELS = [
    { name: 'Gemini 2.5 Pro (최신)', id: 'gemini-2.5-pro' },
    { name: 'Gemini 2.5 Flash (최신)', id: 'gemini-2.5-flash' },
    { name: 'Gemini 1.5 Pro', id: 'gemini-1.5-pro-latest' },
    { name: 'Gemini 1.5 Flash', id: 'gemini-1.5-flash-latest' },
];

// =================================================================
// [2] 기본 데이터 구조 (Default Data Structures)
// =================================================================

export const DEFAULT_AI_SETTINGS = {
  mainModel: 'gemini-2.5-pro',
  auxModel: 'gemini-2.5-flash',
  narrativeStyle: 'Novel',
  systemInstruction: getSystemInstruction({ style: 'Novel', enableNsfw: true }),
  temperature: 1.2,
  topK: 40,
  topP: 1.0,
  maxOutputTokens: 5120,
  maxContextTokens: 48368,
  shortTermMemoryTurns: 35,
  retrievalTopK: 8,
  enableDynamicEvaluation: true,
  enableNsfw: true,
  // [추가] API의 안전 필터를 비활성화하여 창작의 자유도를 높입니다.
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_NONE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_NONE",
    },
  ],
};

export const DEFAULT_WORLD_STATE = {
    day: 1,
    hour: 9,
    minute: 0,
    weather: '실내'
};

export const DEFAULT_CONTEXT_SETTINGS = {
    situation: '장면의 현재 상황이나 분위기를 여기에 요약합니다.',
    worldview: {
        genre: '현대',
        generationConcept: '세계관의 핵심 컨셉이나 특징을 입력하여 AI가 상세 설정을 생성하게 할 수 있습니다.',
        details: 'AI가 연기할 때 직접 참조할 세계관의 상세 설명입니다.',
        rules: [],
    },
    startTime: '09:00',
    startWeather: '실내',
    details: [],
};

export const DEFAULT_USER = {
    id: 1,
    name: '유저',
    isUser: true,
    appearance: '유저 캐릭터의 외모나 특징을 서술합니다.',
    Concept: 'AI가 참고할 유저의 핵심 컨셉이나 키워드를 서술합니다.',
    profileImageUrl: '',
};

export const DEFAULT_PERSONA = {
    id: Date.now(),
    name: '새 페르소나',
    age: 25,
    job: '무직',
    isUser: false,
    appearance: '매력적인 외모. 뚜렷한 이목구비와 깊은 눈매.',
    generationConcept: 'AI가 페르소나의 상세 설정을 만들 때 사용할 핵심 컨셉입니다. (예: "전쟁으로 모든 것을 잃고 복수귀가 된 전직 성기사")',
    profileImageUrl: '',

    // --- 상세 프로필 (AI가 생성하거나 유저가 직접 작성) ---
    formativeEvent: '페르소나의 삶을 바꾼 결정적 사건.',
    corePrinciple: '페르소나가 목숨을 걸고 지키는 신념이나 원칙.',
    coreDesire: '페르소나의 모든 행동의 근원이 되는 궁극적 욕망.',

    roleplayGuide: {
        summary: '페르소나의 성격과 특징에 대한 한 줄 요약.',
        speechStyle: '특유의 말투, 자주 쓰는 어휘, 목소리 톤 등.',
        mannerisms: '무의식적인 손동작, 시선 처리, 버릇 등.',
        coreKnowledge: '페르소나가 전문가 수준으로 알고 있는 지식.',
    },

    big5: {
        openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50
    },

    emotionProfile: {
        anger: {
            introverted: "분노를 안으로 삭일 때: 입술을 깨물거나, 주먹을 꽉 쥐는 등 억누르는 행동.",
            extroverted: "분노를 밖으로 표출할 때: 소리를 지르거나, 물건을 부수는 등 격렬한 행동.",
            passiveAggressive: "수동-공격적 분노: 비꼬는 말투, 의도적인 무시 등."
        },
        sadness: {
            introverted: "혼자 있을 때: 소리 없이 눈물을 흘리거나, 과거를 회상하며 무기력에 빠짐.",
            extroverted: "타인 앞에서: 위로를 구하며 오열하거나, 억지로 괜찮은 척하며 떨리는 목소리."
        },
        joy: {
            introverted: "조용한 기쁨: 만족스러운 미소를 짓거나, 좋아하는 것을 가만히 바라봄.",
            extroverted: "드러내는 기쁨: 아이처럼 웃거나, 주변 사람들과 기쁨을 나누려 함."
        },
        fear: {
            introverted: "내면의 두려움: 몸이 굳고, 호흡이 가빠지며, 최악의 상황을 상상함.",
            extroverted: "외면의 두려움: 비명을 지르거나, 필사적으로 도망치려 함."
        }
    },
    
    preferences: {
        likes: "긍정적으로 반응하는 것들.",
        dislikes: "부정적으로 반응하는 것들."
    },

    lifestyle: {
        attitude: "현실주의적",
        routines: "매일 반복하는 습관이나 활동.",
        pleasures: "소소한 행복이나 만족감을 주는 것들."
    },

    psyche: {
        defenseMechanism: "선택 안 함"
    },

    libido: {
        attitude: "관계중심적",
        intimacyStyle: "안정형",
        bdsmProfile: {
            dominance: 0,
            sadism: 0,
            psychological: 0
        },
        kinks: "성적으로 흥분시키는 특정 행위, 상황, 대상."
    },

    space: {
        livingSpace: "주로 생활하는 공간의 묘사.",
        cherishedPossessions: []
    },

    goals: {
        primaryGoal: '현재 장면에서의 주된 목표',
        alternativeGoal: '주요 목표가 막혔을 때의 차선책'
    },
    relationships: [],
    dailySchedule: [],
};
