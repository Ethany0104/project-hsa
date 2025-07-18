import React, { useState, useEffect, useRef, useContext } from 'react';
import { ICONS } from '../../../constants';
import { UIStateContext } from '../../../contexts/UIStateContext';
import { StoryDataContext } from '../../../contexts/StoryDataContext';

/**
 * PD와 대화하는 모달
 */
export const PdChatModal = ({ isOpen, onClose }) => {
    const { pdChatHistory, isPdChatProcessing } = useContext(UIStateContext);
    const { handlePdChatSend, handleClearPdChat } = useContext(StoryDataContext);
    const [userInput, setUserInput] = useState('');
    const chatEndRef = useRef(null);

    const initialMessage = { role: 'assistant', text: '유저님, 무엇을 도와줄까?', isInitial: true };
    const fullChatHistory = [initialMessage, ...pdChatHistory];

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [fullChatHistory, isPdChatProcessing]);

    const handleSend = () => {
        if (!userInput.trim() || isPdChatProcessing) return;
        handlePdChatSend(userInput);
        setUserInput('');
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn backdrop-blur-sm p-4">
            <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col border border-[var(--border)]">
                <header className="p-4 border-b border-[var(--border)] flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center">
                        <ICONS.LucideBot className="w-6 h-6 mr-3 text-[var(--accent)]" />
                        <h2 className="text-lg font-bold text-[var(--text-primary)] font-sans">PD 한세아와 대화하기</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                         <button onClick={handleClearPdChat} className="flex items-center px-3 py-1.5 bg-[var(--panel-bg-alt)] border border-[var(--border)] hover:bg-[var(--border)] rounded-md text-xs transition-colors font-sans text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                            <ICONS.LucideTrash2 className="w-4 h-4 mr-1.5" /> 대화 초기화
                        </button>
                        <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2">
                            <ICONS.LucideX />
                        </button>
                    </div>
                </header>

                <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                    <div className="space-y-6">
                        {fullChatHistory.map((msg, index) => (
                            <div key={index} className={`flex items-end gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.isInitial ? 'animate-fadeIn' : ''}`}>
                                {msg.role === 'assistant' && <img src="/logo.png" alt="PD" className="w-16 h-16 rounded-full flex-shrink-0" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/6D28D9/FFFFFF?text=PD' }} />}
                                <div className={`max-w-xl p-3.5 rounded-2xl whitespace-pre-wrap leading-relaxed font-sans text-base ${msg.role === 'user' ? 'bg-[var(--accent)] text-white rounded-br-lg' : 'bg-[var(--panel-bg-alt)] text-[var(--text-primary)] rounded-bl-lg border border-[var(--border)]'}`}>
                                    {msg.text}
                                </div>
                                {msg.role === 'user' && <div className="w-10 h-10 flex-shrink-0"></div>}
                            </div>
                        ))}
                        {isPdChatProcessing && (
                            <div className="flex items-end gap-3 justify-start">
                                <img src="/logo.png" alt="PD" className="w-16 h-16 rounded-full" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/64x64/6D28D9/FFFFFF?text=PD' }} />
                                <div className="max-w-xl p-3.5 rounded-2xl bg-[var(--panel-bg-alt)] border border-[var(--border)]">
                                    <div className="flex items-center space-x-1.5">
                                        <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-0"></div>
                                        <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-150"></div>
                                        <div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-300"></div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>
                </div>

                <footer className="p-4 border-t border-[var(--border)] bg-[var(--bg)] flex-shrink-0">
                    <div className="relative">
                        <textarea
                            value={userInput}
                            onChange={e => setUserInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={isPdChatProcessing}
                            placeholder="PD에게 물어볼 내용을 입력하세요..."
                            rows="2"
                            className="w-full bg-[var(--panel-bg-alt)] text-[var(--text-primary)] rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)] transition-all duration-200 font-sans text-base"
                        />
                        <button onClick={handleSend} disabled={isPdChatProcessing || !userInput.trim()} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[var(--accent)] text-white hover:opacity-90 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent-shadow)]">
                            <ICONS.LucideSend className="w-5 h-5" />
                        </button>
                    </div>
                </footer>
            </div>
        </div>
    );
};
