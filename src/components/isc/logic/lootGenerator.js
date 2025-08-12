// src/components/isc/logic/lootGenerator.js

/**
 * 주어진 아이템 테이블과 확률 가중치에 따라 랜덤 아이템 1개를 생성하는 로직 스크립트입니다.
 * @param {object} params - 계산에 필요한 파라미터 객체
 * @param {Array<object>} params.itemTable - 아이템 목록. 각 아이템은 { id, name, weight }를 포함해야 합니다.
 * @returns {object} - 선택된 아이템 객체. { acquiredItem: { id, name } }
 */
export const randomLootGenerator = (params) => {
  const {
    itemTable = []
  } = params;

  if (itemTable.length === 0) {
    return { acquiredItem: null, error: "아이템 테이블이 비어있습니다." };
  }

  // 모든 아이템의 가중치(weight) 합계를 계산합니다.
  const totalWeight = itemTable.reduce((sum, item) => sum + (item.weight || 0), 0);
  if (totalWeight <= 0) {
    return { acquiredItem: null, error: "아이템 테이블의 총 가중치가 0 이하입니다." };
  }

  // 0과 총 가중치 사이의 랜덤 숫자를 선택합니다.
  const randomValue = Math.random() * totalWeight;

  let weightSum = 0;
  for (const item of itemTable) {
    weightSum += item.weight || 0;
    if (randomValue <= weightSum) {
      // 선택된 아이템의 핵심 정보만 반환합니다.
      return {
        acquiredItem: {
          id: item.id,
          name: item.name
        }
      };
    }
  }

  // 만약의 경우(부동 소수점 오류 등)를 대비해 마지막 아이템을 반환합니다.
  const lastItem = itemTable[itemTable.length - 1];
  return {
    acquiredItem: {
      id: lastItem.id,
      name: lastItem.name
    }
  };
};
