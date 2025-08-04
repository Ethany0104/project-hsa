// src/components/ui/modals/ImagePreviewModal.js

import React from 'react';
import { ICONS } from '../../../constants';

/**
 * 클릭된 이미지를 화면 전체에 크게 보여주는 모달 컴포넌트
 * @param {object} props - { imageUrl, onClose }
 */
export const ImagePreviewModal = ({ imageUrl, onClose }) => {
    // imageUrl이 없으면 아무것도 렌더링하지 않습니다.
    if (!imageUrl) return null;

    return (
        // 모달 배경. 클릭 시 onClose 함수를 호출하여 닫습니다.
        <div 
            className="fixed inset-0 bg-black/80 flex justify-center items-center z-[220] animate-fadeIn backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="relative max-w-full max-h-full"
                // 이미지 자체를 클릭했을 때 모달이 닫히는 것을 방지합니다.
                onClick={(e) => e.stopPropagation()} 
            >
                <img 
                    src={imageUrl} 
                    alt="Image Preview" 
                    className="block max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                />
                <button 
                    onClick={onClose} 
                    className="absolute -top-4 -right-4 p-2 bg-gray-800 rounded-full text-white hover:bg-gray-700 transition-colors"
                    title="Close"
                >
                    <ICONS.LucideX size={24} />
                </button>
            </div>
        </div>
    );
};
