/**
 * 중첩된 객체의 상태를 불변성을 유지하며 업데이트하는 유틸리티 함수.
 * 경로 문자열(예: 'a.b.c')을 받아 해당 위치의 값을 변경합니다.
 * [PD NOTE] 기존의 JSON.stringify 방식은 잠재적 버그가 있어,
 * 불변성을 유지하며 각 레벨을 복사하는 방식으로 재작성했습니다.
 * @param {string} path - 업데이트할 속성의 경로 (점(.)으로 구분).
 * @param {any} value - 새로 설정할 값.
 * @returns {function(object): object} - 이전 상태를 받아 새로운 상태를 반환하는 함수.
 */
export const updateNestedState = (path, value) => (prevState) => {
    const keys = path.split('.');
    // 최상위 객체를 얕게 복사하여 불변성을 유지합니다.
    const newState = { ...prevState };
    let current = newState;

    // 마지막 키를 제외한 경로를 따라가며, 각 단계의 객체를 얕게 복사합니다.
    // 이는 원본 상태의 다른 부분에 영향을 주지 않기 위함입니다.
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        // 기존 객체를 복사하거나, 경로가 없으면 새 객체를 만듭니다.
        current[key] = { ...(current[key] || {}) };
        current = current[key];
    }

    // 마지막 키에 새로운 값을 할당합니다.
    current[keys[keys.length - 1]] = value;
    
    return newState;
};
