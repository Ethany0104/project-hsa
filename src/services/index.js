// src/services/index.js

// 기존 firebaseService는 그대로 export
export * from './firebaseService';

// 새로 분리된 gemini 관련 서비스들을 export
export * as geminiApi from './gemini/geminiApi';
export * as profileGenerator from './gemini/profileGenerator';
export * as utilityGenerator from './gemini/utilityGenerator';
export * as storyOrchestrator from './gemini/storyOrchestrator';
