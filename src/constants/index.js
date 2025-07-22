// src/constants/index.js

// ==================================================================
// [PD NOTE] 순환 참조 및 export 충돌 에러 해결
// ==================================================================
// 기존의 export * from ... 방식은 여러 파일에서 동일한 이름의 변수/함수를
// export 할 때 충돌을 일으킬 수 있습니다.
// 각 파일에서 필요한 상수와 함수를 명시적으로 import하고,
// 다시 명시적으로 export하여 충돌을 원천적으로 방지합니다.

import { 
    NARRATIVE_STYLES, 
    GEMINI_MODELS, 
    DEFAULT_AI_SETTINGS, 
    DEFAULT_WORLD_STATE, 
    DEFAULT_CONTEXT_SETTINGS, 
    DEFAULT_USER, 
    DEFAULT_PERSONA,
    getSystemInstruction
} from './defaults';

import { ICONS } from './icons';

import { 
    PROMPT_TEMPLATES, 
    USER_ACTION_PROMPTS, 
    PD_INSTRUCTION 
} from './prompts';

export {
    NARRATIVE_STYLES,
    GEMINI_MODELS,
    DEFAULT_AI_SETTINGS,
    DEFAULT_WORLD_STATE,
    DEFAULT_CONTEXT_SETTINGS,
    DEFAULT_USER,
    DEFAULT_PERSONA,
    getSystemInstruction,
    ICONS,
    PROMPT_TEMPLATES,
    USER_ACTION_PROMPTS,
    PD_INSTRUCTION
};
