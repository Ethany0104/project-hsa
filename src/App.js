import React, { useState, useEffect } from 'react';
import { StoryProvider, useStoryContext } from './contexts/StoryProvider';
import ControlTower from './components/ControlTower';
import MainView from './components/MainView';
import { CharacterSheet } from './components/character/CharacterSheet';
// 수정: 이제 모든 모달을 './components/ui'에서 한번에 가져올 수 있습니다.
import { SideSheet, Toast, PdChatModal } from './components/ui';
import './styles/theme.css';

function App() {
  return (
    <StoryProvider>
      <AppContent />
    </StoryProvider>
  );
}

export default App;

const AppContent = React.memo(() => {
  const { storyProps, handlerProps } = useStoryContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [editingCharacter, setEditingCharacter] = useState(null);
  const [sheetSize, setSheetSize] = useState('default');
  const [isPdChatOpen, setIsPdChatOpen] = useState(false);

  useEffect(() => {
    document.body.setAttribute('data-theme', theme);
  }, [theme]);
  
  useEffect(() => {
    if (editingCharacter) {
      const updatedCharacterInList = storyProps.characters.find(c => c.id === editingCharacter.id);
      if (updatedCharacterInList && JSON.stringify(updatedCharacterInList) !== JSON.stringify(editingCharacter)) {
        setEditingCharacter(updatedCharacterInList);
      }
    }
  }, [storyProps.characters, editingCharacter]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const handleEditCharacter = (character) => {
    setSheetSize(character.isProtagonist ? 'narrow' : 'default');
    setEditingCharacter(character);
  };

  const handleCloseSheet = () => {
    setEditingCharacter(null);
  };
  
  const handleUpdateCharacter = (updatedCharacter) => {
      const { setCharacters } = handlerProps;
      setCharacters(prev => prev.map(c => c.id === updatedCharacter.id ? updatedCharacter : c));
  };

  const togglePdChat = () => setIsPdChatOpen(prev => !prev);

  return (
    <>
      <div className="relative flex h-screen overflow-hidden">
        <ControlTower 
          isOpen={isSidebarOpen}
          onToggle={toggleSidebar}
          theme={theme}
          onToggleTheme={toggleTheme}
          onEditCharacter={handleEditCharacter}
          onTogglePdChat={togglePdChat}
        />
        <MainView 
          onToggleSidebar={toggleSidebar}
        />
        <Toast 
          message={storyProps.toast.message} 
          show={storyProps.toast.show} 
          onDismiss={() => handlerProps.setToast({ show: false, message: '' })} 
        />
        <SideSheet 
            isOpen={!!editingCharacter} 
            onClose={handleCloseSheet}
            size={sheetSize}
        >
            {editingCharacter && (
                <CharacterSheet
                    character={editingCharacter}
                    onUpdate={handleUpdateCharacter}
                    onClose={handleCloseSheet}
                />
            )}
        </SideSheet>
        {/* 수정: PdChatModal은 이제 props를 받지 않고 내부에서 Context를 사용합니다. */}
        <PdChatModal
          isOpen={isPdChatOpen}
          onClose={togglePdChat}
        />
      </div>
    </>
  );
});
