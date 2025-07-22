import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { PROMPT_TEMPLATES, PD_INSTRUCTION } from '../../constants/prompts';

export const getPdResponse = async (history, model) => {
    const apiHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const payload = {
        contents: apiHistory,
        systemInstruction: { parts: [{ text: PD_INSTRUCTION }] },
        generationConfig: { temperature: 1.2, topP: 1.0, maxOutputTokens: 6144 }
    };
    const result = await callGeminiApi(payload, model);
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "미안, 지금은 대답하기 곤란해.";
    const logEntry = createApiLogEntry('getPdResponse', model, result.usageMetadata);
    return { response: responseText, logEntry };
};

// [LOGIC CHANGE] 시간 추론의 기준이 되는 텍스트를 'playerAction'에서 더 포괄적인 'eventText'로 변경합니다.
export const deduceTime = async (eventText, worldState, model) => {
    const promptTemplate = PROMPT_TEMPLATES.deduceTime;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(eventText, worldState) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const timeText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry('deduceTime', model, result.usageMetadata);
    if (!timeText) throw new Error("AI가 시간 추론 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(timeText), logEntry };
};

export const updatePersonalGoals = async (character, recentEvents, model) => {
    const promptTemplate = PROMPT_TEMPLATES.updatePersonalGoals;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(character, recentEvents) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const dataText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry('updatePersonalGoals', model, result.usageMetadata);
    if (!dataText) throw new Error("AI가 단기 목표 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(dataText), logEntry };
};

export const analyzeEmotion = async (character, situation, recentHistory, model) => {
    const promptTemplate = PROMPT_TEMPLATES.analyzeEmotion;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(character, situation, recentHistory) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const dataText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry('analyzeEmotion', model, result.usageMetadata);
    if (!dataText) throw new Error("AI가 감정 분석 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(dataText), logEntry };
};

export const reEvaluateCoreBeliefs = async (character, recentEvents, model) => {
    const promptTemplate = PROMPT_TEMPLATES.reEvaluateCoreBeliefs;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(character, recentEvents) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const proposalText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry('reEvaluateCoreBeliefs', model, result.usageMetadata);
    if (!proposalText) throw new Error("AI가 심리 재평가 데이터를 반환하지 않았습니다.");
    return { proposal: JSON.parse(proposalText), logEntry };
};

export const summarizeEvents = async (textToSummarize, level, model) => {
    const promptTemplate = PROMPT_TEMPLATES.summarizeEvents;
    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(textToSummarize, level) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry('summarizeEvents', model, result.usageMetadata);
    if (!summaryText) {
        throw new Error("AI가 요약 내용을 반환하지 않았습니다.");
    }
    try {
        const parsedResult = JSON.parse(summaryText);
        return { summary: parsedResult.summary, logEntry };
    } catch (e) {
        console.error("요약 응답 파싱 오류:", e, "원문:", summaryText);
        return { summary: summaryText, logEntry };
    }
};
