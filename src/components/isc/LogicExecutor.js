// src/components/isc/LogicExecutor.js
import { useEffect } from 'react';

// --- [FIX] 주석 처리된 내장 로직 스크립트들을 모두 import 합니다. ---
import { calculateDamage } from './logic/damageCalculator';
import { randomLootGenerator } from './logic/lootGenerator';
import { updateRelationship } from './logic/relationshipManager';

/**
 * AI가 요청한 로직 스크립트를 안전하게 실행하고 결과를 반환하는 총괄 관리자입니다.
 * 이 컴포넌트는 UI를 렌더링하지 않으며, 오직 로직 처리만을 담당합니다.
 * @param {object} props - { spec, onComplete }
 * @param {object} props.spec - AI가 보낸 로직 실행 명세 (script, params 포함)
 * @param {function} props.onComplete - 로직 실행 완료 후 결과를 상위로 전달하는 콜백 함수
 */
const LogicExecutor = ({ spec, onComplete }) => {
  useEffect(() => {
    if (!spec || !spec.script) {
      console.error("LogicExecutor: 유효하지 않은 spec입니다.", spec);
      return;
    }

    const scriptName = spec.script.replace('builtin:', '');
    const params = spec.params || {};
    let result;

    try {
      // --- [FIX] switch 문에서 자리표시자 대신 실제 로직 함수를 호출하도록 수정합니다. ---
      switch (scriptName) {
        case 'calculateDamage':
          result = calculateDamage(params);
          break;
        
        case 'randomLootGenerator':
          result = randomLootGenerator(params);
          break;

        case 'updateRelationship':
          result = updateRelationship(params);
          break;

        default:
          throw new Error(`알 수 없는 스크립트 타입입니다: ${scriptName}`);
      }

      // 실행 결과를 상위 컴포넌트로 전달
      onComplete({
        type: 'logicResult',
        script: spec.script,
        result: result
      });

    } catch (error) {
      console.error(`LogicExecutor: 스크립트 '${scriptName}' 실행 중 오류 발생`, error);
      onComplete({
        type: 'logicResult',
        script: spec.script,
        result: { error: error.message }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spec]); // spec이 변경될 때만 실행

  // 이 컴포넌트는 UI를 렌더링하지 않습니다.
  return null;
};

export default LogicExecutor;
