// src/components/pd_chat/HtmlPreviewModal.js

import React, { memo } from 'react';
import { ICONS } from '../../constants';

const HtmlPreviewModal = memo(({ isOpen, onClose, htmlContent }) => {
    if (!isOpen) return null;

    const iframeSrcDoc = `
        <html>
            <head>
                <style>
                    body { 
                        margin: 0; 
                        font-family: sans-serif; 
                        color: #e5e7eb;
                        background-color: #111827;
                    }
                    ::-webkit-scrollbar { width: 8px; }
                    ::-webkit-scrollbar-track { background: #1f2937; }
                    ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 4px; }
                    ::-webkit-scrollbar-thumb:hover { background: #6b7280; }
                </style>
                <script src="https://cdn.tailwindcss.com/"></script>
            </head>
            <body>
                ${htmlContent}
            </body>
        </html>
    `;

    return (
        <div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[130] animate-fadeIn p-2 sm:p-4 md:p-8" onClick={onClose}>
            <div className="bg-[var(--panel-bg)] rounded-xl shadow-2xl w-full h-full flex flex-col border border-[var(--border-primary)] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <header className="p-3 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-md font-bold text-[var(--accent-primary)] font-sans flex items-center">
                        <ICONS.LucideCode size={18} className="mr-2"/>
                        HTML Preview
                    </h2>
                    <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-tertiary)]">
                        <ICONS.LucideX />
                    </button>
                </header>
                <div className="flex-grow bg-gray-900">
                    <iframe
                        srcDoc={iframeSrcDoc}
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-presentation allow-scripts"
                        title="HTML Fullscreen Preview"
                    />
                </div>
            </div>
        </div>
    );
});

export default HtmlPreviewModal;
