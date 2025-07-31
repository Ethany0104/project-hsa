/**
 * @file index.js
 * @description constants 디렉토리의 모든 모듈을 통합하고 외부에 제공하는 진입점(Entry Point)입니다.
 * 모듈 간의 의존성 충돌을 방지하고, 일관된 방식으로 상수를 관리합니다.
 */

// [1] 기본 데이터 및 설정 (초기값)
import {
    NARRATIVE_STYLES,
    GEMINI_MODELS,
    DEFAULT_AI_SETTINGS,
    DEFAULT_WORLD_STATE,
    DEFAULT_CONTEXT_SETTINGS,
    DEFAULT_USER,
    DEFAULT_PERSONA,
} from './defaults.js';

// [2] AI 핵심 지침 (페르소나 정체성)
import {
    getSystemInstruction,
    PD_INSTRUCTION
} from './instructions.js';

// [3] 작업별 프롬프트 템플릿
import {
    PROMPT_TEMPLATES,
    USER_ACTION_PROMPTS
} from './prompts.js';

// [4] 기타 UI 관련 상수
import { ICONS } from './icons.js';


// [5] 모든 모듈을 명시적으로 통합하여 export
export {
    // from defaults.js
    NARRATIVE_STYLES,
    GEMINI_MODELS,
    DEFAULT_AI_SETTINGS,
    DEFAULT_WORLD_STATE,
    DEFAULT_CONTEXT_SETTINGS,
    DEFAULT_USER,
    DEFAULT_PERSONA,

    // from instructions.js
    getSystemInstruction,
    PD_INSTRUCTION,

    // from prompts.js
    PROMPT_TEMPLATES,
    USER_ACTION_PROMPTS,

    // from icons.js
    ICONS,
};
