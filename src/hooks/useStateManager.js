import { useState } from 'react';
import { 
    DEFAULT_PROTAGONIST, 
    DEFAULT_LOREBOOK, 
    DEFAULT_AI_SETTINGS, 
    DEFAULT_WORLD_STATE 
} from '../constants/defaults';

/**
 * 애플리케이션의 모든 핵심 상태(State)를 관리하는 커스텀 훅입니다.
 * 이 훅은 상태를 선언하고, 상태를 '데이터'와 'UI' 두 그룹으로 나누어 반환합니다.
 * @returns {object} storyDataState와 uiState 객체를 포함하는 객체
 */
export const useStateManager = () => {
  // --- 이야기의 핵심 데이터 상태 (StoryData) ---
  const [messages, setMessages] = useState([]);
  const [characters, setCharacters] = useState([DEFAULT_PROTAGONIST]);
  const [lorebook, setLorebook] = useState(DEFAULT_LOREBOOK);
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

  // --- UI 및 상호작용 관련 상태 (UIState) ---
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [reEvaluation, setReEvaluation] = useState({ isOpen: false, isLoading: false, character: null, proposal: null });
  const [pdChatHistory, setPdChatHistory] = useState([]);
  const [isPdChatProcessing, setIsPdChatProcessing] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isCharacterTemplateModalOpen, setIsCharacterTemplateModalOpen] = useState(false);
  const [characterToSave, setCharacterToSave] = useState(null);

  const storyDataState = {
    messages, setMessages,
    characters, setCharacters,
    lorebook, setLorebook,
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
  };

  return { storyDataState, uiState };
};
