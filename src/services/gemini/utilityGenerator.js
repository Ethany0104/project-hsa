import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { PROMPT_TEMPLATES, PD_INSTRUCTION } from '../../constants';

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
    // [FIX] 로그 생성 시 payload(프롬프트)를 함께 전달합니다.
    const logEntry = createApiLogEntry('getPdResponse', model, result.usageMetadata, JSON.stringify(payload, null, 2));
    return { response: responseText, logEntry };
};

export const deduceTime = async (eventText, worldState, model) => {
    const promptTemplate = PROMPT_TEMPLATES.deduceTime;
    const userPromptText = promptTemplate.user(eventText, worldState); // 텍스트를 미리 생성
    const payload = {
        contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const timeText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // [BUG FIX] 로그 생성 시 함수가 아닌, 생성된 프롬프트 텍스트를 전달합니다.
    const logEntry = createApiLogEntry('deduceTime', model, result.usageMetadata, userPromptText);
    if (!timeText) throw new Error("AI가 시간 추론 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(timeText), logEntry };
};

export const updatePersonalGoals = async (character, recentEvents, model) => {
    const promptTemplate = PROMPT_TEMPLATES.updatePersonalGoals;
    const userPromptText = promptTemplate.user(character, recentEvents); // 텍스트를 미리 생성
    const payload = {
        contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const dataText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // [BUG FIX] 로그 생성 시 함수가 아닌, 생성된 프롬프트 텍스트를 전달합니다.
    const logEntry = createApiLogEntry('updatePersonalGoals', model, result.usageMetadata, userPromptText);
    if (!dataText) throw new Error("AI가 단기 목표 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(dataText), logEntry };
};

export const analyzeEmotion = async (character, situation, recentHistory, model) => {
    const promptTemplate = PROMPT_TEMPLATES.analyzeEmotion;
    const userPromptText = promptTemplate.user(character, situation, recentHistory); // 텍스트를 미리 생성
    const payload = {
        contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const dataText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // [BUG FIX] 로그 생성 시 함수가 아닌, 생성된 프롬프트 텍스트를 전달합니다.
    const logEntry = createApiLogEntry('analyzeEmotion', model, result.usageMetadata, userPromptText);
    if (!dataText) throw new Error("AI가 감정 분석 데이터를 반환하지 않았습니다.");
    return { data: JSON.parse(dataText), logEntry };
};

export const reEvaluateCoreBeliefs = async (character, recentEvents, model) => {
    const promptTemplate = PROMPT_TEMPLATES.reEvaluateCoreBeliefs;
    const userPromptText = promptTemplate.user(character, recentEvents); // 텍스트를 미리 생성
    const payload = {
        contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const proposalText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // [BUG FIX] 로그 생성 시 함수가 아닌, 생성된 프롬프트 텍스트를 전달합니다.
    const logEntry = createApiLogEntry('reEvaluateCoreBeliefs', model, result.usageMetadata, userPromptText);
    if (!proposalText) throw new Error("AI가 심리 재평가 데이터를 반환하지 않았습니다.");
    return { proposal: JSON.parse(proposalText), logEntry };
};

export const summarizeEvents = async (textToSummarize, level, model) => {
    const promptTemplate = PROMPT_TEMPLATES.summarizeEvents;
    const userPromptText = promptTemplate.user(textToSummarize, level); // 텍스트를 미리 생성
    const payload = {
        contents: [{ role: 'user', parts: [{ text: userPromptText }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema
        }
    };
    const result = await callGeminiApi(payload, model);
    const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    // [BUG FIX] 로그 생성 시 함수가 아닌, 생성된 프롬프트 텍스트를 전달합니다.
    const logEntry = createApiLogEntry('summarizeEvents', model, result.usageMetadata, userPromptText);
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
