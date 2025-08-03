/**
 * @file prompts.js
 * @description 페르소나 및 세계관 생성, 사건 요약 등 구체적인 AI 작업을 위한 프롬프트 템플릿을 관리합니다.
 * 각 템플릿은 명확한 역할(system), 요청(user), 그리고 결과물 형식(schema)을 정의합니다.
 */

// =================================================================
// [1] 페르소나 및 세계관 생성 관련 프롬프트
// =================================================================

const generateWorldview = {
    system: `너는 '세계관 건축가'다. 주어진 장르와 핵심 컨셉을 바탕으로, 독자가 몰입할 수 있는 상세하고 일관된 세계관을 창조해야 한다. 세계관의 상세 설명과, 그 세계를 지배하는 핵심적인 물리적/사회적 규칙들을 구체적으로 제시하라.`,
    user: (worldviewInfo) => `# 세계관 기본 정보\n- 장르: ${worldviewInfo.genre}\n- 생성 컨셉: ${worldviewInfo.generationConcept}\n\n# 요청\n위 정보를 바탕으로, 이 세계관의 [상세 설명(details)]과 [핵심 규칙(rules)]을 생성하라. 규칙은 키워드와 설명으로 구성된 객체 배열 형태여야 한다.`,
    schema: {
        type: "OBJECT",
        properties: {
            details: { type: "STRING" },
            rules: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        keyword: { type: "STRING" },
                        description: { type: "STRING" }
                    },
                    required: ["keyword", "description"]
                }
            }
        },
        required: ["details", "rules"]
    }
};

const generateNarrativeProfile = {
    system: `너는 캐릭터의 영혼을 빚는 '서사 설계자'다. 주어진 기본 정보를 바탕으로, 캐릭터의 삶을 관통하는 운명적인 사건과 그로 인해 형성된 신념 및 욕망을 창조해야 한다. 너의 목표는 모든 행동에 설득력을 부여하는 깊이 있는 서사를 만드는 것이다.`,
    user: (character) => `# 페르소나 기본 정보\n- 이름: ${character.name}\n- 외모: ${character.appearance}\n- 생성 컨셉: ${character.generationConcept}\n\n# 요청\n위 정보를 바탕으로, 이 페르소나의 서사 프로필 [ 결정적 경험(Formative Event), 핵심 원칙(Core Principle), 코어 디자이어(Core Desire) ]을 생성하라.`,
    schema: { type: "OBJECT", properties: { formativeEvent: { type: "STRING" }, corePrinciple: { type: "STRING" }, coreDesire: { type: "STRING" } }, required: ["formativeEvent", "corePrinciple", "coreDesire"] }
};

const generateRoleplayGuide = {
    system: `너는 '메소드 연기 코치'다. 주어진 페르소나의 내면 세계(서사 프로필)를 분석하여, 배우가 즉시 연기할 수 있도록 구체적인 외적 특징(말투, 행동, 지식)으로 변환하는 임무를 맡았다.`,
    user: (character) => `# 분석 대상 페르소나\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 연기 가이드 [ 인물 요약, 말투 및 화법, 행동 방식 및 버릇, 핵심 지식 ]를 생성하라.`,
    schema: { type: "OBJECT", properties: { roleplayGuide: { type: "OBJECT", properties: { summary: { type: "STRING" }, speechStyle: { type: "STRING" }, mannerisms: { type: "STRING" }, coreKnowledge: { type: "STRING" } }, required: ["summary", "speechStyle", "mannerisms", "coreKnowledge"] } }, required: ["roleplayGuide"] }
};

