import React from 'react';
import { ICONS } from '../../../constants';

/**
 * A modal for getting user confirmation (e.g., for deletion).
 * @param {object} props - { isOpen, onClose, onConfirm, title, children }
 */
export const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => { 
    if (!isOpen) return null; 
    
    return ( 
        <div 
            // [수정] z-index를 CSS 변수로 관리
            className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4"
            style={{ zIndex: 'var(--z-confirmation-modal)' }}
        > 
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-sm border border-[var(--border-primary)]">
                <div className="p-6 font-sans">
                    <h2 className="text-lg font-bold text-[var(--danger)] mb-4 flex items-center">
                        <ICONS.LucideAlertTriangle className="w-5 h-5 mr-2" />
                        {title}
                    </h2>
                    <div className="text-[var(--text-primary)] mb-6">{children}</div>
                    <div className="flex justify-end space-x-3">
                        <button 
                            onClick={onClose} 
                            className="px-4 py-2 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-lg text-sm font-semibold text-[var(--text-primary)] transition-colors duration-200"
                        >
                            취소
                        </button>
                        <button 
                            onClick={onConfirm} 
                            className="px-4 py-2 bg-[var(--danger)] border border-red-700 hover:bg-red-700 rounded-lg text-sm font-semibold text-white transition-colors duration-200"
                        >
                            확인
                        </button>
                    </div>
                </div>
            </div> 
        </div> 
    ); 
};
