// src/components/isc/StatCheckModal.js
import React, { useState, useEffect } from 'react';
// --- [FIX] ../../../constants -> ../../constants 경로를 수정합니다. ---
import { ICONS } from '../../constants';

/**
 * TRPG 스타일의 능력치 판정(Stat Check)을 수행하는 인터랙티브 모달 컴포넌트입니다.
 * 주사위 굴림 애니메이션과 함께 성공/실패 결과를 시각적으로 보여줍니다.
 * @param {object} props - { data, onAction }
 * @param {object} props.data - AI가 보낸 데이터. { title, description, stat, difficulty, modifier }
 * @param {function} props.onAction - 판정 결과를 상위로 전달하는 콜백 함수
 */
const StatCheckModal = ({ data, onAction }) => {
  // --- 상태 관리 ---
  // 'idle': 초기 상태, 'rolling': 주사위 굴리는 중, 'result': 결과 표시
  const [phase, setPhase] = useState('idle'); 
  const [diceResult, setDiceResult] = useState(null);
  const [totalResult, setTotalResult] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- 데이터 추출 및 기본값 설정 ---
  const {
    title = "능력치 판정",
    description = "운명의 주사위를 굴립니다.",
    stat = "민첩",
    difficulty = 15,
    modifier = 0
  } = data;

  // --- 이벤트 핸들러 ---
  /**
   * '판정 시작' 버튼 클릭 시 주사위 굴림을 시작합니다.
   */
  const handleRollDice = () => {
    setPhase('rolling');
  };

  /**
   * 사용자가 판정 결과를 AI에게 전송합니다.
   * @param {boolean} successStatus - 성공 여부
   */
  const handleConfirmResult = (successStatus) => {
    onAction('statCheckResult', {
      success: successStatus,
      roll: diceResult,
      modifier: modifier,
      total: totalResult,
      difficulty: difficulty
    });
  };

  // --- useEffect를 사용한 애니메이션 및 결과 처리 ---
  useEffect(() => {
    if (phase === 'rolling') {
      const animationTime = 1500; // 1.5초 동안 애니메이션
      const interval = setInterval(() => {
        // 롤링 애니메이션 동안 무작위 숫자 보여주기
        setDiceResult(Math.floor(Math.random() * 20) + 1);
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        
        // 최종 주사위 결과 계산
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        const finalTotal = finalRoll + modifier;
        const success = finalTotal >= difficulty;

        setDiceResult(finalRoll);
        setTotalResult(finalTotal);
        setIsSuccess(success);
        setPhase('result');
      }, animationTime);
    }
  }, [phase, modifier, difficulty]);

  // --- 렌더링 로직 ---
  const renderContent = () => {
    if (phase === 'result') {
      return (
        <div className="text-center animate-fadeIn">
          <p className="text-lg text-gray-400 mb-2">판정 결과</p>
          <p className={`text-6xl font-bold mb-4 ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
            {isSuccess ? '성공' : '실패'}
          </p>
          <div className="bg-gray-900/50 p-3 rounded-lg text-lg">
            <p>
              <span className="font-bold text-cyan-400">{diceResult}</span> (1d20) + <span className="font-bold text-yellow-400">{modifier}</span> (보정치) = <span className="font-bold text-xl text-white">{totalResult}</span>
            </p>
            <p className="text-sm text-gray-400 mt-1">(목표치: {difficulty} 이상)</p>
          </div>
          <div className="flex justify-center space-x-4 mt-8">
            <button
              onClick={() => handleConfirmResult(true)}
              className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-500 transition-colors"
            >
              성공 결과 전송
            </button>
            <button
              onClick={() => handleConfirmResult(false)}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-500 transition-colors"
            >
              실패 결과 전송
            </button>
          </div>
        </div>
      );
    }

    if (phase === 'rolling') {
      return (
        <div className="text-center">
          <p className="text-xl text-gray-300 mb-4">운명의 주사위가 구르는 중...</p>
          <div className="flex justify-center items-center h-32">
            <p className="text-8xl font-bold text-white animate-pulse">{diceResult}</p>
          </div>
        </div>
      );
    }

    // 'idle' phase
    return (
      <div className="text-center">
        <p className="text-gray-400 mb-4">{description}</p>
        <div className="bg-gray-900/50 p-4 rounded-lg mb-8">
          <p className="text-2xl font-bold">
            <span className="text-cyan-400">{stat}</span> 판정
          </p>
          <p className="text-sm text-gray-400">목표치: {difficulty} / 보정치: {modifier > 0 ? `+${modifier}` : modifier}</p>
        </div>
        <button
          onClick={handleRollDice}
          className="px-8 py-4 bg-purple-600 text-white text-xl font-bold rounded-lg hover:bg-purple-500 transition-colors shadow-lg shadow-purple-900/50 flex items-center mx-auto"
        >
          <ICONS.LucideDices className="w-6 h-6 mr-3" />
          판정 시작
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[120] animate-fadeIn">
      <div className="bg-gray-800 border border-purple-700 rounded-xl shadow-2xl w-full max-w-md p-8 m-4 text-white font-sans">
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-400">{title}</h2>
        {renderContent()}
      </div>
    </div>
  );
};

export default StatCheckModal;