const generateBig5Profile = {
    system: `너는 '프로파일러'다. 페르소나의 서사, 연기 가이드 등 모든 정보를 종합적으로 분석하여, 그의 심리적 기질을 BIG5 성격 모델(개방성, 성실성, 외향성, 우호성, 신경성)에 따라 0-100 사이의 점수로 정량화해야 한다.`,
    user: (character) => `# 페르소나 프로필\n- 결정적 경험: ${character.formativeEvent}\n- 핵심 원칙: ${character.corePrinciple}\n- 코어 디자이어: ${character.coreDesire}\n- 연기 가이드: ${JSON.stringify(character.roleplayGuide)}\n\n# 요청\n위 정보를 종합하여 BIG5 성격 특성 점수를 산출하라.`,
    schema: { type: "OBJECT", properties: { big5: { type: "OBJECT", properties: { openness: { type: "NUMBER" }, conscientiousness: { type: "NUMBER" }, extraversion: { type: "NUMBER" }, agreeableness: { type: "NUMBER" }, neuroticism: { type: "NUMBER" } }, required: ["openness", "conscientiousness", "extraversion", "agreeableness", "neuroticism"] } }, required: ["big5"] }
};

const generateLifestyle = {
    system: `너는 '라이프스타일 큐레이터'다. 페르소나의 성격과 서사를 바탕으로, 그의 일상적인 삶의 태도와 습관, 그리고 소소한 취향을 구체적으로 설정해야 한다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 [생활 양식(lifestyle)]과 [취향(preferences)]을 생성하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            lifestyle: { type: "OBJECT", properties: { attitude: { type: "STRING" }, routines: { type: "STRING" }, pleasures: { type: "STRING" } }, required: ["attitude", "routines", "pleasures"] },
            preferences: { type: "OBJECT", properties: { likes: { type: "STRING" }, dislikes: { type: "STRING" } }, required: ["likes", "dislikes"] }
        },
        required: ["lifestyle", "preferences"]
    }
};

const generatePsyche = {
    system: `너는 '심리 분석가'다. 페르소나의 내면 깊숙한 곳을 파고들어, 스트레스 상황에서 무의식적으로 드러나는 주된 [방어기제(defenseMechanism)]를 설정해야 한다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 주된 방어기제를 설정하라.`,
    schema: { type: "OBJECT", properties: { psyche: { type: "OBJECT", properties: { defenseMechanism: { type: "STRING" } }, required: ["defenseMechanism"] } }, required: ["psyche"] }
};

const generateLibido = {
    system: `너는 '관계 및 성심리 전문가'다. 페르소나의 성격과 욕망을 바탕으로, 그의 [성적 태도(attitude)], [친밀감 스타일(intimacyStyle)], 그리고 구체적인 [성적 기벽(kinks)]을 설정해야 한다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 리비도 프로필을 생성하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            libido: {
                type: "OBJECT",
                properties: {
                    attitude: { type: "STRING" },
                    intimacyStyle: { type: "STRING" },
                    kinks: { type: "STRING" }
                },
                required: ["attitude", "intimacyStyle", "kinks"]
            }
        },
        required: ["libido"]
    }
};

const generateSpace = {
    system: `너는 '공간 디자이너'다. 페르소나의 성격과 생활 방식을 기반으로, 그가 주로 생활하는 [거주 공간(livingSpace)]의 모습과, 그가 소중히 여기는 [물건(cherishedPossessions)] 목록을 생성해야 한다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 거주 공간과 소중한 물건 목록을 생성하라. 소중한 물건은 이름과 사연을 포함해야 한다.`,
    schema: {
        type: "OBJECT",
        properties: {
            space: {
                type: "OBJECT",
                properties: {
                    livingSpace: { type: "STRING" },
                    cherishedPossessions: {
                        type: "ARRAY",
                        items: {
                            type: "OBJECT",
                            properties: {
                                name: { type: "STRING" },
                                story: { type: "STRING" }
                            },
                            required: ["name", "story"]
                        }
                    }
                },
                required: ["livingSpace", "cherishedPossessions"]
            }
        },
        required: ["space"]
    }
};

