import { useCallback } from 'react';
import { storyService, utilityGenerator } from '../services';

const LEVEL_1_COMPRESSION_THRESHOLD = 20;
const LEVEL_2_COMPRESSION_THRESHOLD = 5;

/**
 * 기억 압축 및 관리 로직을 전담하는 훅
 */
export const useMemoryManagement = (storyDataState, uiState, showToast, addApiLogEntry, _addEntryToIndex) => {
    const { storyId, messages, aiSettings, setVectorIndices } = storyDataState;
    const { isProcessing, setIsProcessing } = uiState;

    const handleMemoryCompression = useCallback(async (level) => {
        if (!storyId || isProcessing) return;
        setIsProcessing(true);
        showToast(`기억 압축(L${level})을 시작합니다...`);
        try {
            const sourceLevel = level - 1;
            const threshold = level === 1 ? LEVEL_1_COMPRESSION_THRESHOLD : LEVEL_2_COMPRESSION_THRESHOLD;
            const targets = await storyService.getIndexEntries(storyId, 'sceneIndex', sourceLevel, threshold);
            
            if (targets.length < threshold) {
                showToast(`압축할 L${sourceLevel} 장면 기억이 충분하지 않습니다. (${targets.length}/${threshold})`, 'warning');
                setIsProcessing(false);
                return;
            }

            const textToSummarize = targets.map(t => t.text).join('\n\n');
            const { summary, logEntry } = await utilityGenerator.summarizeEvents(textToSummarize, level, aiSettings.auxModel);
            addApiLogEntry(logEntry);

            const source_ids = targets.map(t => t.id);
            await _addEntryToIndex('sceneIndex', { id: `L${level}_${Date.now()}`, text: `[요약된 ${level === 1 ? '장면' : `에피소드 L${level}`}] ${summary}`, level: level, source_ids: source_ids }, storyId);
            
            await storyService.deleteIndexEntries(storyId, 'sceneIndex', source_ids);

            if (level === 1) {
                const messageDocIdsToUpdate = targets.flatMap(t => {
                    const msgIds = t.source_ids || [];
                    return msgIds.map(id => messages.find(m => m.id.toString() === id)?.docId).filter(Boolean);
                });
                if (messageDocIdsToUpdate.length > 0) {
                    await storyService.updateMessagesSummarizedFlag(storyId, messageDocIdsToUpdate);
                }
            }

            const newIndex = await storyService.loadIndexCollection(storyId, 'sceneIndex');
            setVectorIndices(prev => ({ ...prev, scene: newIndex }));
            showToast(`기억 압축(L${level})이 완료되었습니다.`);
        } catch (error) {
            console.error(`기억 압축 오류 (L${level}):`, error);
            showToast(`기억 압축 중 오류 발생: ${error.message}`, 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [storyId, isProcessing, aiSettings.auxModel, messages, addApiLogEntry, _addEntryToIndex, setVectorIndices, showToast, setIsProcessing]);

    return { handleMemoryCompression };
};
