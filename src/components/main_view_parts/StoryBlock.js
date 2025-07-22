import React from 'react';
import { DialogueBlock, ControlButton } from '../ui';
import { ICONS } from '../../constants';
import OocBlock from './OocBlock';
import ChatMessageBlock from './ChatMessageBlock';

const StoryBlock = React.memo(({ message, onReroll, onContinue, isLastAiMessage, user, allCharacters }) => {
    
    // 유저 메시지 렌더링
    if (message.sender === 'player') {
        if (message.isOoc) {
            return <OocBlock text={message.text} />;
        }
        
        const regex = /"([^"]*)"/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(message.text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'narration', content: message.text.substring(lastIndex, match.index) });
            }
            parts.push({ type: 'dialogue', content: match[1] });
            lastIndex = regex.lastIndex;
        }

        if (lastIndex < message.text.length) {
            parts.push({ type: 'narration', content: message.text.substring(lastIndex) });
        }
        
        if (parts.length === 0) {
            parts.push({ type: 'narration', content: message.text });
        }

        return (
            <div className="my-8 animate-fadeIn flex flex-col items-end">
                {parts.map((part, index) => {
                    if (part.type === 'dialogue') {
                        return <DialogueBlock key={index} character={user} line={part.content} isPlayer={true} />;
                    }
                    if (part.content.trim() === '') return null;
                    return <p key={index} className="text-lg leading-9 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-4 max-w-full">{part.content}</p>;
                })}
                <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent opacity-30"></div>
            </div>
        );
    }

    // AI 메시지 렌더링 (소설 모드)
    if (message.sender === 'ai' && message.style === 'Novel' && Array.isArray(message.content)) {
        const visibleContent = message.content;
        
        return (
            <div className="my-8 group relative animate-fadeIn pb-12">
                {visibleContent.map((item, index) => {
                    if (item.type === 'narration') {
                        const textContent = item.text;
                        if (!textContent) return null;
                        return <p key={index} className="text-lg leading-9 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-4">{textContent}</p>;
                    }
                    
                    if (item.type === 'dialogue') {
                        const characterObject = allCharacters.find(c => c.id === item.characterId || c.name === item.character);
                        return (
                            <React.Fragment key={index}>
                                <DialogueBlock character={characterObject} line={item.line} thought={item.thought} />
                            </React.Fragment>
                        );
                    }
                    
                    return null;
                })}
                {isLastAiMessage && (
                    <div className="absolute bottom-4 left-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ControlButton icon={ICONS.LucideRefreshCw} label="다시 연기" onClick={onReroll} />
                        <ControlButton icon={ICONS.LucidePlusCircle} label="장면 계속" onClick={onContinue} />
                    </div>
                )}
            </div>
        );
    }

    // AI 메시지 렌더링 (채팅 모드)
    if (message.sender === 'ai' && message.style === 'Chat' && typeof message.text === 'string') {
        return (
            <ChatMessageBlock
                text={message.text}
                isLastAiMessage={isLastAiMessage}
                onReroll={onReroll}
                onContinue={onContinue}
            />
        );
    }

    return null;
});

export default StoryBlock;