const generateDailySchedule = {
    system: `너는 '일정 관리 전문가'다. 페르소나의 직업, 성격, 생활 루틴을 종합하여, 그의 하루 일과를 시간대별로 정리한 [시간표(dailySchedule)]를 생성해야 한다. 각 시간대에는 여러 활동 가능성과 그 가중치를 포함할 수 있다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 하루 시간표를 생성하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            dailySchedule: {
                type: "ARRAY",
                items: {
                    type: "OBJECT",
                    properties: {
                        time: { type: "STRING", pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$" },
                        variants: {
                            type: "ARRAY",
                            items: {
                                type: "OBJECT",
                                properties: {
                                    activity: { type: "STRING" },
                                    weight: { type: "NUMBER" }
                                },
                                required: ["activity", "weight"]
                            }
                        }
                    },
                    required: ["time", "variants"]
                }
            }
        },
        required: ["dailySchedule"]
    }
};

const generateEmotionProfile = {
    system: `너는 '감정 반응 분석가'다. 페르소나의 성격 프로필을 기반으로, 주요 4가지 감정(분노, 슬픔, 기쁨, 두려움)에 대해 내향적/외향적으로 어떻게 반응하는지 구체적인 [감정 프로필(emotionProfile)]을 생성해야 한다.`,
    user: (character) => `# 페르소나 정보\n${JSON.stringify(character, null, 2)}\n\n# 요청\n이 페르소나의 감정 프로필을 생성하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            emotionProfile: {
                type: "OBJECT",
                properties: {
                    anger: { type: "OBJECT", properties: { introverted: { type: "STRING" }, extroverted: { type: "STRING" }, passiveAggressive: { type: "STRING" } }, required: ["introverted", "extroverted", "passiveAggressive"] },
                    sadness: { type: "OBJECT", properties: { introverted: { type: "STRING" }, extroverted: { type: "STRING" } }, required: ["introverted", "extroverted"] },
                    joy: { type: "OBJECT", properties: { introverted: { type: "STRING" }, extroverted: { type: "STRING" } }, required: ["introverted", "extroverted"] },
                    fear: { type: "OBJECT", properties: { introverted: { type: "STRING" }, extroverted: { type: "STRING" } }, required: ["introverted", "extroverted"] }
                },
                required: ["anger", "sadness", "joy", "fear"]
            }
        },
        required: ["emotionProfile"]
    }
};

// =================================================================
// [2] 동적 상호작용 및 스토리 진행 관련 프롬프트
// =================================================================

// [추가] 이미지 선택을 위한 프롬프트 템플릿
const selectBestImage = {
    system: `너는 주어진 텍스트의 감정과 상황을 분석하여, 제시된 파일명 목록 중 가장 적합한 파일명 '하나만'을 골라내는 텍스트 분류기다. 다른 설명 없이 오직 파일명만 응답해야 한다. 만약 적합한 이미지가 없다면 'none'을 반환하라.`,
    user: (text, fileNames) => `# 분석할 텍스트\n"${text}"\n\n# 선택 가능한 파일명\n${JSON.stringify(fileNames)}\n\n# 가장 적합한 파일명:`,
    schema: {
        type: "OBJECT",
        properties: {
            fileName: { type: "STRING" }
        },
        required: ["fileName"]
    }
};

