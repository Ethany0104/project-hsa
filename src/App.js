import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useStoryContext } from './contexts/StoryProvider';
import ControlTower from './components/control_tower/ControlTower';
import MainView from './components/MainView';
import { UserSheetContent } from './components/character/UserSheetContent';
import { PersonaSheetContent } from './components/character/PersonaSheetContent';
import { SideSheet, Toast, PersonaStatusFloater, ImagePreviewModal } from './components/ui';
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
    imagePreviewUrl,
  } = storyProps;

  const {
    setEditingState,
    // [수정] handleUpdateAndSaveCharacter 대신 통합 핸들러인 handleCharacterUpdate를 가져옵니다.
    handleCharacterUpdate,
    setToast,
    handleToggleFloater,
    setImagePreviewUrl,
  } = handlerProps;

  const [activeTab, setActiveTab] = useState('character');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 768);
  const [isPdChatOpen, setIsPdChatOpen] = useState(false);
  
  const lastWidth = useRef(window.innerWidth);

  useEffect(() => {
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

  const editingCharacter = useMemo(() => {
    if (!editingState.characterId) return null;
    return characters.find(c => c.id === editingState.characterId);
  }, [editingState.characterId, characters]);

  const personaImages = useMemo(() => 
    characters
      .filter(c => !c.isUser && c.profileImageUrl)
      .map(c => c.profileImageUrl),
    [characters]
  );

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
        <MainView onToggleSidebar={toggleSidebar} personaImages={personaImages} />
        {isSidebarOpen && window.innerWidth <= 768 && (
          <div className="main-view-overlay" onClick={toggleSidebar}></div>
        )}
      </div>

      <Toast 
        message={toast.message} 
        show={toast.show} 
        onDismiss={() => setToast(prev => ({...prev, show: false}))} 
      />

      {/* [수정] onUpdate prop에 통합 핸들러인 handleCharacterUpdate를 전달합니다. */}
      <SideSheet isOpen={editingState.isOpen && editingState.type === 'user'} onClose={handleCloseSheets} size="narrow">
        {editingCharacter && <UserSheetContent character={editingCharacter} onUpdate={handleCharacterUpdate} onClose={handleCloseSheets} />}
      </SideSheet>

      <SideSheet isOpen={editingState.isOpen && editingState.type === 'persona'} onClose={handleCloseSheets} size="default">
        {editingCharacter && <PersonaSheetContent character={editingCharacter} onUpdate={handleCharacterUpdate} onClose={handleCloseSheets} />}
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
      <ImagePreviewModal 
        imageUrl={imagePreviewUrl} 
        onClose={() => setImagePreviewUrl(null)} 
      />
    </>
  );
}

export default App;
