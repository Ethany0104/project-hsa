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
                {/* [MODIFIED] v1.0 개선 계획에 따라, 이제 message.content의 각 아이템에 attachedImageUrl이 있을 수 있습니다. */}
                {visibleContent.map((item, index) => {
                    const characterObject = item.type === 'dialogue' ? allCharacters.find(c => c.id === item.characterId || c.name === item.character) : null;
                    return (
                        <React.Fragment key={index}>
                            {/* 이미지를 텍스트나 대화 블록 위에 렌더링합니다. */}
                            {item.attachedImageUrl && (
                                <div className="mb-6 mt-4 animate-fadeIn">
                                    <img src={item.attachedImageUrl} alt="Scene illustration" className="rounded-lg shadow-lg max-w-full h-auto mx-auto" style={{ maxHeight: '500px' }} />
                                </div>
                            )}

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
                    <div className="absolute bottom-4 left-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ControlButton icon={ICONS.LucideRefreshCw} label="다시 연기" onClick={onReroll} />
                        <ControlButton icon={ICONS.LucidePlusCircle} label="장면 계속" onClick={onContinue} />
                    </div>
                )}
            </div>
        );
    }

    // AI 메시지 렌더링 (채팅 모드)
    // Chat 모드는 메시지 객체 최상위에 attachedImageUrl이 하나만 존재합니다.
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
});

export default StoryBlock;
