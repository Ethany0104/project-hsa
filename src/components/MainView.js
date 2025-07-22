import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useStoryContext } from '../contexts/StoryProvider';
import { ICONS } from '../constants';
import { LoadingBlock } from './ui';
import StoryBlock from './main_view_parts/StoryBlock';
import WelcomeMessage from './main_view_parts/WelcomeMessage';

const MemoizedStoryList = React.memo(({ messages, onReroll, onContinue, user, allCharacters }) => {
    const lastAiIndex = useMemo(() => messages.findLastIndex(msg => msg.sender === 'ai'), [messages]);
    return messages.map((msg, index) => (
        <StoryBlock
            key={msg.id}
            message={msg}
            onReroll={onReroll}
            onContinue={onContinue}
            isLastAiMessage={msg.sender === 'ai' && index === lastAiIndex}
            user={user}
            allCharacters={allCharacters}
        />
    ));
});

function MainViewFunc({ onToggleSidebar }) {
    const { storyProps, handlerProps } = useStoryContext();
  const {
    storyId, messages, contextSettings, characters, storyTitle,
    isProcessing, reEvaluation
  } = storyProps;

  const {
    handleSendMessage, handleReroll, handleContinue,
  } = handlerProps;

  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef(null);
    const isAnythingLoading = isProcessing || reEvaluation.isLoading;
  const user = useMemo(() => characters.find(c => c.isUser), [characters]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendClick = () => {
    if (!userInput.trim() || isAnythingLoading || !storyId) return;
    handleSendMessage(userInput);
    setUserInput('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendClick();
    }
  };

  const isNewSceneDisabled = useMemo(() => !contextSettings.situation || !user?.name || characters.filter(c => !c.isUser).length === 0, [contextSettings, user, characters]);

  return (
    <main className="main-view-content">
        <header className="md:hidden p-2 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)] flex-shrink-0">
            <button onClick={onToggleSidebar} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                <ICONS.LucideMenu size={24} />
            </button>
            <h1 className="text-base font-bold text-[var(--text-primary)] truncate font-sans">
                {storyTitle || "Roleplay Studio"}
            </h1>
            <div className="w-10"></div>
        </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12 h-full">
          {storyId ? (
            <MemoizedStoryList
                messages={messages}
                onReroll={handleReroll}
                onContinue={handleContinue}
                user={user}
                allCharacters={characters}
            />
          ) : (
            <WelcomeMessage isNewSceneDisabled={isNewSceneDisabled} />
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      <div className="p-4 pt-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)] flex-shrink-0">
        <div className="h-12 flex items-center justify-center">
          {isAnythingLoading && <LoadingBlock />}
        </div>

        <div className="relative max-w-4xl mx-auto">
          <textarea
            className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-xl p-4 pr-16 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] border border-[var(--border-primary)] transition-all duration-200 font-serif text-lg leading-relaxed shadow-lg"
            rows="3"
            placeholder={!storyId ? "지휘 패널에서 '새 장면 시작'을 먼저 실행하십시오." : "당신의 행동, 대사, 또는 생각을 서술하십시오..."}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isAnythingLoading || !storyId}
          />
          <button
            onClick={handleSendClick}
            disabled={isAnythingLoading || !userInput.trim() || !storyId}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-[var(--accent-primary)] text-white hover:bg-[var(--accent-secondary)] disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-disabled)] disabled:cursor-not-allowed transition-all duration-200"
            title="명령 전송"
          >
            <ICONS.LucideSend className="w-6 h-6" />
          </button>
        </div>
      </div>
    </main>
  );
}

const MainView = React.memo(MainViewFunc);
export default MainView;
