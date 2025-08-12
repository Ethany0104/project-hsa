// src/components/isc/components/InventoryCard.js
import React from 'react';
import { ICONS } from '../../constants';

/**
 * 인물의 소지품 목록을 보여주는 인터랙티브 카드 컴포넌트입니다.
 * @param {object} props - { data, onAction }
 * @param {object} props.data - AI가 보낸 데이터. { title, characterName, items }
 * @param {function} props.onAction - (미래 확장용) 아이템 클릭 등 액션 전달 콜백
 */
const InventoryCard = ({ data, onAction }) => {
  // --- 데이터 추출 및 기본값 설정 ---
  const {
    title = "소지품",
    characterName = "인물",
    items = [] // items는 { id, name, description, imageUrl } 형태의 객체 배열
  } = data;

  // --- 렌더링 로직 ---
  return (
    <div className="my-8 animate-fadeIn">
      <div className="bg-gray-800/70 border border-yellow-700/50 rounded-xl shadow-lg w-full max-w-md mx-auto font-sans backdrop-blur-sm">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-yellow-400 flex items-center">
            <ICONS.LucideArchive className="w-5 h-5 mr-3" />
            {characterName}의 {title}
          </h2>
        </div>
        <div className="p-4 max-h-96 overflow-y-auto">
          {items.length > 0 ? (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex items-start space-x-4 p-3 bg-gray-900/50 rounded-lg">
                  <div className="w-16 h-16 bg-gray-700 rounded-md flex-shrink-0 flex items-center justify-center overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <ICONS.LucideBox className="w-8 h-8 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-white">{item.name}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed mt-1">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ICONS.LucideArchiveX className="w-12 h-12 mx-auto mb-4" />
              <p>소지품이 비어있습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ICONS.LucideBox가 없으므로 임시로 LucideArchive를 사용합니다. 
// 실제 아이콘 라이브러리에 따라 적절한 아이콘으로 교체해야 합니다.
ICONS.LucideBox = ICONS.LucideArchive; 

export default InventoryCard;
