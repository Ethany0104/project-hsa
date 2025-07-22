import { useCallback } from 'react';
import { utilityGenerator } from '../services';

/**
 * PD 채팅 관련 로직을 전담하는 훅
 */
export const usePdChat = (storyDataState, uiState, showToast, addApiLogEntry) => {
    const { aiSettings } = storyDataState;
    const { pdChatHistory, setPdChatHistory, setIsPdChatProcessing } = uiState;

    const handlePdChatSend = useCallback(async (userInput, modelOverride) => {
        if (!userInput.trim()) return;
        
        const modelToUse = modelOverride || aiSettings.auxModel;
        
        const newUserMessage = { role: 'user', text: userInput };
        const newHistory = [...pdChatHistory, newUserMessage];
        setPdChatHistory(newHistory);
        setIsPdChatProcessing(true);
        
        try {
            const { response, logEntry } = await utilityGenerator.getPdResponse(newHistory, modelToUse); 
            addApiLogEntry(logEntry);
            const newAiMessage = { role: 'assistant', text: response };
            setPdChatHistory(prev => [...prev, newAiMessage]);
        } catch (error) {
            showToast(`PD 응답 생성 실패: ${error.message}`, 'error');
            const errorMessage = { role: 'assistant', text: `죄송해요, 자기야. 지금은 응답할 수 없어. (${error.message})` };
            setPdChatHistory(prev => [...prev, errorMessage]);
        } finally {
            setIsPdChatProcessing(false);
        }
    }, [pdChatHistory, aiSettings.auxModel, addApiLogEntry, showToast, setPdChatHistory, setIsPdChatProcessing]);

    const handleClearPdChat = useCallback(() => {
        setPdChatHistory([]);
        showToast("PD와의 대화 기록이 초기화되었습니다.");
    }, [setPdChatHistory, showToast]);

    return { handlePdChatSend, handleClearPdChat };
};
