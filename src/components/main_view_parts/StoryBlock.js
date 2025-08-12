// src/components/main_view_parts/StoryBlock.js
import React from 'react';
import { DialogueBlock, ControlButton } from '../ui';
import { ICONS } from '../../constants';
import OocBlock from './OocBlock';
import ChatMessageBlock from './ChatMessageBlock';
import { useStoryContext } from '../../contexts/StoryProvider';
import ISCRenderer from '../isc/ISCRenderer';
import LogicExecutor from '../isc/LogicExecutor';

const StoryBlock = ({ message, onReroll, onContinue, isLastAiMessage, user, allCharacters, onComponentAction, onLogicResult }) => {
    const { handlerProps } = useStoryContext();
    const { setImagePreviewUrl } = handlerProps;
    
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
            <div className="animate-fadeIn flex flex-col items-end">
                <div className="flex flex-col items-end space-y-4 w-full">
                    {parts.map((part, index) => {
                        if (part.type === 'dialogue') {
                            return <DialogueBlock key={index} character={user} line={part.content} isPlayer={true} />;
                        }
                        if (part.content.trim() === '') return null;
                        return <p key={index} className="text-lg leading-9 text-[var(--text-primary)] whitespace-pre-wrap font-serif max-w-full text-right">{part.content}</p>;
                    })}
                </div>
                <div className="h-px w-full bg-gradient-to-r from-transparent via-[var(--border-primary)] to-transparent opacity-30"></div>
            </div>
        );
    }

    // AI 메시지 렌더링 (소설 모드)
    if (message.sender === 'ai' && message.style === 'Novel' && Array.isArray(message.content)) {
        const visibleContent = message.content;
        
        return (
            <div className={`group relative animate-fadeIn ${isLastAiMessage ? 'pb-12' : ''}`}>
                {message.attachedImageUrl && (
                    <div className="mb-6 mt-4 animate-fadeIn">
                        <button onClick={() => setImagePreviewUrl(message.attachedImageUrl)} className="block w-full text-left transition-transform duration-200 hover:scale-[1.02]">
                            <img src={message.attachedImageUrl} alt="Scene illustration" className="rounded-lg shadow-lg max-w-full h-auto mx-auto cursor-pointer" style={{ maxHeight: '500px' }} />
                        </button>
                    </div>
                )}

                {visibleContent.map((item, index) => {
                    const characterObject = item.type === 'dialogue' ? allCharacters.find(c => c.id === item.characterId || c.name === item.character) : null;
                    
                    if (item.type === 'interactiveComponent') {
                        return <ISCRenderer key={index} spec={item.componentSpec} onAction={onComponentAction} />;
                    }
                    if (item.type === 'executeLogic') {
                        return <LogicExecutor key={index} spec={item} onComplete={onLogicResult} />;
                    }

                    return (
                        <React.Fragment key={index}>
                            {item.type === 'narration' && item.text && (
                                <p className="text-lg leading-9 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-4">{item.text}</p>
                            )}
                            
                            {item.type === 'dialogue' && (
                                <DialogueBlock character={characterObject} line={item.line} thought={item.thought} />
                            )}
                        </React.Fragment>
                    );
                })}
                {isLastAiMessage && (
                    <div className="absolute bottom-2 left-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ControlButton icon={ICONS.LucideRefreshCw} label="다시 연기" onClick={onReroll} />
                        <ControlButton icon={ICONS.LucidePlusCircle} label="장면 계속" onClick={onContinue} />
                    </div>
                )}
            </div>
        );
    }

    // AI 메시지 렌더링 (채팅 모드)
    if (message.sender === 'ai' && message.style === 'Chat' && typeof message.content === 'string') {
        return (
            <ChatMessageBlock
                text={message.content}
                isLastAiMessage={isLastAiMessage}
                onReroll={onReroll}
                onContinue={onContinue}
                attachedImageUrl={message.attachedImageUrl}
            />
        );
    }

    return null;
};

export default React.memo(StoryBlock);
