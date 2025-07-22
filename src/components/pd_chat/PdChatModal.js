import React, { useState, useEffect, useRef, memo } from 'react';
import { ICONS, GEMINI_MODELS } from '../../constants';
import { useStoryContext } from '../../contexts/StoryProvider';
import HtmlPreviewModal from './HtmlPreviewModal';
import IdeaBoard from './idea_board/IdeaBoard';
import ChatMessages from './ChatMessages';

const HeaderContent = memo(({ activeView, onToggleView, onClearChat, onClose, selectedModel, onModelChange }) => {
    return (
        <div className="flex items-center justify-between w-full">
            <div className="flex items-center min-w-0">
                <img src="/logo_round.png" alt="PD" className="w-12 h-12 rounded-full mr-3 flex-shrink-0" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/8A2BE2/FFFFFF?text=PD' }} />
                <div className="min-w-0">
                    <h2 className="text-lg font-bold text-[var(--text-primary)] font-sans truncate">PD 한세아</h2>
                    <p className="text-xs text-[var(--success)] flex items-center"><span className="w-2 h-2 bg-[var(--success)] rounded-full mr-1.5"></span>Online</p>
                </div>
            </div>
            <div className="flex items-center space-x-1 md:space-x-2 flex-shrink-0">
                <select
                    value={selectedModel}
                    onChange={onModelChange}
                    className="bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] transition-colors max-w-[120px] sm:max-w-none"
                >
                    {GEMINI_MODELS.map(model => (<option key={model.id} value={model.id}>{model.name}</option>))}
                </select>
                <div className="flex bg-[var(--bg-primary)] rounded-lg p-1 md:hidden">
                    <button onClick={() => onToggleView('chat')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeView === 'chat' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>채팅</button>
                    <button onClick={() => onToggleView('board')} className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeView === 'board' ? 'bg-[var(--accent-primary)] text-white shadow' : 'text-[var(--text-secondary)]'}`}>보드</button>
                </div>
                <button onClick={onClearChat} className="p-2 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-full hover:bg-red-500/10 transition-colors" title="Clear Chat"><ICONS.LucideTrash2 className="w-5 h-5" /></button>
                <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--bg-tertiary)]" title="Close"><ICONS.LucideX className="w-5 h-5" /></button>
            </div>
        </div>
    );
});

export const PdChatModal = ({ isOpen, onClose }) => {
        const { storyProps, handlerProps } = useStoryContext();
    const {
        pdChatHistory,
        isPdChatProcessing,
        aiSettings,
        pinnedItems,
    } = storyProps;
    const {
        showToast,
        handlePdChatSend,
        handleClearPdChat,
        handlePinItem,
        handleUnpinItem,
        handleUpdatePinnedItem,
        handleReorderPinnedItems
    } = handlerProps;

    const [userInput, setUserInput] = useState('');
    const [selectedModel, setSelectedModel] = useState(aiSettings.auxModel);
    const [activeView, setActiveView] = useState('chat');
    const [htmlPreview, setHtmlPreview] = useState({ isOpen: false, content: '' });
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setSelectedModel(aiSettings.auxModel);
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, aiSettings.auxModel]);

    const handleSend = () => {
        if (!userInput.trim() || isPdChatProcessing) return;
        handlePdChatSend(userInput, selectedModel);
        setUserInput('');
    };

    const handleCopySuccess = () => showToast('클립보드에 복사되었습니다!', 'success');
    const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

    const handleShowHtmlPreview = (content) => setHtmlPreview({ isOpen: true, content });
    const handleCloseHtmlPreview = () => setHtmlPreview({ isOpen: false, content: '' });

    if (!isOpen) return null;

    const initialMessage = { role: 'assistant', text: '유저님, 무슨 일이야? 도움이 필요해?', isInitial: true };
    const fullChatHistory = [initialMessage, ...pdChatHistory];

    return (
        <>
            <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[120] animate-fadeIn backdrop-blur-sm p-4">
                <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col border border-[var(--border-primary)] overflow-hidden">
                    <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                        <HeaderContent
                            activeView={activeView}
                            onToggleView={setActiveView}
                            onClearChat={handleClearPdChat}
                            onClose={onClose}
                            selectedModel={selectedModel}
                            onModelChange={(e) => setSelectedModel(e.target.value)}
                        />
                    </header>

                    <div className="flex-grow flex flex-row min-h-0">
                        <div className={`w-full md:w-2/3 flex flex-col ${activeView === 'chat' ? 'flex' : 'hidden'} md:flex`}>
                            <ChatMessages
                                history={fullChatHistory}
                                isProcessing={isPdChatProcessing}
                                onPinItem={handlePinItem}
                                pinnedItems={pinnedItems}
                                onShowHtmlPreview={handleShowHtmlPreview}
                            />
                            <footer className="p-4 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex-shrink-0">
                                <div className="relative">
                                    <textarea
                                        ref={inputRef}
                                        value={userInput}
                                        onChange={e => setUserInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        disabled={isPdChatProcessing}
                                        placeholder="PD에게 무엇이든 물어보세요..."
                                        rows="2"
                                        className="w-full bg-[var(--input-bg)] text-[var(--text-primary)] rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] border border-[var(--border-primary)] transition-all duration-200 font-sans text-base"
                                    />
                                    <button
                                        onClick={handleSend}
                                        disabled={isPdChatProcessing || !userInput.trim()}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[var(--accent-primary)] text-white hover:opacity-90 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent-shadow)]"
                                    >
                                        <ICONS.LucideSend className="w-5 h-5" />
                                    </button>
                                </div>
                            </footer>
                        </div>
                        <div className={`w-full md:w-1/3 md:min-w-[320px] border-l border-[var(--border-primary)] flex-col ${activeView === 'board' ? 'flex' : 'hidden'} md:flex`}>
                           <IdeaBoard pinnedItems={pinnedItems} onCopy={handleCopySuccess} onUnpin={handleUnpinItem} onUpdate={handleUpdatePinnedItem} onReorder={handleReorderPinnedItems} />
                        </div>
                    </div>
                </div>
            </div>
            <HtmlPreviewModal
                isOpen={htmlPreview.isOpen}
                onClose={handleCloseHtmlPreview}
                htmlContent={htmlPreview.content}
            />
        </>
    );
};
