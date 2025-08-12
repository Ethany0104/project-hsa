// src/components/ui/modals/Toast.js

import React, { useEffect } from 'react';
import { ICONS } from '../../../constants';

/**
 * A toast message component that appears at the bottom of the screen.
 * @param {object} props - { message, show, onDismiss, type = 'default' }
 */
export const Toast = ({ message, show, onDismiss, type = 'default' }) => { 
    useEffect(() => { 
        if (show) { 
            const timer = setTimeout(() => { onDismiss(); }, 5000); 
            return () => clearTimeout(timer); 
        } 
    }, [show, onDismiss]); 

    if (!show) return null; 
    
    const toastStyles = {
        default: 'bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] text-white',
        error: 'bg-gradient-to-br from-[var(--danger)] to-red-700 text-white',
        success: 'bg-gradient-to-br from-[var(--success)] to-green-700 text-white',
    };

    const toastIcons = {
        default: <ICONS.LucideInfo className="w-5 h-5 mr-3" />,
        error: <ICONS.LucideAlertCircle className="w-5 h-5 mr-3" />,
        success: <ICONS.LucideCheckCircle className="w-5 h-5 mr-3" />,
    }

    return ( 
        <div 
            // [수정] z-index를 CSS 변수로 관리
            className={`fixed bottom-5 right-5 flex items-center px-6 py-3 rounded-lg shadow-2xl shadow-black/30 animate-toast font-sans text-sm font-semibold ${toastStyles[type] || toastStyles.default}`}
            style={{ zIndex: 'var(--z-toast)' }}
        >
            {toastIcons[type] || toastIcons.default}
            {message}
        </div> 
    ); 
};
