/**
 * ANIMA 캐릭터 객체를 RisuAI 카드 JSON 포맷으로 변환하는 함수
 * RisuAI v3 카드 명세서를 기반으로 작성되었습니다.
 * @param {object} animaChar - ANIMA의 캐릭터 객체
 * @returns {object | null} RisuAI 카드 규격에 맞는 JSON 객체
 */
export const convertAnimaToRisu = (animaChar) => {
    if (!animaChar) return null;

    // ANIMA의 상세한 프로필을 RisuAI의 'description' 필드에 맞게 조합합니다.
    const descriptionParts = [];
    if (animaChar.appearance) descriptionParts.push(`[외형]\n${animaChar.appearance}`);
    if (animaChar.note) descriptionParts.push(`\n\n[노트]\n${animaChar.note}`);
    if (animaChar.formativeEvent) descriptionParts.push(`\n\n[결정적 경험]\n${animaChar.formativeEvent}`);
    if (animaChar.corePrinciple) descriptionParts.push(`\n\n[핵심 원칙]\n${animaChar.corePrinciple}`);
    if (animaChar.coreDesire) descriptionParts.push(`\n\n[코어 디자이어]\n${animaChar.coreDesire}`);
    
    // ANIMA의 BIG5 성격 모델을 RisuAI의 'personality' 필드에 맞게 요약합니다.
    let personality = '';
    if (animaChar.big5) {
        const { openness, conscientiousness, extraversion, agreeableness, neuroticism } = animaChar.big5;
        personality = `개방성: ${openness}, 성실성: ${conscientiousness}, 외향성: ${extraversion}, 우호성: ${agreeableness}, 신경성: ${neuroticism}`;
    }

    // RisuAI v3 카드 명세서에 따라 데이터 구조를 생성합니다.
    const risuCardData = {
      spec: 'chara_card_v3',
      spec_version: '3.0',
      data: {
        name: animaChar.name || '',
        description: descriptionParts.join('').trim(),
        personality: personality,
        scenario: animaChar.scenario || '',
        first_mes: animaChar.firstMessage || `안녕, ${animaChar.name}(이)야.`,
        mes_example: animaChar.innerShadow?.speechPatterns ? `<START>\n${animaChar.innerShadow.speechPatterns}\n<END>` : '',
        
        // RisuAI의 표준 필드에 맞춰 추가 데이터를 매핑합니다.
        creator_notes: animaChar.creatorNotes || 'Generated from ANIMA Story Studio',
        system_prompt: animaChar.systemPrompt || '', // 시스템 프롬프트 추가
        post_history_instructions: animaChar.postHistoryInstructions || '', // 후처리 지시문 추가
        tags: animaChar.tags || [],
        creator: animaChar.creator || '',
        character_version: animaChar.character_version || '1.0',
        
        // RisuAI가 요구하는 extensions.risuai 객체를 추가합니다.
        extensions: {
            risuai: {
                // 이 안에는 RisuAI 전용 추가 데이터를 넣을 수 있습니다.
                // 지금은 ANIMA의 고유 데이터를 보존하는 용도로 사용합니다.
                anima_metadata: {
                    id: animaChar.id,
                    thematicArc: animaChar.thematicArc,
                    tragicFlaw: animaChar.tragicFlaw,
                    relationships: animaChar.relationships,
                    goals: animaChar.goals,
                    subconscious: animaChar.subconscious,
                }
            }
        }
      }
    };

    return risuCardData;
};
