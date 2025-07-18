import { GEMINI_API_KEY } from '../config/geminiConfig';
import { PROMPT_TEMPLATES, USER_ACTION_PROMPTS, PD_INSTRUCTION } from '../constants/prompts';

// --- AI Service (Gemini) ---
export const geminiService = {
  _getApiUrl: (model, task = 'generateContent') => {
      if (model === 'text-embedding-004') {
          return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${task}?key=${GEMINI_API_KEY}`;
      }
      return `https://generativelanguage.googleapis.com/v1beta/models/${model}:${task}?key=${GEMINI_API_KEY}`;
  },

  _callGemini: async (payload, model, task = 'generateContent') => {
    const apiUrl = geminiService._getApiUrl(model, task);
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorBody = await response.text();
        console.error("API call failed:", response.status, errorBody);
        throw new Error(`API call failed with status: ${response.status}`);
      }
      const result = await response.json();
      
      if (task === 'embedContent' || task === 'countTokens') return result;

      if (!result.candidates || result.candidates.length === 0) {
          if (result.promptFeedback && result.promptFeedback.blockReason) {
              throw new Error(`요청이 차단되었습니다. 이유: ${result.promptFeedback.blockReason}`);
          }
          throw new Error("AI로부터 유효한 응답을 받지 못했습니다.");
      }
      return result;
    } catch (error) {
      console.error(`Error calling Gemini API at ${apiUrl}: `, error);
      throw error;
    }
  },
  
  _createLogEntry: (functionName, model, usage) => {
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
  },

  countTokens: async (text) => {
      if (!text) return 0;
      const payload = { contents: [{ parts: [{ text }] }] };
      const result = await geminiService._callGemini(payload, 'gemini-1.5-flash-latest', 'countTokens');
      return result.totalTokens || 0;
  },

  embedContent: async (text) => {
      const payload = { content: { parts: [{ text }] } };
      const result = await geminiService._callGemini(payload, 'text-embedding-004', 'embedContent');
      return result.embedding.values;
  },
  
  getPdResponse: async (history, model) => {
    const apiHistory = history.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
    }));

    const payload = {
        contents: apiHistory,
        systemInstruction: { parts: [{ text: PD_INSTRUCTION }] },
        generationConfig: { temperature: 1.2, topP: 1.0, maxOutputTokens: 6144 }
    };
    const result = await geminiService._callGemini(payload, model);
    const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || "미안, 지금은 대답하기 곤란해.";
    const logEntry = geminiService._createLogEntry('getPdResponse', model, result.usageMetadata);
    return { response: responseText, logEntry };
  },

  generateSubconsciousStream: async (character, model) => {
    if (!character || character.isProtagonist) return { stream: "", logEntry: null };
    const systemInstructionText = PROMPT_TEMPLATES.generateSubconsciousStream.system
        .replace('[캐릭터 이름]', character.name)
        .replace('[심볼 목록]', JSON.stringify(character.subconscious?.recurringSymbols || []));

    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateSubconsciousStream.user(character) }] }],
        systemInstruction: { parts: [{ text: systemInstructionText }] },
        generationConfig: { temperature: 1.3, maxOutputTokens: 100 }
    };
    const result = await geminiService._callGemini(payload, model);
    const streamText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const logEntry = geminiService._createLogEntry('generateSubconsciousStream', model, result.usageMetadata);
    return { stream: streamText, logEntry };
  },

  summarizeEvents: async (textToSummarize, level, model) => {
      const payload = {
          contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.summarizeEvents.user(textToSummarize, level) }] }],
          systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.summarizeEvents.system }] },
          generationConfig: { temperature: 0.5 }
      };
      const result = await geminiService._callGemini(payload, model);
      const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      const logEntry = geminiService._createLogEntry(`summarizeEvents_L${level}`, model, result.usageMetadata);
      if (!summaryText) throw new Error("AI가 요약문을 반환하지 않았습니다.");
      return { summary: summaryText, logEntry };
  },

  generateNarrativeProfile: async (characterInfo, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateNarrativeProfile.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.generateNarrativeProfile.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { formativeEvent: { type: "STRING" }, corePrinciple: { type: "STRING" }, coreDesire: { type: "STRING" } }, required: ["formativeEvent", "corePrinciple", "coreDesire"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const profileText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('generateNarrativeProfile', model, result.usageMetadata);
    if (!profileText) throw new Error("AI가 서사 프로필 텍스트를 반환하지 않았습니다.");
    return { data: JSON.parse(profileText), logEntry };
  },
  
  generateBig5Profile: async (characterInfo, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateBig5Profile.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.generateBig5Profile.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { openness: { type: "NUMBER" }, conscientiousness: { type: "NUMBER" }, extraversion: { type: "NUMBER" }, agreeableness: { type: "NUMBER" }, neuroticism: { type: "NUMBER" } }, required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const big5Text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('generateBig5Profile', model, result.usageMetadata);
    if (!big5Text) throw new Error("AI가 BIG5 프로필 텍스트를 반환하지 않았습니다.");
    return { data: JSON.parse(big5Text), logEntry };
  },

  generateInnerShadow: async (characterInfo, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateInnerShadow.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.generateInnerShadow.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { speechPatterns: { type: "STRING" }, quirks: { type: "STRING" }, secrets: { type: "STRING" } }, required: ["speechPatterns", "quirks", "secrets"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const innerShadowText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('generateInnerShadow', model, result.usageMetadata);
    if (!innerShadowText) throw new Error("AI가 내면의 그림자 프로필을 반환하지 않았습니다.");
    return { data: JSON.parse(innerShadowText), logEntry };
  },

  generateDestiny: async (characterInfo, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateDestiny.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.generateDestiny.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { thematicArc: { type: "STRING" }, tragicFlaw: { type: "STRING" } }, required: ["thematicArc", "tragicFlaw"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const destinyText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('generateDestiny', model, result.usageMetadata);
    if (!destinyText) throw new Error("AI가 운명 프로필을 반환하지 않았습니다.");
    return { data: JSON.parse(destinyText), logEntry };
  },

  generateRecurringSymbols: async (characterInfo, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.generateRecurringSymbols.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.generateRecurringSymbols.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { recurringSymbols: { type: "ARRAY", items: { type: "STRING" } } }, required: ["recurringSymbols"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const symbolsText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('generateRecurringSymbols', model, result.usageMetadata);
    if (!symbolsText) throw new Error("AI가 무의식의 상징을 반환하지 않았습니다.");
    return { data: JSON.parse(symbolsText), logEntry };
  },

  updatePersonalGoals: async (character, recentEvents, model) => {
    const payload = {
      contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.updatePersonalGoals.user(character, recentEvents) }] }],
      systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.updatePersonalGoals.system }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: { type: "OBJECT", properties: { primaryGoal: { type: "STRING" }, alternativeGoal: { type: "STRING" } }, required: ["primaryGoal", "alternativeGoal"] }
      }
    };
    const result = await geminiService._callGemini(payload, model);
    const goalsText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('updatePersonalGoals', model, result.usageMetadata);
    if (!goalsText) throw new Error("AI가 목표를 반환하지 않았습니다.");
    return { goals: JSON.parse(goalsText), logEntry };
  },

  reEvaluateCoreBeliefs: async (character, recentEvents, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.reEvaluateCoreBeliefs.user(character, recentEvents) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.reEvaluateCoreBeliefs.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { isChangeRecommended: { type: "BOOLEAN" }, reason: { type: "STRING" }, newProfile: { type: "OBJECT", properties: { formativeEvent: { type: "STRING" }, corePrinciple: { type: "STRING" }, coreDesire: { type: "STRING" } } } }, required: ["isChangeRecommended", "reason"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const proposalText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('reEvaluateCoreBeliefs', model, result.usageMetadata);
    if (!proposalText) throw new Error("AI가 재평가 제안을 반환하지 않았습니다.");
    return { proposal: JSON.parse(proposalText), logEntry };
  },

  deduceTime: async (playerAction, worldState, model) => {
    const payload = {
        contents: [{ role: 'user', parts: [{ text: PROMPT_TEMPLATES.deduceTime.user(playerAction, worldState) }] }],
        systemInstruction: { parts: [{ text: PROMPT_TEMPLATES.deduceTime.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: { type: "OBJECT", properties: { "elapsedMinutes": { "type": "NUMBER" }, "weather": { "type": "STRING" } }, required: ["elapsedMinutes", "weather"] }
        }
    };
    const result = await geminiService._callGemini(payload, model);
    const timeDataText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = geminiService._createLogEntry('deduceTime', model, result.usageMetadata);
    if (!timeDataText) {
        console.error("Time deduction failed: AI returned no text.");
        return { data: { elapsedMinutes: 5, weather: worldState.weather }, logEntry };
    }
    return { data: JSON.parse(timeDataText), logEntry };
  },
  
  generateResponse: async ({ characters, lorebook, aiSettings, worldState }, promptType, content, contextHistory, retrievedContext) => {
    const characterProfiles = characters.map(c => {
        const { vector, ...profile } = c;
        return profile;
    });

    const baseContext = `### 기본 설정 (Base Context)\n- 현재 시간: ${worldState.day}일차 ${worldState.hour}시 ${worldState.minute}분\n- 현재 날씨: ${worldState.weather}\n- 장르: ${lorebook.genre}\n- 세계관: ${lorebook.worldview}\n- 전체 플롯: ${lorebook.plot}\n- 등장인물 프로필: ${JSON.stringify(characterProfiles, null, 2)}`;
    
    const retrievedContextText = retrievedContext.length > 0
        ? `\n\n### 소환된 기억 (Retrieved Scenes)\n${retrievedContext.join('\n\n')}`
        : "";

    const userActionPrompt = USER_ACTION_PROMPTS[promptType]
      ? USER_ACTION_PROMPTS[promptType](content)
      : USER_ACTION_PROMPTS['send'](content);
    
    const apiHistory = contextHistory.map(msg => {
        if (msg.sender === 'player') {
            return { role: 'user', parts: [{ text: msg.text }] };
        } else {
            const modelText = JSON.stringify({ content: msg.content });
            return { role: 'model', parts: [{ text: modelText }] };
        }
    });

    const finalContents = [
        { role: 'user', parts: [{ text: `${baseContext}${retrievedContextText}` }] },
        { role: 'model', parts: [{ text: "알겠습니다. 모든 설정을 확인했습니다. 이제부터 이 규칙에 따라 이야기를 생성하겠습니다." }] },
        ...apiHistory,
        { role: 'user', parts: [{ text: userActionPrompt }] }
    ];

    const generationConfig = { 
      temperature: aiSettings.temperature, 
      topK: aiSettings.topK, 
      topP: aiSettings.topP, 
      maxOutputTokens: aiSettings.maxOutputTokens,
      responseMimeType: "application/json",
      responseSchema: {
          type: "OBJECT",
          properties: {
              ...(promptType === 'new_story' && { title: { type: "STRING" } }),
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
          required: ["content"]
      }
    };

    const payload = { 
      contents: finalContents, 
      systemInstruction: { parts: [{ text: aiSettings.systemInstruction }] }, 
      generationConfig,
    };

    const result = await geminiService._callGemini(payload, aiSettings.mainModel);
    const resultText = result.candidates[0].content?.parts?.[0]?.text || "";
    const logEntry = geminiService._createLogEntry('generateResponse', aiSettings.mainModel, result.usageMetadata);
    
    const parsedResult = JSON.parse(resultText);
    return { data: parsedResult, logEntry };
  }
};