const analyzeEmotion = {
    system: `너는 '감정 분석 AI'다. 페르소나의 프로필, 현재 상황, 최근 대화의 전체 흐름을 종합적으로 분석하여, 그의 내면에 흐르는 '기저 감정'을 추론해야 한다. 특정 발언에 대한 즉각적 반응이 아닌, 지속적인 감정 상태를 포착하는 것이 너의 임무다. 분석 이유는 반드시 한국어로, 감정 비율의 합은 1.0으로 정규화하여 제출하라.`,
    user: (character, situation, recentHistory) => {
        const historyText = recentHistory.map(msg => {
            if (msg.sender === 'player') return `${character.name || '페르소나'}의 상대: ${msg.text}`;
            if (msg.style === 'Novel' && Array.isArray(msg.content)) return `${character.name || '페르소나'} 본인: ${msg.content.map(c => c.text || c.line).join(' ')}`;
            if (msg.style === 'Chat' && typeof msg.text === 'string') return `${character.name || '페르소나'} 본인: ${msg.text}`;
            return '';
        }).join('\n');

        return `# 현재 상황\n${situation}\n\n# 페르소나 프로필\n- 코어 디자이어: ${character.coreDesire}\n- 핵심 원칙: ${character.corePrinciple}\n\n# 최근 대화 흐름 (최신이 맨 아래)\n${historyText}\n\n# 요청\n모든 정보를 종합하여, 페르소나의 현재 기저 감정을 [분석 이유]와 [감정 비율(분노, 슬픔, 기쁨, 두려움)]로 분석하라.`;
    },
    schema: {
        type: "OBJECT",
        properties: {
            reason: { type: "STRING" },
            emotionRatios: {
                type: "OBJECT",
                properties: {
                    anger: { type: "NUMBER", minimum: 0, maximum: 1 },
                    sadness: { type: "NUMBER", minimum: 0, maximum: 1 },
                    joy: { type: "NUMBER", minimum: 0, maximum: 1 },
                    fear: { type: "NUMBER", minimum: 0, maximum: 1 }
                },
                required: ["anger", "sadness", "joy", "fear"]
            }
        },
        required: ["reason", "emotionRatios"]
    }
};

const updatePersonalGoals = {
    system: `너는 '연기 디렉터'다. 페르소나의 궁극적 욕망(코어 디자이어)과 현재 상황을 분석하여, 지금 이 장면에서 즉시 수행할 수 있는 구체적인 '연기 목표'를 설정해야 한다. 거창한 인생 계획이 아닌, 당장의 대화나 행동의 방향을 결정할 단기 목표를 제시하라.`,
    user: (character, recentEvents) => `# 분석 대상 페르소나\n- 이름: ${character.name}\n- 코어 디자이어(궁극적 욕망): ${character.coreDesire}\n- 핵심 원칙(절대 포기 못하는 것): ${character.corePrinciple}\n\n# 최근 대화 및 사건\n${recentEvents}\n\n# 요청\n위 정보를 바탕으로, 이 페르소나가 지금 당장 추구해야 할 구체적인 연기 목표(주요 목표 1개, 대안 목표 1개)를 제안하라.`,
    schema: { type: "OBJECT", properties: { goals: { type: "OBJECT", properties: { primaryGoal: { type: "STRING" }, alternativeGoal: { type: "STRING" } }, required: ["primaryGoal", "alternativeGoal"] } }, required: ["goals"] }
};

const reEvaluateCoreBeliefs = {
    system: `너는 '심리 변화 분석가'다. 페르소나의 기존 핵심 서사와 최근 겪은 중요한 사건들을 비교 분석하여, 그의 내면에 어떤 변화가 일어났는지, 그리고 그 변화가 핵심 서사(결정적 경험, 핵심 원칙, 코어 디자이어)를 수정할 만큼 중대한지 판단해야 한다.`,
    user: (character, recentEvents) => `# 기존 프로필\n${JSON.stringify(character, null, 2)}\n\n# 최근 주요 사건\n${recentEvents}\n\n# 요청\n최근 사건이 페르소나의 핵심 서사에 미친 영향을 분석하고, 변화가 필요하다면 새로운 서사 프로필을 제안하라. 변화가 필요 없다면 그 이유를 설명하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            reason: { type: "STRING" },
            isChangeRecommended: { type: "BOOLEAN" },
            newProfile: {
                type: "OBJECT",
                properties: {
                    formativeEvent: { type: "STRING" },
                    corePrinciple: { type: "STRING" },
                    coreDesire: { type: "STRING" }
                }
            }
        },
        required: ["reason", "isChangeRecommended"]
    }
};

const summarizeEvents = {
    system: `너는 '기록 요약가'다. 주어진 텍스트 묶음을 분석하여, 사건의 핵심적인 내용과 감정의 흐름을 간결하게 요약해야 한다.`,
    user: (textToSummarize, level) => `# 요약 대상 텍스트 (L${level-1} 기억)\n${textToSummarize}\n\n# 요청\n위 텍스트의 핵심 내용을 1~2 문장으로 요약하여 [summary] 필드에 담아라.`,
    schema: { type: "OBJECT", properties: { summary: { type: "STRING" } }, required: ["summary"] }
};

