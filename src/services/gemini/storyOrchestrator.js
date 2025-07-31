// ===== Start of project-hsa\src\services\gemini\storyOrchestrator.js =====

import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { USER_ACTION_PROMPTS } from '../../constants';

// [FIX] 스트리밍 대신 단일 JSON 응답을 처리하는 함수로 변경합니다.
async function _generateNovelResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal }) {
    const { aiSettings } = storyData;

    // [FIX] 백업 파일에서 확인된, 안정적인 JSON 스키마를 정의합니다.
    const responseSchema = {
        type: "OBJECT",
        properties: {
            ...(promptType === 'new_scene' && { title: { type: "STRING" } }),
            content: {
                type: "ARRAY",
                items: {
                    oneOf: [
                        { type: "OBJECT", properties: { type: { "enum": ["narration"] }, text: { type: "STRING" } }, required: ["type", "text"] },
                        { type: "OBJECT", properties: { type: { "enum": ["dialogue"] }, character: { type: "STRING" }, line: { type: "STRING" }, thought: { type: "STRING" } }, required: ["type", "character", "line"] }
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
        responseMimeType: "application/json", // JSON 응답을 명시적으로 요청합니다.
        responseSchema,
    };

    const userActionPromptText = USER_ACTION_PROMPTS[promptType] ? USER_ACTION_PROMPTS[promptType](content.text) : USER_ACTION_PROMPTS['send'](content.text);

    const apiHistory = contextHistory.map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'model',
        parts: [{ text: JSON.stringify(msg.sender === 'player' ? { action: msg.text } : { response: msg.content }) }]
    }));
    
    const contextBlock = `# 장면 컨텍스트\n${baseContext}\n${retrievedContextText}`;

    const finalContents = [
        { role: 'user', parts: [{ text: contextBlock }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPromptText }] }
    ];

    const payload = { 
        contents: finalContents, 
        systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] }, 
        generationConfig,
        safetySettings: aiSettings.safetySettings,
    };

    console.warn("[DEBUG] 최종 API 요청 페이로드:", JSON.parse(JSON.stringify(payload)));

    const result = await callGeminiApi(payload, aiSettings.mainModel, 'generateContent', signal);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateNovelResponse', aiSettings.mainModel, result.usageMetadata, JSON.stringify(payload, null, 2));

    try {
        const parsedResult = JSON.parse(resultText);
        return { data: { ...parsedResult, style: 'Novel' }, logEntry };
    } catch (e) {
        console.error("--- Novel Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: [{ type: 'narration', text: errorText }], style: 'Novel' }, logEntry };
    }
}

// [PD NOTE] 채팅 모드 응답 생성 로직을 구현합니다.
async function _generateChatResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal }) {
    const { aiSettings } = storyData;

    // 채팅 모드는 단순 텍스트 응답을 받으므로, 스키마를 간단하게 정의합니다.
    const responseSchema = {
        type: "OBJECT",
        properties: {
            response: { type: "STRING" }
        },
        required: ["response"]
    };

    const generationConfig = {
        temperature: aiSettings.temperature,
        topK: aiSettings.topK,
        topP: aiSettings.topP,
        maxOutputTokens: aiSettings.maxOutputTokens,
        responseMimeType: "application/json",
        responseSchema,
    };

    // 채팅 모드의 히스토리는 단순 텍스트의 연속입니다.
    // [BUG FIX] AI의 메시지는 content에, 유저의 메시지는 text에 담겨있으므로 이를 분기처리합니다.
    const apiHistory = contextHistory.map(msg => ({
        role: msg.sender === 'player' ? 'user' : 'model',
        parts: [{ text: msg.sender === 'ai' ? msg.content : msg.text }] 
    }));

    const contextBlock = `# 장면 컨텍스트\n${baseContext}\n${retrievedContextText}`;
    
    const userActionPromptText = USER_ACTION_PROMPTS[promptType] ? USER_ACTION_PROMPTS[promptType](content.text) : USER_ACTION_PROMPTS['send'](content.text);

    const finalContents = [
        { role: 'user', parts: [{ text: contextBlock }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPromptText }] }
    ];

    const payload = {
        contents: finalContents,
        systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] },
        generationConfig,
        safetySettings: aiSettings.safetySettings,
    };
    
    console.warn("[DEBUG] 최종 API 요청 페이로드 (채팅 모드):", JSON.parse(JSON.stringify(payload)));

    const result = await callGeminiApi(payload, aiSettings.mainModel, 'generateContent', signal);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateChatResponse', aiSettings.mainModel, result.usageMetadata, JSON.stringify(payload, null, 2));

    try {
        const parsedResult = JSON.parse(resultText);
        // storyOrchestrator가 기대하는 { content: ..., style: ... } 형태가 아닌,
        // StoryBlock이 기대하는 { text: ..., style: ... } 형태로 맞춰주어야 합니다.
        // 그리고 최종적으로 AI 응답 메시지는 content 필드에 텍스트를 담아 저장합니다.
        const responseData = { content: parsedResult.response, style: 'Chat' };
        
        // 최종 반환값은 _orchestrateStoryGeneration 함수와의 약속을 지킵니다.
        return { data: responseData, logEntry };
    } catch (e) {
        console.error("--- Chat Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: errorText, style: 'Chat' }, logEntry };
    }
}


export const generateResponse = async (storyData, promptType, content, contextHistory, retrievedContext, signal) => {
    const { characters, contextSettings, worldState, aiSettings, worldviewText } = storyData;

    const characterProfiles = characters.map(c => {
        const { vector, generationConcept, profileImageUrl, ...profile } = c;
        return profile;
    });

    const baseContext = `${worldviewText}\n### 시작 장면 (Starting Scene)\n- 현재 시간: ${worldState.day}일차 ${worldState.hour}시 ${worldState.minute}분\n- 현재 날씨: ${worldState.weather}\n- 현재 상황: ${contextSettings.situation}\n- 등장인물 프로필: ${JSON.stringify(characterProfiles, null, 2)}`;
    const retrievedContextText = retrievedContext.length > 0 ? `\n\n### 소환된 기억 (Retrieved Scenes)\n${retrievedContext.join('\n\n')}` : "";

    const basePayload = { storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal };

    if (aiSettings.narrativeStyle === 'Chat') {
        return await _generateChatResponse(basePayload);
    } else {
        return await _generateNovelResponse(basePayload);
    }
};

// ===== End of project-hsa\src\services\gemini\storyOrchestrator.js =====