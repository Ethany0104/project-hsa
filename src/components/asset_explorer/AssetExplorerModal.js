// src/components/asset_explorer/AssetExplorerModal.js
import React from 'react';
import { ICONS } from '../../constants';
import AssetExplorer from './AssetExplorer';

const AssetExplorerModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4" style={{ zIndex: 'var(--z-pd-chat-modal)' }}>
            <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col border border-[var(--border-primary)] overflow-hidden">
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <ICONS.LucideGalleryHorizontal className="w-6 h-6 mr-3 text-[var(--accent-primary)]" />
                        <h2 className="text-xl font-bold text-[var(--text-primary)] font-sans">에셋 탐색기</h2>
                    </div>
                    <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
                </header>
                <main className="flex-grow flex flex-row min-h-0">
                    <AssetExplorer />
                </main>
            </div>
        </div>
    );
};

export default AssetExplorerModal;
