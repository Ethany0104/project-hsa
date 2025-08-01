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
    situation: '',
    worldview: {
        genre: '',
        generationConcept: '',
        details: '',
        rules: [],
    },
    startTime: '09:00',
    startWeather: '실내',
    details: [],
};

export const DEFAULT_USER = {
    id: 1,
    name: '',
    isUser: true,
    appearance: '',
    Concept: '',
    profileImageUrl: '',
};

export const DEFAULT_PERSONA = {
    id: Date.now(),
    name: '',
    age: 25,
    job: '',
    isUser: false,
    appearance: '',
    generationConcept: '',
    profileImageUrl: '',

    // --- 상세 프로필 (AI가 생성하거나 유저가 직접 작성) ---
    formativeEvent: '',
    corePrinciple: '',
    coreDesire: '',

    roleplayGuide: {
        summary: '',
        speechStyle: '',
        mannerisms: '',
        coreKnowledge: '',
    },

    big5: {
        openness: 50, conscientiousness: 50, extraversion: 50, agreeableness: 50, neuroticism: 50
    },

    emotionProfile: {
        anger: {
            introverted: "",
            extroverted: "",
            passiveAggressive: ""
        },
        sadness: {
            introverted: "",
            extroverted: ""
        },
        joy: {
            introverted: "",
            extroverted: ""
        },
        fear: {
            introverted: "",
            extroverted: ""
        }
    },
    
    preferences: {
        likes: "",
        dislikes: ""
    },

    lifestyle: {
        attitude: "현실주의적",
        routines: "",
        pleasures: ""
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
        kinks: ""
    },

    space: {
        livingSpace: "",
        cherishedPossessions: []
    },

    goals: {
        primaryGoal: 'AI가 설정한 목표가 여기에 표시됩니다.',
        alternativeGoal: 'AI가 설정한 대안 목표가 여기에 표시됩니다.'
    },
    relationships: [],
    dailySchedule: [],
};
