import { useState } from 'react';
import { 
    DEFAULT_USER, 
    DEFAULT_CONTEXT_SETTINGS, 
    DEFAULT_AI_SETTINGS, 
    DEFAULT_WORLD_STATE 
} from '../constants/defaults';

export const useStateManager = () => {
  // --- Story Data States (이야기의 핵심 데이터) ---
  const [messages, setMessages] = useState([]);
  const [characters, setCharacters] = useState([DEFAULT_USER]);
  const [contextSettings, setContextSettings] = useState(DEFAULT_CONTEXT_SETTINGS);
  const [aiSettings, setAiSettings] = useState(DEFAULT_AI_SETTINGS);
  const [worldState, setWorldState] = useState(DEFAULT_WORLD_STATE);
  const [storyId, setStoryId] = useState(null);
  const [storyTitle, setStoryTitle] = useState('');
  const [storyList, setStoryList] = useState([]);
  const [vectorIndices, setVectorIndices] = useState({ scene: [], lore: [], character: [] });
  const [apiLog, setApiLog] = useState({ summary: {}, log: [] });
  const [contextInfo, setContextInfo] = useState({ system: 0, world: 0, memory: 0, lore: 0, chat: 0, total: 0 });
  const [retrievedMemories, setRetrievedMemories] = useState([]);
  const [blueprintTemplates, setBlueprintTemplates] = useState([]);
  const [characterTemplates, setCharacterTemplates] = useState([]);
  const [pinnedItems, setPinnedItems] = useState([]);

  // --- UI States (사용자 인터페이스 상태) ---
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [reEvaluation, setReEvaluation] = useState({ isOpen: false, isLoading: false, character: null, proposal: null });
  const [pdChatHistory, setPdChatHistory] = useState([]);
  const [isPdChatProcessing, setIsPdChatProcessing] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCharacterTemplateModalOpen, setIsCharacterTemplateModalOpen] = useState(false);
  const [characterToSave, setCharacterToSave] = useState(null);
  const [latestEmotionAnalysis, setLatestEmotionAnalysis] = useState(null);
  const [editingState, setEditingState] = useState({ isOpen: false, type: null, characterId: null });
  // [FEATURE] 열려있는 페르소나 현황 창 ID 목록을 관리하는 상태 추가
  const [floatingStatusWindows, setFloatingStatusWindows] = useState([]);


  const storyDataState = {
    messages, setMessages,
    characters, setCharacters,
    contextSettings, setContextSettings,
    aiSettings, setAiSettings,
    worldState, setWorldState,
    storyId, setStoryId,
    storyTitle, setStoryTitle,
    storyList, setStoryList,
    vectorIndices, setVectorIndices,
    apiLog, setApiLog,
    contextInfo, setContextInfo,
    retrievedMemories, setRetrievedMemories,
    blueprintTemplates, setBlueprintTemplates,
    characterTemplates, setCharacterTemplates,
    pinnedItems, setPinnedItems,
  };

  const uiState = {
    isLoading, setIsLoading,
    isProcessing, setIsProcessing,
    toast, setToast,
    reEvaluation, setReEvaluation,
    pdChatHistory, setPdChatHistory,
    isPdChatProcessing, setIsPdChatProcessing,
    isTemplateModalOpen, setIsTemplateModalOpen,
    isCharacterTemplateModalOpen, setIsCharacterTemplateModalOpen,
    characterToSave, setCharacterToSave,
    latestEmotionAnalysis, setLatestEmotionAnalysis,
    editingState, setEditingState,
    // [FEATURE] 새 상태와 세터 함수를 UI 상태 객체에 포함
    floatingStatusWindows, setFloatingStatusWindows,
  };

  return { storyDataState, uiState };
};
