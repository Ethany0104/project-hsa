// src/components/isc/logic/damageCalculator.js

/**
 * 기본 전투 데미지를 계산하는 로직 스크립트입니다.
 * (공격력 - 방어력)을 기본 데미지로 하며, 치명타 여부에 따라 1.5배 보너스를 적용합니다.
 * @param {object} params - 계산에 필요한 파라미터 객체
 * @param {number} params.attackerPower - 공격자의 공격력
 * @param {number} params.defenderDefense - 방어자의 방어력
 * @param {boolean} params.isCritical - 치명타 여부
 * @returns {object} - 계산 결과. { damageDealt, isFatal }
 */
export const calculateDamage = (params) => {
  const {
    attackerPower = 10,
    defenderDefense = 5,
    isCritical = false
  } = params;

  // 기본 데미지 계산 (최소 1의 피해는 보장)
  let baseDamage = Math.max(1, attackerPower - defenderDefense);

  // 치명타 보너스 적용
  if (isCritical) {
    baseDamage = Math.floor(baseDamage * 1.5);
  }

  // isFatal은 이 함수에서 결정하기 어려우므로, 일단 false로 고정합니다.
  // 추후 방어자의 현재 체력을 파라미터로 받아 계산할 수 있습니다.
  const isFatal = false; 

  return {
    damageDealt: baseDamage,
    isFatal: isFatal,
  };
};
