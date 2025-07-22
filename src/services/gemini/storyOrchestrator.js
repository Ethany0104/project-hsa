import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { USER_ACTION_PROMPTS } from '../../constants/prompts';

async function _generateNovelResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText }) {
    const { aiSettings } = storyData;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            ...(promptType === 'new_scene' && { title: { type: "STRING" } }),
            content: {
                type: "ARRAY",
                items: {
                    oneOf: [
                        { type: "OBJECT", properties: { type: { "enum": ["narration"] }, text: { type: "STRING" } }, required: ["type", "text"] },
                        { type: "OBJECT", properties: { type: { "enum": ["dialogue"] }, character: { type: "STRING" }, line: { type: "STRING" }, thought: { type: "STRING" } }, required: ["type", "character", "line", "thought"] }
                    ]
                }
            }
        },
        required: promptType === 'new_scene' ? ["title", "content"] : ["content"]
    };

    const generationConfig = { 
        temperature: aiSettings.temperature, 
        topK: aiSettings.topK, 
        topP: aiSettings.topP, 
        maxOutputTokens: aiSettings.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema,
    };

    const userActionPromptText = USER_ACTION_PROMPTS[promptType] ? USER_ACTION_PROMPTS[promptType](content.text) : USER_ACTION_PROMPTS['send'](content.text);

    const apiHistory = contextHistory.map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'model',
        parts: [{ text: JSON.stringify(msg.sender === 'player' ? { action: msg.text } : { response: msg.content }) }]
    }));

    const finalContents = [
        { role: 'user', parts: [{ text: `${baseContext}${retrievedContextText}` }] },
        { role: 'model', parts: [{ text: "알겠습니다. 모든 설정을 확인했습니다. 이제부터 소설 모드 규칙에 따라 연기를 시작하겠습니다." }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPromptText }] }
    ];

    const payload = { 
        contents: finalContents, 
        systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] }, 
        generationConfig,
    };

    const result = await callGeminiApi(payload, aiSettings.mainModel);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateNovelResponse', aiSettings.mainModel, result.usageMetadata);

    try {
        const parsedResult = JSON.parse(resultText);
        return { data: { ...parsedResult, style: 'Novel' }, logEntry };
    } catch (e) {
        console.error("--- Novel Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: [{ type: 'narration', text: errorText }], style: 'Novel' }, logEntry };
    }
}

async function _generateChatResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText }) {
    const { aiSettings } = storyData;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            ...(promptType === 'new_scene' && { title: { type: "STRING" } }),
            response: { type: "STRING" }
        },
        required: promptType === 'new_scene' ? ["title", "response"] : ["response"]
    };

    const generationConfig = { 
        temperature: aiSettings.temperature, 
        topK: aiSettings.topK, 
        topP: aiSettings.topP, 
        maxOutputTokens: aiSettings.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema,
    };

    const userActionPromptText = USER_ACTION_PROMPTS[promptType] ? USER_ACTION_PROMPTS[promptType](content.text) : USER_ACTION_PROMPTS['send'](content.text);

    const apiHistory = contextHistory.map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const finalContents = [
        { role: 'user', parts: [{ text: `${baseContext}${retrievedContextText}` }] },
        { role: 'model', parts: [{ text: "알겠습니다. 모든 설정을 확인했습니다. 이제부터 채팅 모드 규칙에 따라 연기를 시작하겠습니다." }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPromptText }] }
    ];

    const payload = { 
        contents: finalContents, 
        systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] }, 
        generationConfig,
    };

    const result = await callGeminiApi(payload, aiSettings.mainModel);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateChatResponse', aiSettings.mainModel, result.usageMetadata);

    try {
        const parsedResult = JSON.parse(resultText);
        return { data: { ...parsedResult, style: 'Chat' }, logEntry };
    } catch (e) {
        console.error("--- Chat Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { response: errorText, style: 'Chat' }, logEntry };
    }
}

// [BUG FIX] generateResponse 함수에서 불필요하고 잘못된 감정 분석 로직을 제거합니다.
// 이제 이 함수는 외부에서 전달받은 emotionAnalysisContext를 사용합니다.
export const generateResponse = async (storyData, promptType, content, contextHistory, retrievedContext, emotionAnalysisContext) => {
    const { characters, contextSettings, worldState, aiSettings } = storyData;

    const characterProfiles = characters.map(c => {
        const { vector, generationConcept, profileImageUrl, ...profile } = c;
        return profile;
    });

    const baseContext = `### 기본 설정 (Base Context)\n- 현재 시간: ${worldState.day}일차 ${worldState.hour}시 ${worldState.minute}분\n- 현재 날씨: ${worldState.weather}\n- 현재 상황: ${contextSettings.situation}${emotionAnalysisContext}\n- 등장인물 프로필: ${JSON.stringify(characterProfiles, null, 2)}`;
    const retrievedContextText = retrievedContext.length > 0 ? `\n\n### 소환된 기억 (Retrieved Scenes)\n${retrievedContext.join('\n\n')}` : "";

    const basePayload = { storyData, promptType, content, contextHistory, baseContext, retrievedContextText };

    if (aiSettings.narrativeStyle === 'Chat') {
        return await _generateChatResponse(basePayload);
    } else {
        return await _generateNovelResponse(basePayload);
    }
};
