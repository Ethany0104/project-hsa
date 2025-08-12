// src/components/isc/logic/relationshipManager.js

/**
 * 두 인물 간의 관계 수치를 변경하는 로직 스크립트입니다.
 * @param {object} params - 계산에 필요한 파라미터 객체
 * @param {string} params.characterId - 관계 변화의 주체 ID
 * @param {string} params.targetId - 관계 변화의 대상 ID
 * @param {number} params.changeAmount - 관계 수치 변화량 (예: 10, -5)
 * @param {string} params.reason - 관계 변화의 원인이 된 사건
 * @returns {object} - 관계 변화 결과. { characterId, targetId, changeAmount, reason }
 */
export const updateRelationship = (params) => {
  const {
    characterId,
    targetId,
    changeAmount = 0,
    reason = "알 수 없는 이유"
  } = params;

  if (!characterId || !targetId) {
    return { error: "관계 변화의 주체(characterId)와 대상(targetId)이 모두 필요합니다." };
  }

  // 이 스크립트는 실제 캐릭터 데이터베이스를 직접 수정하지 않습니다.
  // 대신, 어떤 관계가 어떻게 변해야 하는지에 대한 '명령'을 생성하여 반환합니다.
  // 이 결과를 받은 상위 로직(예: useStoryGeneration 훅)이
  // 실제 캐릭터 상태(state)를 업데이트하는 책임을 집니다.
  
  console.log(`[Logic] 관계 변화: ${characterId} -> ${targetId} (${changeAmount > 0 ? '+' : ''}${changeAmount}) 이유: ${reason}`);

  return {
    characterId,
    targetId,
    changeAmount,
    reason
  };
};