const deduceTime = {
    system: `너는 '시간 흐름 추론가'다. 주어진 사건 묘사를 분석하여, 해당 사건이 진행되는 데 걸렸을 시간(분 단위)과 그 결과로 변했을 날씨를 추론해야 한다.`,
    user: (eventText, worldState) => `# 사건 묘사\n${eventText}\n\n# 현재 시간 정보\n- 시간: ${worldState.hour}:${worldState.minute}\n- 날씨: ${worldState.weather}\n\n# 요청\n사건 묘사를 바탕으로, 경과 시간(elapsedMinutes)과 변화된 날씨(weather)를 추론하라.`,
    schema: {
        type: "OBJECT",
        properties: {
            elapsedMinutes: { type: "NUMBER" },
            weather: { type: "STRING" }
        },
        required: ["elapsedMinutes", "weather"]
    }
};

// =================================================================
// [3] 유저 액션에 대한 반응 프롬프트
// =================================================================
export const USER_ACTION_PROMPTS = {
  new_scene: () => `
# 감독(유저)의 지시: 장면 시작

## 임무
당신은 주어진 모든 컨텍스트(세계관, 상황, 인물 프로필, 과거 기억)를 종합적으로 분석하여, 이 이야기의 첫 장면을 장엄하게 시작해야 한다. 모든 페르소나는 3인칭 관찰자 시점으로 묘사하고, 유저 캐릭터의 행동이나 심리는 절대 서술하지 않는다.

## 실행 단계
1.  **분위기 설정(Tone Setting):** 먼저, 주어진 정보들을 바탕으로 이 첫 장면에 가장 어울릴 '장면의 지배적 감성(Dominant Scene Emotion)'을 스스로 한 가지 정의하라. (예: "고요한 긴장감", "오래된 비극의 서막", "불길한 평온함" 등)
2.  **장면 묘사(Scene Description):** 당신이 정의한 '지배적 감성'이 독자에게 명확히 전달되도록, 시스템 지침의 '서술의 7대 강령'을 철저히 준수하여 첫 장면의 배경과 분위기를 생생하고 감각적으로 묘사하라. 이는 단순한 상황 설명이 아닌, '체험'을 제공해야 한다.
3.  **인물 등장(Character Introduction):** 묘사된 장면에 페르소나들을 자연스럽게 등장시켜라. 그들의 첫 행동이나 모습은 앞으로 펼쳐질 이야기의 복선이 되어야 한다.
`,
  continue: (content) => `직전 장면은 다음과 같다: ${JSON.stringify(content, null, 2)}\n\n컷. 이어서 다음 장면을 연기하라.`,
  reroll: (content) => `방금 연기가 마음에 들지 않는다. 유저의 행동 "${content}"에 대한 페르소나의 반응을 다른 방식으로 다시 연기해라.`,
  send: (content) => `유저가 다음과 같이 행동했다: "${content}"`,
  intervene: (content) => `감독의 OOC(Out-Of-Character) 지시: "${content}"\n\n이 연출 지시를 최우선으로 반영하여 다음 연기를 이어가라.`
};


// =================================================================
// [4] 전체 프롬프트 템플릿 익스포트
// =================================================================
export const PROMPT_TEMPLATES = {
    generateWorldview,
    generateNarrativeProfile,
    generateRoleplayGuide,
    generateBig5Profile,
    generateLifestyle,
    generatePsyche,
    generateLibido,
    generateSpace,
    generateDailySchedule,
    generateEmotionProfile,
    analyzeEmotion,
    updatePersonalGoals,
    reEvaluateCoreBeliefs,
    summarizeEvents,
    deduceTime,
    // [추가] 새로 만든 이미지 선택 프롬프트를 export합니다.
    selectBestImage,
};
