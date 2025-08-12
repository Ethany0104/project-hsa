// src/components/MainView.js
import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { useStoryContext } from '../contexts/StoryProvider';
import { ICONS } from '../constants';
import { LoadingBlock } from './ui';
import StoryBlock from './main_view_parts/StoryBlock';
import WelcomeMessage from './main_view_parts/WelcomeMessage';
import BackgroundSlideshow from './main_view_parts/BackgroundSlideshow';
import { VariableSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Row 컴포넌트
const Row = React.memo(({ index, style, data }) => {
    // --- [FIX] onComponentAction, onLogicResult를 data에서 추출합니다. ---
    const { messages, onReroll, onContinue, user, allCharacters, lastAiIndex, setSize, onComponentAction, onLogicResult } = data;
    const msg = messages[index];
    const rowRef = useRef(null);

    useEffect(() => {
        if (rowRef.current) {
            const observer = new ResizeObserver(() => {
                if(rowRef.current) {
                    setSize(index, rowRef.current.getBoundingClientRect().height);
                }
            });
            observer.observe(rowRef.current);
            return () => observer.disconnect();
        }
    }, [index, setSize]);

    return (
        <div style={style}>
            <div ref={rowRef} className="py-4">
                <StoryBlock
                    key={msg.id}
                    message={msg}
                    onReroll={onReroll}
                    onContinue={onContinue}
                    isLastAiMessage={msg.sender === 'ai' && index === lastAiIndex}
                    user={user}
                    allCharacters={allCharacters}
                    // --- [FIX] 추출한 핸들러를 StoryBlock으로 전달합니다. ---
                    onComponentAction={onComponentAction}
                    onLogicResult={onLogicResult}
                />
            </div>
        </div>
    );
});

// MemoizedStoryList 컴포넌트
const MemoizedStoryList = React.memo(({ messages, onReroll, onContinue, user, allCharacters, onComponentAction, onLogicResult }) => {
    const lastAiIndex = useMemo(() => messages.findLastIndex(msg => msg.sender === 'ai'), [messages]);
    const listRef = useRef(null);
    const sizeMap = useRef({});

    const setSize = useCallback((index, size) => {
        if (sizeMap.current[index] !== size) {
            sizeMap.current = { ...sizeMap.current, [index]: size };
            if (listRef.current) {
                listRef.current.resetAfterIndex(index);
            }
        }
    }, []);

    const getSize = index => sizeMap.current[index] || 250;

    useEffect(() => {
        if (listRef.current) {
            listRef.current.scrollToItem(messages.length - 1, 'end');
        }
    }, [messages.length]);

    return (
        <div className="w-full h-full">
            <AutoSizer>
                {({ height, width }) => (
                    <List
                        ref={listRef}
                        height={height}
                        itemCount={messages.length}
                        itemSize={getSize}
                        width={width}
                        itemData={{
                            messages,
                            onReroll,
                            onContinue,
                            user,
                            allCharacters,
                            lastAiIndex,
                            setSize,
                            // --- [FIX] 핸들러를 Row 컴포넌트로 전달하기 위해 itemData에 포함시킵니다. ---
                            onComponentAction,
                            onLogicResult
                        }}
                    >
                        {Row}
                    </List>
                )}
            </AutoSizer>
        </div>
    );
});


function MainViewFunc({ onToggleSidebar, personaImages }) {
    const { storyProps, handlerProps } = useStoryContext();
    const {
        storyId, messages, contextSettings, characters, storyTitle,
        isProcessing, reEvaluation
    } = storyProps;

    const {
        handleSendMessage, handleReroll, handleContinue,
    } = handlerProps;

    const [userInput, setUserInput] = useState('');
    const [isBackgroundFocused, setIsBackgroundFocused] = useState(false);
    const isAnythingLoading = isProcessing || reEvaluation.isLoading;
    const user = useMemo(() => characters.find(c => c.isUser), [characters]);

    const activateFocus = (e) => {
        if (e.target === e.currentTarget) {
            setIsBackgroundFocused(true);
        }
    };

    const deactivateFocus = () => {
        setIsBackgroundFocused(false);
    };

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

    const handleComponentAction = useCallback((actionId, payload) => {
        const actionMessage = `[사용자 상호작용] '${actionId}' 액션을 실행했습니다. 추가 정보: ${JSON.stringify(payload)}`;
        handleSendMessage(actionMessage);
    }, [handleSendMessage]);

    const handleLogicResult = useCallback((resultData) => {
        const resultMessage = `[로직 실행 결과] 스크립트 '${resultData.script}'가 실행되었습니다. 결과: ${JSON.stringify(resultData.result)}`;
        handleSendMessage(resultMessage);
    }, [handleSendMessage]);

    const isNewSceneDisabled = useMemo(() => !contextSettings.situation || !user?.name || characters.filter(c => !c.isUser).length === 0, [contextSettings, user, characters]);

    return (
        <main className="main-view-content relative">
            <div 
                className="absolute inset-0 w-full h-full z-0"
                onClick={deactivateFocus}
            >
                <BackgroundSlideshow images={personaImages} isFocused={isBackgroundFocused} />
            </div>

            <div className={`relative z-10 flex flex-col h-full transition-opacity duration-500 ${isBackgroundFocused ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                <header className="md:hidden p-2 border-b border-[var(--border-primary)] flex items-center justify-between bg-[var(--bg-secondary)]/80 backdrop-blur-sm flex-shrink-0">
                    <button onClick={onToggleSidebar} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <ICONS.LucideMenu size={24} />
                    </button>
                    <h1 className="text-base font-bold text-[var(--text-primary)] truncate font-sans">
                        {storyTitle || "Roleplay Studio"}
                    </h1>
                    <div className="w-10"></div>
                </header>

                <div className="flex-1 overflow-y-auto h-full" onClick={activateFocus}>
                    <div className="max-w-4xl mx-auto p-4 sm:p-8 md:p-12 h-full">
                        {storyId ? (
                            <MemoizedStoryList
                                messages={messages}
                                onReroll={handleReroll}
                                onContinue={handleContinue}
                                user={user}
                                allCharacters={characters}
                                // --- [FIX] 생성된 핸들러를 하위 컴포넌트로 전달합니다. ---
                                onComponentAction={handleComponentAction}
                                onLogicResult={handleLogicResult}
                            />
                        ) : (
                            <WelcomeMessage isNewSceneDisabled={isNewSceneDisabled} />
                        )}
                    </div>
                </div>

                <div className="p-4 pt-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/80 backdrop-blur-sm flex-shrink-0">
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
            </div>
        </main>
    );
}

const MainView = React.memo(MainViewFunc);
export default MainView;
