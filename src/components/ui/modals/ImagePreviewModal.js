// src/components/ui/modals/ImagePreviewModal.js

import React from 'react';
import { ICONS } from '../../../constants';

/**
 * 클릭된 이미지를 화면 전체에 크게 보여주는 모달 컴포넌트
 * @param {object} props - { imageUrl, onClose }
 */
export const ImagePreviewModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <div 
            // [수정] z-index를 CSS 변수로 관리
            className="fixed inset-0 bg-black/80 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
            onClick={onClose}
            style={{ zIndex: 'var(--z-image-preview)' }}
        >
            <div 
                className="relative max-w-full max-h-full"
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
