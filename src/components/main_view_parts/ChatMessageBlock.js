import React, { useMemo } from 'react';
import { ICONS } from '../../constants';
import { ControlButton } from '../ui';
import { useStoryContext } from '../../contexts/StoryProvider';

const ChatMessageBlock = ({ text, isLastAiMessage, onReroll, onContinue, attachedImageUrl }) => {
    // [신규] 이미지 클릭 시 모달을 띄우기 위한 핸들러를 컨텍스트에서 가져옵니다.
    const { handlerProps } = useStoryContext();
    const { setImagePreviewUrl } = handlerProps;

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
            {attachedImageUrl && (
                <div className="mb-4 animate-fadeIn">
                    {/* [수정] 이미지를 클릭 가능한 버튼으로 감싸고, 클릭 시 모달을 띄우도록 핸들러를 연결합니다. */}
                    <button onClick={() => setImagePreviewUrl(attachedImageUrl)} className="block w-full text-left transition-transform duration-200 hover:scale-[1.02]">
                        <img src={attachedImageUrl} alt="Scene illustration" className="rounded-lg shadow-lg max-w-full h-auto mx-auto cursor-pointer" style={{ maxHeight: '400px' }} />
                    </button>
                </div>
            )}

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
