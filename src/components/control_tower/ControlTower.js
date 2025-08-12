// src/components/control_tower/ControlTower.js
import React, { useState, useMemo } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import {
    ReEvaluationModal, StoryListModal, ConfirmationModal, BlueprintTemplateModal,
    CharacterTemplateModal, SaveCharacterTemplateModal
} from '../ui';
import { SettingsButtons, WorldClock } from '../ui/widgets';
import { ICONS } from '../../constants';
import CharacterTab from './tabs/CharacterTab';
import ContextTab from './tabs/ContextTab';
import SettingsTab from './tabs/SettingsTab';
import OocControlTab from './tabs/OocControlTab';
// AssetTab is no longer needed
// import AssetTab from './tabs/AssetTab'; 

// Receive onToggleAssetExplorer prop
function ControlTowerFunc({ isOpen, onToggle, onEditCharacter, onTogglePdChat, onToggleForge, onToggleAssetExplorer, activeTab, onTabChange, onToggleFloater }) {
  const { storyProps, handlerProps } = useStoryContext();
  const {
    storyId, storyTitle, storyList, blueprintTemplates, characterTemplates, worldState,
    characters, contextSettings, isProcessing, isTemplateModalOpen, isCharacterTemplateModalOpen,
    characterToSave
  } = storyProps;

  const {
    handleNewScene, handleSaveStory, handleLoadStory, handleDeleteStory,
    handleSaveBlueprintTemplate, handleDeleteBlueprintTemplate, setContextSettings,
    handleLoadCharacterTemplate, handleDeleteCharacterTemplate, handleConfirmSaveCharacterTemplate,
    setIsTemplateModalOpen, setIsCharacterTemplateModalOpen, setCharacterToSave
  } = handlerProps;

  const [isStoryListOpen, setIsStoryListOpen] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);

  const confirmDeleteStory = (story) => { setStoryToDelete(story); };
  const executeDeleteStory = () => {
      if (!storyToDelete) return;
      handleDeleteStory(storyToDelete.id);
      setStoryToDelete(null);
      setIsStoryListOpen(false);
  };

  const navItems = [
    { id: 'character', icon: ICONS.LucideUsers, label: '인물' },
    { id: 'context', icon: ICONS.LucideClipboardList, label: '상황' },
    { id: 'assets', icon: ICONS.LucideGalleryHorizontal, label: '에셋' },
    { id: 'forge', icon: ICONS.LucideHammer, label: '포지' },
    { id: 'settings', icon: ICONS.LucideSettings, label: 'AI 설정' },
    { id: 'ooc', icon: ICONS.LucideMessageCircle, label: '연출' },
  ];

  // Modify handleTabClick to open modals for 'forge' and 'assets'
  const handleTabClick = (tabId) => {
    if (tabId === 'forge') {
      onToggleForge();
    } else if (tabId === 'assets') {
      onToggleAssetExplorer();
    } else {
      onTabChange(tabId);
    }
  };

  // Remove 'assets' case from renderTabContent
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'character': return <CharacterTab onEditCharacter={onEditCharacter} onToggleFloater={onToggleFloater} />;
      case 'context': return <ContextTab />;
      // case 'assets': return <AssetTab />; // Removed
      case 'settings': return <SettingsTab />;
      case 'ooc': return <OocControlTab onTogglePdChat={onTogglePdChat} />;
      default: return null;
    }
  }, [activeTab, onEditCharacter, onTogglePdChat, onToggleFloater]);

  const user = characters.find(c => c.isUser);
  const isNewSceneDisabled = !contextSettings.situation || !user?.name || characters.filter(c => !c.isUser).length === 0;

  const handleLoadBlueprint = (template) => {
    if (template && template.contextSettings) {
        setContextSettings(template.contextSettings);
    } else {
        setContextSettings(prev => ({ ...prev, situation: template.situation }));
    }
  };

  const handleLoadCharacterAndClose = (template) => {
    handleLoadCharacterTemplate(template);
    setIsCharacterTemplateModalOpen(false);
  };

  return (
    <>
      <aside className="control-tower-sidebar">
        <div className="flex flex-col flex-grow min-h-0">
          <header className="p-4 border-b border-[var(--border-primary)] flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <img src="/logo.png" alt="App Logo" className="w-9 h-9 rounded-lg mr-3 shadow-md" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/36x36/8A2BE2/FFFFFF?text=A' }}/>
                <div className="flex flex-col min-w-0">
                  <h1 className="text-base font-bold truncate text-[var(--text-primary)]">{storyTitle || '새로운 장면'}</h1>
                  {storyId && <WorldClock worldState={worldState} />}
                </div>
              </div>
              <button onClick={onToggle} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors md:hidden">
                  <ICONS.LucideX />
              </button>
            </div>
          </header>

          <nav className="p-2 border-b border-[var(--border-primary)] flex-shrink-0">
            <div className="flex items-center justify-around bg-[var(--bg-primary)] p-1 rounded-lg">
              {navItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  title={item.label}
                  className={`flex-1 py-2 px-1 text-sm font-semibold rounded-md transition-all duration-200 flex flex-col items-center justify-center h-16 ${activeTab === item.id && !['forge', 'assets'].includes(item.id) ? 'bg-[var(--accent-primary)] text-white shadow-lg shadow-[var(--accent-shadow)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'}`}
                >
                  <item.icon size={20} />
                  <span className="mt-1 text-xs">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>

          <div className="flex-grow p-4 overflow-y-auto min-h-0 bg-[var(--bg-primary)]">
            {renderTabContent}
          </div>

          <footer className="p-3 border-t border-[var(--border-primary)] bg-[var(--bg-secondary)] flex-shrink-0">
            <SettingsButtons
              onSave={handleSaveStory}
              onNewStory={handleNewScene}
              onListOpen={() => setIsStoryListOpen(true)}
              isLoading={isProcessing}
              isNewStoryDisabled={isNewSceneDisabled}
              storyId={storyId}
              newStoryButtonText="새 장면 시작"
              newStoryButtonTooltip={isNewSceneDisabled ? "장면을 시작하려면 [상황] 탭에서 상황을, [인물] 탭에서 유저와 1명 이상의 페르소나를 설정해야 합니다." : "새로운 장면을 시작합니다."}
            />
          </footer>
        </div>
      </aside>

      <StoryListModal 
        isOpen={isStoryListOpen} 
        stories={storyList} 
        onLoad={(id) => { handleLoadStory(id); setIsStoryListOpen(false); }} 
        onDelete={confirmDeleteStory} 
        onClose={() => setIsStoryListOpen(false)} 
      />
      <ConfirmationModal isOpen={!!storyToDelete} onClose={() => setStoryToDelete(null)} onConfirm={executeDeleteStory} title="장면 삭제 확인">
        <p className="font-sans">정말로 <strong className="text-[var(--accent-primary)]">{storyToDelete?.title}</strong> 장면을 삭제하시겠습니까?</p>
      </ConfirmationModal>
      <ReEvaluationModal />
      <BlueprintTemplateModal isOpen={isTemplateModalOpen} templates={blueprintTemplates} onSave={handleSaveBlueprintTemplate} onLoad={handleLoadBlueprint} onDelete={handleDeleteBlueprintTemplate} onClose={() => setIsTemplateModalOpen(false)} />
      <CharacterTemplateModal isOpen={isCharacterTemplateModalOpen} templates={characterTemplates} onLoad={handleLoadCharacterAndClose} onDelete={handleDeleteCharacterTemplate} onClose={() => setIsCharacterTemplateModalOpen(false)} />
      <SaveCharacterTemplateModal character={characterToSave} onSave={handleConfirmSaveCharacterTemplate} onClose={() => setCharacterToSave(null)} />
    </>
  );
}

const ControlTower = React.memo(ControlTowerFunc);
export default ControlTower;
