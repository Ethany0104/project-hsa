import React, { useEffect } from 'react';

/**
 * 화면 하단에 잠시 나타나는 토스트 메시지
 */
export const Toast = ({ message, show, onDismiss }) => { 
    useEffect(() => { 
        if (show) { 
            const timer = setTimeout(() => { onDismiss(); }, 3000); 
            return () => clearTimeout(timer); 
        } 
    }, [show, onDismiss]); 

    if (!show) return null; 
    
    return ( 
        <div className="fixed bottom-5 right-5 bg-gradient-to-br from-[var(--accent)] to-[var(--accent-dark)] text-white px-6 py-3 rounded-lg shadow-2xl shadow-black/30 animate-toast z-[100] font-sans text-sm font-semibold">
            {message}
        </div> 
    ); 
};
