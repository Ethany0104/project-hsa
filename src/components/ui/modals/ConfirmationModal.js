import React from 'react';
import { ICONS } from '../../../constants';

/**
 * 사용자 확인을 받는 모달 (예: 삭제 확인)
 */
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => { 
    if (!isOpen) return null; 
    return ( 
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[60] animate-fadeIn backdrop-blur-sm"> 
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border)]">
                <div className="p-6 font-sans">
                    <h2 className="text-lg font-bold text-[var(--accent)] mb-4">{title}</h2>
                    <div className="text-[var(--text-primary)] mb-6">{children}</div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={onClose} className="px-4 py-2 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200">취소</button>
                        <button onClick={onConfirm} className="px-4 py-2 bg-red-600 border border-red-700 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200">확인</button>
                    </div>
                </div>
            </div> 
        </div> 
    ); 
};
