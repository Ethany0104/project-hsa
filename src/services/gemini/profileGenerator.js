import { callGeminiApi, createApiLogEntry } from './geminiApi';
import { PROMPT_TEMPLATES } from '../../constants/prompts';

const generateProfileData = async (profileType, characterInfo, model) => {
    const templateKey = `generate${profileType}`;
    const promptTemplate = PROMPT_TEMPLATES[templateKey];
    if (!promptTemplate) {
        throw new Error(`${profileType}에 대한 프롬프트 템플릿을 찾을 수 없습니다.`);
    }

    const payload = {
        contents: [{ role: 'user', parts: [{ text: promptTemplate.user(characterInfo) }] }],
        systemInstruction: { parts: [{ text: promptTemplate.system }] },
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: promptTemplate.schema,
        }
    };

    const result = await callGeminiApi(payload, model);
    const profileText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    const logEntry = createApiLogEntry(templateKey, model, result.usageMetadata);

    if (!profileText) {
        throw new Error(`AI가 ${profileType} 텍스트를 반환하지 않았습니다.`);
    }
    return { data: JSON.parse(profileText), logEntry };
};

export const generateNarrativeProfile = (charInfo, model) => generateProfileData('NarrativeProfile', charInfo, model);
export const generateRoleplayGuide = (charInfo, model) => generateProfileData('RoleplayGuide', charInfo, model);
export const generateBig5Profile = (charInfo, model) => generateProfileData('Big5Profile', charInfo, model);
export const generateLifestyle = (charInfo, model) => generateProfileData('Lifestyle', charInfo, model);
export const generatePsyche = (charInfo, model) => generateProfileData('Psyche', charInfo, model);
export const generateLibido = (charInfo, model) => generateProfileData('Libido', charInfo, model);
export const generateSpace = (charInfo, model) => generateProfileData('Space', charInfo, model);
export const generateDailySchedule = (charInfo, model) => generateProfileData('DailySchedule', charInfo, model);
export const generateEmotionProfile = (charInfo, model) => generateProfileData('EmotionProfile', charInfo, model);
