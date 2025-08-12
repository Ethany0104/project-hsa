// src/components/isc/ISCRenderer.js
import React from 'react';

// --- [FIX] 비어있던 내장 UI 컴포넌트들을 모두 import 합니다. ---
import StatCheckModal from './StatCheckModal';
import ChoiceSelector from './ChoiceSelector';
import InventoryCard from './InventoryCard';
import RelationshipMap from './RelationshipMap';
import LoreUnlockToast from './LoreUnlockToast';

/**
 * AI가 보낸 componentSpec을 기반으로 적절한 인터랙티브 UI 컴포넌트를 렌더링하는 총괄 관리자입니다.
 * 이 컴포넌트는 AI의 JSON 출력을 실제 React 컴포넌트로 변환하는 '교통 정리' 역할을 수행합니다.
 * @param {object} props - { spec, onAction }
 * @param {object} props.spec - AI가 보낸 컴포넌트 명세 (component, data 포함)
 * @param {function} props.onAction - 컴포넌트 내에서 발생한 사용자 액션을 상위로 전달하는 콜백 함수
 */
const ISCRenderer = ({ spec, onAction }) => {
  // componentSpec이 없거나 component 이름이 없으면 렌더링하지 않고 오류를 기록합니다.
  if (!spec || !spec.component) {
    console.error("ISCRenderer: 유효하지 않은 componentSpec입니다.", spec);
    return <div className="text-red-500 p-4">[ISC 렌더링 오류: 잘못된 명세가 전달되었습니다.]</div>;
  }

  // 'builtin:' 접두사를 기준으로 컴포넌트 이름을 추출합니다.
  const componentName = spec.component.replace('builtin:', '');
  const componentData = spec.data || {};

  // --- [FIX] 컴포넌트 이름에 따라 자리표시자가 아닌, 실제 컴포넌트를 렌더링하도록 수정합니다. ---
  switch (componentName) {
    case 'StatCheckModal':
      return <StatCheckModal data={componentData} onAction={onAction} />;

    case 'ChoiceSelector':
      return <ChoiceSelector data={componentData} onAction={onAction} />;

    case 'InventoryCard':
      return <InventoryCard data={componentData} onAction={onAction} />;

    case 'RelationshipMap':
      return <RelationshipMap data={componentData} onAction={onAction} />;

    case 'LoreUnlockToast':
      return <LoreUnlockToast data={componentData} onAction={onAction} />;

    // --- 정의되지 않은 컴포넌트에 대한 처리 ---
    default:
      console.warn(`ISCRenderer: 알 수 없는 컴포넌트 타입입니다: ${componentName}`);
      return <div className="p-4 bg-yellow-900/50 border border-yellow-700 rounded-lg">[ISC 경고: 알 수 없는 컴포넌트 '{componentName}']</div>;
  }
};

export default ISCRenderer;
