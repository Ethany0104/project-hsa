import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStoryContext } from './contexts/StoryProvider';
import ControlTower from './components/control_tower/ControlTower';
import MainView from './components/MainView';
import { UserSheetContent } from './components/character/UserSheetContent';
import { PersonaSheetContent } from './components/character/PersonaSheetContent';
import { SideSheet, Toast, PersonaStatusFloater } from './components/ui';
import { PdChatModal } from './components/pd_chat/PdChatModal';
import './styles/theme.css';

function App() {
    const { storyProps, handlerProps } = useStoryContext();
  const {
    editingState,
    characters,
    toast,
    floatingStatusWindows,
    latestEmotionAnalysis,
  } = storyProps;

  const {
    setEditingState,
    setCharacters,
    setToast,
    handleToggleFloater,
  } = handlerProps;

  const [activeTab, setActiveTab] = useState('character');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isPdChatOpen, setIsPdChatOpen] = useState(false);
  
  // [BUG FIX] 마지막 창 너비를 기억하기 위한 ref를 추가합니다.
  const lastWidth = useRef(window.innerWidth);

  useEffect(() => {
    // [BUG FIX] 모바일에서 키보드가 나타날 때 발생하는 resize 이벤트를 필터링합니다.
    // 화면의 '너비'가 실제로 변경되었을 때만 사이드바 상태를 변경하도록 수정합니다.
    const handleResize = () => {
      if (window.innerWidth !== lastWidth.current) {
        setIsSidebarOpen(window.innerWidth > 768);
        lastWidth.current = window.innerWidth;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);
  const togglePdChat = useCallback(() => setIsPdChatOpen(prev => !prev), []);

  const handleEditCharacter = useCallback((character) => {
    setEditingState({
      isOpen: true,
      type: character.isUser ? 'user' : 'persona',
      characterId: character.id,
    });
  }, [setEditingState]);

  const handleCloseSheets = useCallback(() => {
    setEditingState(prev => ({ ...prev, isOpen: false }));
  }, [setEditingState]);

  const handleUpdateCharacter = useCallback((updatedCharacter) => {
    setCharacters(prev => prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
  }, [setCharacters]);

  const editingCharacter = useMemo(() => {
    if (!editingState.characterId) return null;
    return characters.find(c => c.id === editingState.characterId);
  }, [editingState.characterId, characters]);

  return (
    <>
      <div className={`app-layout ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <ControlTower
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          onEditCharacter={handleEditCharacter}
          onTogglePdChat={togglePdChat}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onToggleFloater={handleToggleFloater}
        />
        <MainView onToggleSidebar={toggleSidebar} />
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div className="main-view-overlay" onClick={toggleSidebar}></div>
        )}
      </div>

      <Toast 
        message={toast.message} 
        show={toast.show} 
        onDismiss={() => setToast(prev => ({...prev, show: false}))} 
      />

      <SideSheet isOpen={editingState.isOpen && editingState.type === 'user'} onClose={handleCloseSheets} size="narrow">
        {editingCharacter && <UserSheetContent character={editingCharacter} onUpdate={handleUpdateCharacter} onClose={handleCloseSheets} />}
      </SideSheet>

      <SideSheet isOpen={editingState.isOpen && editingState.type === 'persona'} onClose={handleCloseSheets} size="default">
        {editingCharacter && <PersonaSheetContent character={editingCharacter} onUpdate={handleUpdateCharacter} onClose={handleCloseSheets} />}
      </SideSheet>

      <PdChatModal isOpen={isPdChatOpen} onClose={togglePdChat} />

      {floatingStatusWindows.map(charId => {
          const char = characters.find(c => c.id === charId);
          if (!char) return null;
          return (
              <PersonaStatusFloater
                  key={char.id}
                  character={char}
                  latestEmotionAnalysis={latestEmotionAnalysis}
                  onClose={() => handleToggleFloater(char.id)}
              />
          );
      })}
    </>
  );
}

export default App;
