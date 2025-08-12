// src/services/gemini/storyOrchestrator.js

import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { USER_ACTION_PROMPTS } from '../../constants';
import { BUILTIN_TOOLS } from '../../components/forge/builtinTools';

/**
 * 소설 모드(Novel Style) 응답을 생성하는 내부 함수입니다.
 * AI의 응답 형식을 JSON 스키마로 엄격하게 제어합니다.
 * @private
 */
async function _generateNovelResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal, toolResultPayload }) {
    const { aiSettings, customTools } = storyData;
    const allTools = [
        ...(aiSettings.enableBuiltInTools ? BUILTIN_TOOLS : []),
        ...customTools
    ];

    const geminiTools = allTools.map(tool => ({
        functionDeclarations: [
            {
                name: tool.name.replace(':', '_'), // Gemini는 ':' 문자를 허용 안 함
                description: tool.description,
                parameters: {
                    type: 'OBJECT',
                    properties: JSON.parse(tool.params || '{}')
                }
            }
        ]
    }));

    const responseSchema = {
        "type": "OBJECT",
        "properties": {
            ...(promptType === 'new_scene' && { "title": { "type": "STRING" } }),
            "content": {
                "type": "ARRAY",
                "items": {
                    "oneOf": [
                        { "type": "OBJECT", "properties": { "type": { "enum": ["narration"] }, "text": { "type": "STRING" } }, "required": ["type", "text"] },
                        { "type": "OBJECT", "properties": { "type": { "enum": ["dialogue"] }, "character": { "type": "STRING" }, "line": { "type": "STRING" }, "thought": { "type": "STRING" } }, "required": ["type", "character", "line"] },
                        { "type": "OBJECT", "properties": { "type": { "enum": ["interactiveComponent"] }, "componentSpec": { "type": "OBJECT", "properties": { "component": { "type": "STRING" }, "data": { "type": "OBJECT" } }, "required": ["component"] } }, "required": ["type", "componentSpec"] },
                        { "type": "OBJECT", "properties": { "type": { "enum": ["executeLogic"] }, "script": { "type": "STRING" }, "params": { "type": "OBJECT" } }, "required": ["type", "script"] }
                    ]
                }
            }
        },
        "required": promptType === 'new_scene' ? ["title", "content"] : ["content"]
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
    
    const contextBlock = `# 장면 컨텍스트\n${baseContext}\n${retrievedContextText}`;

    const finalContents = [
        { role: 'user', parts: [{ text: contextBlock }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPromptText }] }
    ];
    
    if (toolResultPayload) {
        finalContents.push({
            role: 'model',
            parts: [{ functionCall: toolResultPayload.functionCall }]
        });
        finalContents.push({
            role: 'user',
            parts: [{ functionResponse: toolResultPayload.functionResponse }]
        });
    }

    const payload = { 
        contents: finalContents, 
        systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] }, 
        generationConfig,
        safetySettings: aiSettings.safetySettings,
        tools: geminiTools.length > 0 ? { functionDeclarations: geminiTools.flatMap(t => t.functionDeclarations) } : undefined,
        tool_config: geminiTools.length > 0 ? { functionCallingConfig: { mode: "AUTO" } } : undefined,
    };

    const result = await callGeminiApi(payload, aiSettings.mainModel, 'generateContent', signal);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateNovelResponse', aiSettings.mainModel, result.usageMetadata, JSON.stringify(payload, null, 2));

    try {
        const parsedResult = JSON.parse(resultText);
        return { data: { ...parsedResult, style: 'Novel' }, logEntry, rawResponse: result };
    } catch (e) {
        console.error("--- Novel Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: [{ type: 'narration', text: errorText }], style: 'Novel' }, logEntry, rawResponse: result };
    }
}

/**
 * 채팅 모드(Chat Style) 응답을 생성하는 내부 함수입니다.
 * @private
 */
async function _generateChatResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal }) {
    const { aiSettings } = storyData;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            response: { type: "STRING" },
            attachedImage: { type: "STRING" } 
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
    
    const result = await callGeminiApi(payload, aiSettings.mainModel, 'generateContent', signal);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = createApiLogEntry('generateChatResponse', aiSettings.mainModel, result.usageMetadata, JSON.stringify(payload, null, 2));

    try {
        const parsedResult = JSON.parse(resultText);
        const responseData = { 
            content: parsedResult.response, 
            attachedImage: parsedResult.attachedImage, 
            style: 'Chat' 
        };
        
        return { data: responseData, logEntry, rawResponse: result };
    } catch (e) {
        console.error("--- Chat Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: errorText, style: 'Chat' }, logEntry, rawResponse: result };
    }
}

/**
 * AI의 텍스트 응답 생성을 총괄하는 메인 함수입니다.
 * 서사 스타일에 따라 적절한 생성 함수를 호출합니다.
 */
export const generateResponse = async (storyData, promptType, content, contextHistory, retrievedContext, signal, toolResultPayload = null) => {
    const { characters, contextSettings, worldState, aiSettings, worldviewText, assets } = storyData;

    const characterProfiles = characters.map(c => {
        const { vector, generationConcept, profileImageUrl, ...profile } = c;
        return profile;
    });

    const availableAssetsText = (assets && assets.length > 0) 
        ? `\n### 사용 가능한 에셋 목록 (availableAssets)\n${JSON.stringify(assets.reduce((acc, asset) => {
            const ownerKey = asset.ownerId === 'shared' ? '공용' : characters.find(c => String(c.id) === String(asset.ownerId))?.name || '알수없음';
            if (!acc[ownerKey]) acc[ownerKey] = [];
            acc[ownerKey].push(asset.fileName);
            return acc;
          }, {}))}`
        : "";

    const baseContext = `${worldviewText}\n### 시작 장면 (Starting Scene)\n- 현재 시간: ${worldState.day}일차 ${worldState.hour}시 ${worldState.minute}분\n- 현재 날씨: ${worldState.weather}\n- 현재 상황: ${contextSettings.situation}\n- 등장인물 프로필: ${JSON.stringify(characterProfiles, null, 2)}${availableAssetsText}`;
    const retrievedContextText = retrievedContext.length > 0 ? `\n\n### 소환된 기억 (Retrieved Scenes)\n${retrievedContext.join('\n\n')}` : "";

    const basePayload = { storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal, toolResultPayload };

    if (aiSettings.narrativeStyle === 'Chat') {
        return _generateChatResponse(basePayload);
    } else {
        return _generateNovelResponse(basePayload);
    }
};
