// ===== Start of project-hsa\src\services\gemini\storyOrchestrator.js =====

import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { USER_ACTION_PROMPTS } from '../../constants';

// 소설 모드 응답을 생성하는 내부 함수
async function _generateNovelResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal }) {
    const { aiSettings } = storyData;

    const responseSchema = {
        type: "OBJECT",
        properties: {
            ...(promptType === 'new_scene' && { title: { type: "STRING" } }),
            content: {
                type: "ARRAY",
                items: {
                    oneOf: [
                        { 
                            type: "OBJECT", 
                            properties: { 
                                type: { "enum": ["narration"] }, 
                                text: { type: "STRING" },
                            }, 
                            required: ["type", "text"] 
                        },
                        { 
                            type: "OBJECT", 
                            properties: { 
                                type: { "enum": ["dialogue"] }, 
                                character: { type: "STRING" }, 
                                line: { type: "STRING" }, 
                                thought: { type: "STRING" },
                            }, 
                            required: ["type", "character", "line"] 
                        }
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

// 채팅 모드 응답을 생성하는 내부 함수
async function _generateChatResponse({ storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal }) {
    const { aiSettings } = storyData;

    // [BUG FIX] 채팅 모드에서도 이미지 선택을 위해 응답 스키마를 수정합니다.
    // AI는 이제 텍스트 응답과 함께, 선택적으로 이미지 파일명을 반환할 수 있습니다.
    const responseSchema = {
        type: "OBJECT",
        properties: {
            response: { type: "STRING" },
            // attachedImage 필드를 스키마에 추가하여 AI가 파일명을 반환하도록 유도합니다.
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
        // [BUG FIX] 파싱된 결과에서 response와 attachedImage를 모두 추출하여 반환합니다.
        const responseData = { 
            content: parsedResult.response, 
            // AI가 선택한 이미지 파일명을 함께 전달합니다.
            attachedImage: parsedResult.attachedImage, 
            style: 'Chat' 
        };
        
        return { data: responseData, logEntry };
    } catch (e) {
        console.error("--- Chat Mode JSON Parsing Error ---", e, "Raw text:", resultText);
        const errorText = `[PD 알림] AI 응답 파싱 오류. 원문: ${resultText}`;
        return { data: { content: errorText, style: 'Chat' }, logEntry };
    }
}

/**
 * AI의 텍스트 응답 생성을 담당하는 메인 함수.
 * 이제 이 함수는 텍스트와 함께 AI가 직접 선택한 이미지 파일명(선택사항)도 반환합니다.
 */
export const generateResponse = async (storyData, promptType, content, contextHistory, retrievedContext, signal) => {
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

    const basePayload = { storyData, promptType, content, contextHistory, baseContext, retrievedContextText, signal };

    // [BUG FIX] 채팅 모드에서도 이미지 선택 로직이 포함된 AI 호출을 하도록 수정합니다.
    // 이제 두 모드 모두 AI 응답에 attachedImage 필드가 포함될 수 있습니다.
    if (aiSettings.narrativeStyle === 'Chat') {
        return _generateChatResponse(basePayload);
    } else {
        return _generateNovelResponse(basePayload);
    }
};
