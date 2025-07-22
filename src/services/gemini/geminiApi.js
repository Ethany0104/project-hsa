// src/services/gemini/geminiApi.js

import { GEMINI_API_KEY } from '../../config/geminiConfig';

const getApiUrl = (model, task = 'generateContent') => {
    // text-embedding-004 모델은 v1beta가 아닌 v1 엔드포인트를 사용해야 할 수 있습니다.
    // 최신 API 문서를 확인하여 모델별 엔드포인트를 정확히 기재하는 것이 좋습니다.
    // 여기서는 일관성을 위해 v1beta를 유지합니다.
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${task}?key=${GEMINI_API_KEY}`;
};

export const callGeminiApi = async (payload, model, task = 'generateContent') => {
  const apiUrl = getApiUrl(model, task);
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error("API call failed:", response.status, errorBody);
      // 사용자에게 더 친화적인 에러 메시지를 생성할 수 있습니다.
      throw new Error(`API 호출 실패: ${response.status}. 응답: ${errorBody}`);
    }
    const result = await response.json();
    
    // 임베딩 또는 토큰 카운트 작업의 경우, 후보(candidate) 없이 바로 결과를 반환합니다.
    if (task === 'embedContent' || task === 'batchEmbedContents' || task === 'countTokens') {
        return result;
    }

    // 콘텐츠 생성 작업에서 후보가 없는 경우, 안전 설정에 의해 차단되었을 가능성이 높습니다.
    if (!result.candidates || result.candidates.length === 0) {
        if (result.promptFeedback && result.promptFeedback.blockReason) {
            throw new Error(`요청이 안전 설정에 의해 차단되었습니다. 이유: ${result.promptFeedback.blockReason}`);
        }
        throw new Error("AI로부터 유효한 응답을 받지 못했습니다. (No candidates)");
    }
    return result;
  } catch (error) {
    console.error(`Gemini API 호출 중 에러 발생 (${apiUrl}): `, error);
    throw error; // 에러를 상위로 전파하여 호출부에서 처리하도록 합니다.
  }
};

export const createApiLogEntry = (functionName, model, usage) => {
  const { promptTokenCount = 0, candidatesTokenCount = 0, totalTokenCount = 0 } = usage || {};
  return {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      functionName,
      model,
      promptTokens: promptTokenCount,
      candidateTokens: candidatesTokenCount,
      totalTokens: totalTokenCount,
  };
};

export const countTokens = async (text, model = 'gemini-1.5-flash-latest') => {
    if (!text) return 0;
    const payload = { contents: [{ parts: [{ text }] }] };
    try {
        const result = await callGeminiApi(payload, model, 'countTokens');
        return result.totalTokens || 0;
    } catch (error) {
        console.error("Token counting failed:", error);
        return 0; // 토큰 계산 실패 시 0을 반환하여 앱 중단을 방지
    }
};

export const embedContent = async (text, model = 'text-embedding-004') => {
    const payload = { content: { parts: [{ text }] } };
    const result = await callGeminiApi(payload, model, 'embedContent');
    return result.embedding.values;
};
