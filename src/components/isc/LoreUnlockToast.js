// src/components/isc/components/LoreUnlockToast.js
import React from 'react';
import { ICONS } from '../../constants';

/**
 * 새로운 설정이나 정보가 밝혀졌을 때 화면 하단에 나타나는 토스트 알림 컴포넌트입니다.
 * @param {object} props - { data, onAction }
 * @param {object} props.data - AI가 보낸 데이터. { title, content }
 * @param {function} props.onAction - (미래 확장용) 액션 전달 콜백
 */
const LoreUnlockToast = ({ data, onAction }) => {
  // --- 데이터 추출 및 기본값 설정 ---
  const {
    title = "새로운 정보",
    content = "이야기의 중요한 조각을 발견했습니다."
  } = data;

  // 이 컴포넌트는 자동으로 사라지므로, onAction을 통한 사용자 상호작용은 기본적으로 없습니다.
  // 하지만 클릭 시 상세 정보 모달을 띄우는 등의 확장성을 위해 onAction prop은 남겨둡니다.

  // --- 렌더링 로직 ---
  return (
    // 화면 우측 하단에 고정
    <div className="fixed bottom-5 right-5 w-full max-w-sm z-[150] animate-toast">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-green-600/50 rounded-xl shadow-2xl shadow-black/50 font-sans text-white overflow-hidden">
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <ICONS.LucideBookOpen className="w-6 h-6 text-green-400" />
            </div>
            <div className="ml-4 flex-1">
              <p className="text-lg font-bold text-green-400">{title}</p>
              <p className="mt-1 text-md text-gray-300">{content}</p>
            </div>
          </div>
        </div>
        {/* 자동으로 사라지는 시간을 시각적으로 보여주는 프로그레스 바 */}
        <div className="h-1 bg-green-400 animate-progress-bar"></div>
      </div>
      {/* CSS 애니메이션 정의 */}
      <style>{`
        @keyframes progress-bar-anim {
          from { width: 100%; }
          to { width: 0%; }
        }
        .animate-progress-bar {
          animation: progress-bar-anim 5s linear forwards;
        }
      `}</style>
    </div>
  );
};

export default LoreUnlockToast;
