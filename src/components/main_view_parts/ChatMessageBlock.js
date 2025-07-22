import React, { useMemo } from 'react';
import { ICONS } from '../../constants';
import { ControlButton } from '../ui';

const ChatMessageBlock = ({ text, isLastAiMessage, onReroll, onContinue }) => {
    const parsedChat = useMemo(() => {
        if (!text || typeof text !== 'string') return [];
        
        const parts = [];
        const regex = /\[.*?\]/g;
        let lastIndex = 0;
        let match;
    
        while ((match = regex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'dialogue', content: text.substring(lastIndex, match.index).trim() });
            }
            parts.push({ type: 'narration', content: match[0] });
            lastIndex = regex.lastIndex;
        }
    
        if (lastIndex < text.length) {
            parts.push({ type: 'dialogue', content: text.substring(lastIndex).trim() });
        }
    
        return parts.filter(part => part.content);
    }, [text]);

    return (
        <div className="my-8 group relative animate-fadeIn pb-12">
            <div className="font-serif text-lg leading-9 text-[var(--text-primary)] space-y-4">
                {parsedChat.map((part, index) => {
                    if (part.type === 'narration') {
                        return <p key={index} className="italic text-[var(--text-secondary)] whitespace-pre-wrap">{part.content}</p>;
                    }
                    return <p key={index} className="whitespace-pre-wrap">{part.content}</p>;
                })}
            </div>
            
            {isLastAiMessage && (
                <div className="absolute bottom-4 left-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <ControlButton icon={ICONS.LucideRefreshCw} label="다시 연기" onClick={onReroll} />
                    <ControlButton icon={ICONS.LucidePlusCircle} label="장면 계속" onClick={onContinue} />
                </div>
            )}
        </div>
    );
};

export default ChatMessageBlock;
