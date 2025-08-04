import React from 'react';
import { DialogueBlock, ControlButton } from '../ui';
import { ICONS } from '../../constants';
import OocBlock from './OocBlock';
import ChatMessageBlock from './ChatMessageBlock';
import { useStoryContext } from '../../contexts/StoryProvider';

// [수정] React.memo를 제거하여, 컨텍스트 변경 시 컴포넌트가 확실하게 리렌더링되도록 합니다.
// 이는 미묘한 상태 업데이트 문제를 해결하는 데 도움이 될 수 있습니다.
const StoryBlock = ({ message, onReroll, onContinue, isLastAiMessage, user, allCharacters }) => {
    // [신규] 이미지 클릭 시 모달을 띄우기 위한 핸들러를 컨텍스트에서 가져옵니다.
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
                    const characterObject = item.type === 'dialogue' ? allCharacters.find(c => c.id === item.characterId || c.name === item.character) : null;
                    return (
                        <React.Fragment key={index}>
                            {item.attachedImageUrl && (
                                <div className="mb-6 mt-4 animate-fadeIn">
                                    {/* [수정] 이미지를 클릭 가능한 버튼으로 감싸고, 클릭 시 모달을 띄우도록 핸들러를 연결합니다. */}
                                    <button onClick={() => setImagePreviewUrl(item.attachedImageUrl)} className="block w-full text-left transition-transform duration-200 hover:scale-[1.02]">
                                        <img src={item.attachedImageUrl} alt="Scene illustration" className="rounded-lg shadow-lg max-w-full h-auto mx-auto cursor-pointer" style={{ maxHeight: '500px' }} />
                                    </button>
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

export default StoryBlock;
