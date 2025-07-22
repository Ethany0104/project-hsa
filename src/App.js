import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStoryContext } from './contexts/StoryProvider';
import ControlTower from './components/control_tower/ControlTower';
import MainView from './components/MainView';
import { UserSheetContent } from './components/character/UserSheetContent';
import { PersonaSheetContent } from './components/character/PersonaSheetContent';
// [FEATURE] 새로 만든 PersonaStatusFloater와 SideSheet, Toast를 import합니다.
import { SideSheet, Toast, PersonaStatusFloater } from './components/ui';
import { PdChatModal } from './components/pd_chat/PdChatModal';
import './styles/theme.css';

function App() {
    const { storyProps, handlerProps } = useStoryContext();
  const {
    editingState,
    characters,
    toast,
    // [FEATURE] 현황 창 관련 상태를 context에서 가져옵니다.
    floatingStatusWindows,
    latestEmotionAnalysis,
  } = storyProps;

  const {
    setEditingState,
    setCharacters,
    setToast,
    // [FEATURE] 현황 창 토글 핸들러를 context에서 가져옵니다.
    handleToggleFloater,
  } = handlerProps;

  const [activeTab, setActiveTab] = useState('character');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isPdChatOpen, setIsPdChatOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth > 768);
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
          // [FEATURE] ControlTower에 핸들러를 전달합니다.
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

      {/* [FEATURE] 열려있는 현황 창들을 렌더링합니다. */}
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
