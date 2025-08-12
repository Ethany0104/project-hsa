// src/components/isc/components/ChoiceSelector.js
import React from 'react';
import { ICONS } from '../../constants';

/**
 * 사용자에게 여러 선택지를 제시하고, 그 중 하나를 선택하게 하는 인터랙티브 컴포넌트입니다.
 * @param {object} props - { data, onAction }
 * @param {object} props.data - AI가 보낸 데이터. { title, description, choices }
 * @param {function} props.onAction - 선택 결과를 상위로 전달하는 콜백 함수
 */
const ChoiceSelector = ({ data, onAction }) => {
  // --- 데이터 추출 및 기본값 설정 ---
  const {
    title = "선택의 시간",
    description = "어떤 길을 선택하시겠습니까?",
    choices = [] // choices는 { id: string, label: string } 형태의 객체 배열
  } = data;

  // --- 이벤트 핸들러 ---
  /**
   * 사용자가 선택지를 클릭했을 때 호출됩니다.
   * @param {string} choiceId - 선택된 choice의 고유 ID
   */
  const handleSelectChoice = (choiceId) => {
    onAction('choiceSelected', {
      choiceId: choiceId,
    });
  };

  // --- 렌더링 로직 ---
  return (
    <div className="my-8 animate-fadeIn">
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl shadow-lg w-full max-w-2xl mx-auto p-6 font-sans">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-purple-400">{title}</h2>
          {description && <p className="text-gray-400 mt-2">{description}</p>}
        </div>
        <div className="space-y-3">
          {choices.map((choice) => (
            <button
              key={choice.id}
              onClick={() => handleSelectChoice(choice.id)}
              className="w-full px-6 py-4 bg-gray-700 text-white text-lg rounded-lg hover:bg-purple-600 hover:shadow-lg hover:shadow-purple-900/50 transition-all duration-200 ease-in-out text-left flex items-center group"
            >
              <ICONS.LucideChevronRight className="w-5 h-5 mr-4 text-purple-400 transition-transform duration-200 group-hover:translate-x-1" />
              <span>{choice.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChoiceSelector;
