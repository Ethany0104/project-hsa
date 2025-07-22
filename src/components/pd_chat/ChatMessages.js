import React, { memo, useMemo, useEffect, useRef } from 'react';
import { ICONS } from '../../constants';
import { useStoryContext } from '../../contexts/StoryProvider';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';

const ChatMessageContent = memo(({ msg, onShowHtmlPreview }) => {
        const { handlerProps } = useStoryContext();
    const { showToast } = handlerProps;

    const parseMessageWithHtml = (text) => {
        if (typeof text !== 'string') {
            return { leadingText: text, htmlContent: null, trailingText: null };
        }
        const regex = /```html\n([\s\S]*?)\n```/;
        const match = text.match(regex);

        if (!match || !match[1]) {
            return { leadingText: text, htmlContent: null, trailingText: null };
        }

        const htmlContent = match[1].trim();
        const leadingText = text.substring(0, match.index).trim();
        const trailingText = text.substring(match.index + match[0].length).trim();

        return {
            leadingText: leadingText || null,
            htmlContent: htmlContent || null,
            trailingText: trailingText || null,
        };
    };

    const handleCopyCode = (htmlContent) => {
        navigator.clipboard.writeText(htmlContent).then(() => {
            showToast('HTML 코드가 클립보드에 복사되었습니다.', 'success');
        }).catch(err => {
            console.error('클립보드 복사 실패:', err);
            showToast('코드 복사에 실패했습니다.', 'error');
        });
    };

    if (msg.role !== 'assistant' || msg.isInitial) {
        return <MarkdownRenderer content={msg.text} preset="chat" />;
    }

    const { leadingText, htmlContent, trailingText } = parseMessageWithHtml(msg.text);

    return (
        <>
            {leadingText && <MarkdownRenderer content={leadingText} preset="chat" />}
            {htmlContent && (
                 <div className="my-2 p-2 border border-[var(--border-primary)] rounded-lg bg-[var(--bg-primary)]">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">HTML 시각화</span>
                        <div className="flex items-center space-x-2">
                            <button onClick={() => handleCopyCode(htmlContent)} className="text-xs flex items-center px-2 py-1 bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-secondary)] transition-colors">
                                <ICONS.LucideCopy size={12} className="mr-1"/> 복사
                            </button>
                            <button onClick={() => onShowHtmlPreview(htmlContent)} className="text-xs flex items-center px-2 py-1 bg-[var(--bg-tertiary)] rounded-md hover:bg-[var(--border-secondary)] transition-colors">
                                <ICONS.LucideCode size={12} className="mr-1"/> 미리보기
                            </button>
                        </div>
                    </div>
                    <pre className="w-full bg-[var(--input-bg)] p-2 rounded text-xs text-[var(--text-primary)]/80 overflow-x-auto">
                        <code>{htmlContent}</code>
                    </pre>
                 </div>
            )}
            {trailingText && <MarkdownRenderer content={trailingText} preset="chat" />}

            {!leadingText && !htmlContent && !trailingText && <MarkdownRenderer content={msg.text} preset="chat" />}
        </>
    );
});

const ChatMessages = memo(({ history, isProcessing, onPinItem, pinnedItems, onShowHtmlPreview }) => {
    const chatEndRef = useRef(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, isProcessing]);
    const pinnedTexts = useMemo(() => new Set(pinnedItems.map(item => item.text)), [pinnedItems]);

    return (
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto bg-[var(--bg-secondary)]">
            <div className="space-y-6">
                {history.map((msg, index) => {
                    const isPinned = msg.role === 'assistant' && pinnedTexts.has(msg.text);
                    return (
                        <div key={index} className={`flex items-end gap-3 group ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                            {msg.role === 'assistant' && <img src="/logo_round.png" alt="PD" className="w-10 h-10 rounded-full flex-shrink-0 self-start" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/8A2BE2/FFFFFF?text=PD' }} />}
                            <div className={`relative max-w-xl w-full p-3.5 rounded-2xl leading-relaxed font-sans text-base ${msg.role === 'user' ? 'bg-[var(--accent-primary)] text-white rounded-br-lg' : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-bl-lg'}`}>
                                <ChatMessageContent msg={msg} onShowHtmlPreview={onShowHtmlPreview} />
                                {msg.role === 'assistant' && !msg.isInitial && (
                                    <button onClick={() => onPinItem(msg.text)} title={isPinned ? "Already Pinned" : "Pin to Idea Board"} disabled={isPinned} className={`absolute top-1 -right-8 p-1 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-all ${isPinned ? 'text-[var(--accent-primary)] cursor-default' : 'hover:text-[var(--accent-primary)]'}`}>
                                        <ICONS.LucidePin size={16} style={{ fill: isPinned ? 'currentColor' : 'none' }} />
                                    </button>
                                )}
                            </div>
                            {msg.role === 'user' && <div className="w-10 h-10 flex-shrink-0"></div>}
                        </div>
                    );
                })}
                {isProcessing && (
                    <div className="flex items-end gap-3 justify-start animate-fadeIn">
                        <img src="/logo_round.png" alt="PD" className="w-10 h-10 rounded-full flex-shrink-0 self-start" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/40x40/8A2BE2/FFFFFF?text=PD' }} />
                        <div className="max-w-xl p-3.5 rounded-2xl bg-[var(--bg-tertiary)]"><div className="flex items-center space-x-1.5"><div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-0"></div><div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-150"></div><div className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-pulse delay-300"></div></div></div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
        </div>
    );
});

export default ChatMessages;
