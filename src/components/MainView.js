import React, { useRef, useEffect, useState, useMemo, useContext } from 'react';
import { ICONS } from '../constants';
import { LoadingBlock, ControlButton, DialogueBlock } from './ui';
// --- Context Imports ---
import { StoryDataContext } from '../contexts/StoryDataContext';
import { UIStateContext } from '../contexts/UIStateContext';

const StoryBlock = React.memo(({ message, onReroll, onContinue, isLastAiMessage, protagonist, allCharacters }) => {
    if (message.sender === 'player') {
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
            <div className="my-10 animate-fadeIn">
                {parts.map((part, index) => {
                    if (part.type === 'dialogue') {
                        return <DialogueBlock key={index} character={protagonist?.name || '나'} line={part.content} />;
                    }
                    if (part.content.trim() === '') return null;
                    return <p key={index} className="text-base leading-8 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-2">{part.content}</p>;
                })}
                <div className="my-8 h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent opacity-60"></div>
            </div>
        );
    }

    if (message.sender === 'ai' && Array.isArray(message.content)) {
        return (
            <div className="my-6 group relative animate-fadeIn pb-8">
                {message.content.map((item, index) => {
                    if (item.type === 'narration') {
                        const textContent = item.text;
                        if (!textContent) return null;
                        return <p key={index} className="text-base leading-8 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-2">{textContent}</p>;
                    }
                    
                    if (item.type === 'dialogue') {
                        const characterName = item.character || allCharacters.find(c => c.id === item.characterId)?.name || '알 수 없는 인물';
                        return (
                            <React.Fragment key={index}>
                                <DialogueBlock character={characterName} line={item.line} thought={item.thought} />
                            </React.Fragment>
                        );
                    }
                    
                    return null;
                })}
                {isLastAiMessage && (
                    <div className="absolute -bottom-1 left-0 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ControlButton icon={ICONS.LucideRefreshCw} label="다시 쓰기" onClick={onReroll} />
                        <ControlButton icon={ICONS.LucidePlusCircle} label="이야기 계속" onClick={onContinue} />
                    </div>
                )}
            </div>
        );
    }

    return null;
});

const MemoizedStoryList = React.memo(({ messages, onReroll, onContinue, protagonist, allCharacters }) => {
    const lastAiIndex = useMemo(() => messages.findLastIndex(msg => msg.sender === 'ai'), [messages]);
    
    return messages.map((msg, index) => (
        <StoryBlock 
            key={msg.id} 
            message={msg} 
            onReroll={onReroll} 
            onContinue={onContinue}
            isLastAiMessage={msg.sender === 'ai' && index === lastAiIndex}
            protagonist={protagonist}
            allCharacters={allCharacters}
        />
    ));
});

const WelcomeMessage = React.memo(({ isNewStoryDisabled }) => (
    <div className="text-center text-[var(--text-secondary)] h-full flex flex-col justify-center items-center animate-fadeIn">
        <ICONS.LucideBookCopy size={48} className="mb-4 opacity-30" />
        <h2 className="text-2xl font-bold text-[var(--text-primary)] font-serif">새로운 세계가 당신을 기다립니다</h2>
        <p className="mt-2 max-w-md font-sans">왼쪽 컨트롤 타워에서 당신의 세계를 설정하고, '새 이야기 시작' 버튼을 눌러 AI가 그려내는 첫 장면을 만나보세요.</p>
        {isNewStoryDisabled && (
            <p className="mt-4 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded-md border border-yellow-200 dark:border-yellow-800 font-sans">'새 이야기 시작' 버튼이 비활성화되었습니다. [로어북] 탭에서 '장르'와 '세계관'을, [캐릭터] 탭에서 주인공의 이름을 설정해주세요.</p>
        )}
    </div>
));

function MainViewFunc({ onToggleSidebar }) {
  // 데이터와 UI 상태, 핸들러를 각 Context에서 분리하여 가져옵니다.
  const { storyId, messages, lorebook, characters, storyTitle, handleSendMessage, handleReroll, handleContinue } = useContext(StoryDataContext);
  const { isProcessing, reEvaluation } = useContext(UIStateContext);
  
  const [userInput, setUserInput] = useState('');

  const chatEndRef = useRef(null);
  const isAnythingLoading = isProcessing || reEvaluation.isLoading;

  const protagonist = useMemo(() => characters.find(c => c.isProtagonist), [characters]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAnythingLoading]);

  const handleSendClick = () => {
    if (!userInput.trim()) return;
    handleSendMessage(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const isNewStoryDisabled = useMemo(() => !lorebook.genre || !lorebook.worldview || !protagonist?.name, [lorebook, protagonist]);

  return (
    <main className="flex-1 flex flex-col bg-[var(--bg)] overflow-hidden">
        <header className="md:hidden p-2 border-b border-[var(--border)] flex items-center justify-between bg-[var(--panel-bg)]">
            <button onClick={onToggleSidebar} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ICONS.LucideMenu size={24} />
            </button>
            <h1 className="text-lg font-bold text-[var(--text-primary)] truncate font-sans">
                {storyTitle || "ANIMA"}
            </h1>
            <div className="w-10"></div>
        </header>

      <div className="flex-1 p-4 sm:p-8 md:p-12 lg:p-16 overflow-y-auto">
        <div className="max-w-3xl mx-auto">
          {storyId ? (
            <MemoizedStoryList 
                messages={messages}
                onReroll={handleReroll}
                onContinue={handleContinue}
                protagonist={protagonist}
                allCharacters={characters}
            />
          ) : (
            <WelcomeMessage isNewStoryDisabled={isNewStoryDisabled} />
          )}
          
          {isAnythingLoading && <LoadingBlock />}

          <div ref={chatEndRef} />
        </div>
      </div>
      <div className="p-4 border-t border-[var(--border)] bg-[var(--bg)]">
        <div className="relative max-w-3xl mx-auto group">
          <textarea
            className="w-full bg-[var(--panel-bg-alt)] text-[var(--text-primary)] rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] border border-[var(--border)] transition-all duration-200 font-serif text-lg"
            rows="3"
            placeholder={!storyId ? "먼저 '새 이야기 시작' 버튼을 눌러주세요." : "주인공의 행동이나 대사를 입력하세요..."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAnythingLoading || !storyId}
          />
          <button onClick={handleSendClick} disabled={isAnythingLoading || !userInput.trim() || !storyId} className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-[var(--accent)] text-white hover:opacity-90 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all shadow-lg shadow-[var(--accent-shadow)]">
            <ICONS.LucideSend className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}

const MainView = React.memo(MainViewFunc);
export default MainView;
