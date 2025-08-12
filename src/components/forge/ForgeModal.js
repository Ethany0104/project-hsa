// src/components/forge/ForgeModal.js
import React, { useState, useEffect, useMemo } from 'react';
import { useStoryContext } from '../../contexts/StoryProvider';
import { Card, CardHeader } from '../ui/layouts';
import { EditableField } from '../ui/forms';
import { ConfirmationModal } from '../ui/modals';
// --- [FIX] LucideExpand 아이콘을 추가합니다. ---
import { ICONS } from '../../constants';
import SandboxPreview from './SandboxPreview';
import CodeEditor from '../ui/CodeEditor';
import ForgeManager from './ForgeManager';
import { BUILTIN_TOOLS } from './builtinTools';

// --- [NEW] 코드 편집 전용 모달 컴포넌트를 추가합니다. ---
const CodeEditModal = ({ isOpen, onClose, language, value, onChange }) => {
  if (!isOpen) return null;

  const languageMap = {
    html: 'HTML',
    css: 'CSS',
    javascript: 'JavaScript'
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4" style={{ zIndex: 'var(--z-confirmation-modal)' }}>
      <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col border border-[var(--border-primary)] overflow-hidden">
        <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
          <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
            <ICONS.LucideCode size={20} className="mr-3" />
            {languageMap[language] || 'Code'} Editor
          </h2>
          <button onClick={onClose} className="px-4 py-2 bg-[var(--accent-primary)] text-white text-sm font-bold rounded-lg hover:opacity-90 transition-colors">
            완료
          </button>
        </header>
        <div className="flex-grow min-h-0">
          <CodeEditor language={language} value={value} onChange={onChange} height="100%" />
        </div>
      </div>
    </div>
  );
};


const DEFAULT_TOOL = {
  id: null,
  type: 'component',
  name: 'custom:',
  description: '',
  params: '{}',
  htmlCode: `<div class="flex items-center justify-center h-full bg-gray-800">\n  <button class="px-4 py-2 bg-purple-600 text-white rounded-lg">Click Me</button>\n</div>`,
  cssCode: `body { margin: 0; font-family: sans-serif; }`,
  jsCode: `console.log("Hello from new tool!");`
};

const ForgeModal = ({ isOpen, onClose }) => {
  const { storyProps, handlerProps } = useStoryContext();
  const { customTools } = storyProps;
  const { handleSaveCustomTool, handleDeleteCustomTool } = handlerProps;

  const [activeTool, setActiveTool] = useState(null);
  const [toolToDelete, setToolToDelete] = useState(null);

  const [htmlCode, setHtmlCode] = useState('');
  const [cssCode, setCssCode] = useState('');
  const [jsCode, setJsCode] = useState('');
  const [toolName, setToolName] = useState('');
  const [toolType, setToolType] = useState('component');
  const [toolDescription, setToolDescription] = useState('');
  const [toolParams, setToolParams] = useState('{}');
  
  // --- [NEW] 코드 편집 모달을 위한 상태를 추가합니다. ---
  const [codeEditModal, setCodeEditModal] = useState({ isOpen: false, language: null, value: '', onChange: null });

  const allTools = useMemo(() => [...BUILTIN_TOOLS, ...customTools], [customTools]);

  useEffect(() => {
    if (activeTool) {
      setHtmlCode(activeTool.htmlCode || '');
      setCssCode(activeTool.cssCode || '');
      setJsCode(activeTool.jsCode || '');
      setToolName(activeTool.name || '');
      setToolType(activeTool.type || 'component');
      setToolDescription(activeTool.description || '');
      setToolParams(activeTool.params || '{}');
    } else {
      setActiveTool(null);
    }
  }, [activeTool]);

  const handleSelectTool = (tool) => setActiveTool(tool);
  const handleNewTool = () => setActiveTool({ ...DEFAULT_TOOL, id: `new_${Date.now()}` });

  const handleSave = async () => {
    if (!activeTool || activeTool.isBuiltIn) return;
    const toolToSave = { ...activeTool, name: toolName, type: toolType, description: toolDescription, params: toolParams, htmlCode, cssCode, jsCode };
    await handleSaveCustomTool(toolToSave);
  };

  const confirmDelete = (tool) => setToolToDelete(tool);
  const executeDelete = () => {
    if (!toolToDelete) return;
    handleDeleteCustomTool(toolToDelete.id);
    if (activeTool?.id === toolToDelete.id) setActiveTool(null);
    setToolToDelete(null);
  };
  
  // --- [NEW] 코드 편집 모달을 열고 닫는 핸들러 함수들을 추가합니다. ---
  const openCodeEditor = (language, value, onChange) => {
    setCodeEditModal({
      isOpen: true,
      language,
      value,
      onChange,
    });
  };

  const closeCodeEditor = () => {
    setCodeEditModal(prev => ({ ...prev, isOpen: false }));
  };
  
  const handleCodeChangeInModal = (newValue) => {
    // 모달의 onChange 콜백을 호출하여 ForgeModal의 상태(htmlCode 등)를 업데이트합니다.
    codeEditModal.onChange(newValue);
    // 모달 자체의 value 상태도 업데이트하여 에디터에 변경사항이 즉시 반영되도록 합니다.
    setCodeEditModal(prev => ({ ...prev, value: newValue }));
  };

  if (!isOpen) return null;

  const isReadOnly = activeTool?.isBuiltIn || false;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex justify-center items-center animate-fadeIn backdrop-blur-sm p-4" style={{ zIndex: 'var(--z-pd-chat-modal)' }}>
        <div className="panel-ui rounded-2xl shadow-2xl w-full max-w-7xl h-full max-h-[95vh] flex flex-col border border-[var(--border-primary)] overflow-hidden">
          <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
            <div className="flex items-center">
              <ICONS.LucideHammer className="w-6 h-6 mr-3 text-[var(--accent-primary)]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-sans">ISC 포지 (Forge)</h2>
            </div>
            <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
          </header>

          <main className="flex-grow flex flex-row min-h-0">
            <div className="w-1/4 min-w-[320px] border-r border-[var(--border-primary)] flex flex-col">
              <ForgeManager customTools={allTools} activeTool={activeTool} onSelectTool={handleSelectTool} onDeleteTool={confirmDelete} onNewTool={handleNewTool} />
            </div>

            <div className="w-3/4 flex-grow flex flex-row">
              {activeTool ? (
                <>
                  <div className="w-1/2 flex flex-col p-4 space-y-4 overflow-y-auto">
                    <Card>
                      <CardHeader icon={ICONS.LucideInfo} title="AI 연동 정보">
                        <button onClick={handleSave} disabled={isReadOnly} className="px-4 py-2 bg-[var(--success)] text-white text-sm font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                          <ICONS.LucideSave size={16} className="inline-block mr-2" /> 저장
                        </button>
                      </CardHeader>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <EditableField label="호출 이름 (Invocation Name)" value={toolName} onChange={e => setToolName(e.target.value)} placeholder="예: custom:DiceRollUI" disabled={isReadOnly} />
                          <div>
                            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">툴 타입</label>
                            <select value={toolType} onChange={e => setToolType(e.target.value)} className="w-full bg-[var(--input-bg)] p-2.5 rounded-lg text-sm" disabled={isReadOnly}>
                              <option value="component">UI 컴포넌트</option>
                              <option value="logic">로직 스크립트</option>
                            </select>
                          </div>
                        </div>
                        <EditableField isTextarea rows={2} label="AI용 설명" value={toolDescription} onChange={e => setToolDescription(e.target.value)} disabled={isReadOnly} />
                        <EditableField isTextarea rows={2} label="필요 파라미터 (JSON)" value={toolParams} onChange={e => setToolParams(e.target.value)} disabled={isReadOnly} />
                      </div>
                    </Card>

                    {toolType === 'component' ? (
                      <>
                        <Card>
                          <CardHeader icon={ICONS.LucideFileCode} title="HTML">
                            <button onClick={() => openCodeEditor('html', htmlCode, setHtmlCode)} title="전체 화면으로 편집" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><ICONS.LucideExpand size={16} /></button>
                          </CardHeader>
                          <CodeEditor language="html" value={htmlCode} onChange={setHtmlCode} height="150px" readOnly={isReadOnly} />
                        </Card>
                        <Card>
                          <CardHeader icon={ICONS.LucideFileCode} title="CSS">
                             <button onClick={() => openCodeEditor('css', cssCode, setCssCode)} title="전체 화면으로 편집" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><ICONS.LucideExpand size={16} /></button>
                          </CardHeader>
                          <CodeEditor language="css" value={cssCode} onChange={setCssCode} height="150px" readOnly={isReadOnly} />
                        </Card>
                        <Card>
                          <CardHeader icon={ICONS.LucideCog} title="JavaScript">
                            <button onClick={() => openCodeEditor('javascript', jsCode, setJsCode)} title="전체 화면으로 편집" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><ICONS.LucideExpand size={16} /></button>
                          </CardHeader>
                          <CodeEditor language="javascript" value={jsCode} onChange={setJsCode} height="150px" readOnly={isReadOnly} />
                        </Card>
                      </>
                    ) : (
                      <Card className="flex-grow flex flex-col">
                        <CardHeader icon={ICONS.LucideCog} title="JavaScript">
                           {/* --- [FIX] 로직 스크립트 JS 에디터에도 전체 화면 버튼 추가 --- */}
                           <button onClick={() => openCodeEditor('javascript', jsCode, setJsCode)} title="전체 화면으로 편집" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"><ICONS.LucideExpand size={16} /></button>
                        </CardHeader>
                        <CodeEditor language="javascript" value={jsCode} onChange={setJsCode} height="100%" readOnly={isReadOnly} />
                      </Card>
                    )}
                  </div>

                  <div className="w-1/2 flex flex-col p-4 pl-0">
                    {toolType === 'component' ? (
                      <Card className="h-full flex flex-col">
                        <CardHeader icon={ICONS.LucideEye} title="실시간 미리보기" />
                        <div className="flex-grow bg-black rounded-md">
                          <SandboxPreview htmlCode={htmlCode} cssCode={cssCode} jsCode={jsCode} />
                        </div>
                      </Card>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-center text-gray-500">
                         <div className="p-4 bg-[var(--bg-tertiary)] rounded-lg">
                           <ICONS.LucideCog size={48} className="mx-auto mb-4 opacity-50"/>
                           <p>로직 스크립트는<br/>미리보기를 지원하지 않습니다.</p>
                         </div>
                       </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-center text-gray-500">
                  <p>왼쪽 목록에서 툴을 선택하거나 '새 툴 만들기'를 눌러<br/>새로운 창작을 시작하세요.</p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
      <ConfirmationModal isOpen={!!toolToDelete} onClose={() => setToolToDelete(null)} onConfirm={executeDelete} title="커스텀 툴 삭제 확인">
        <p>정말로 <strong className="text-[var(--accent-primary)]">{toolToDelete?.name}</strong> 툴을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
      </ConfirmationModal>
      
      <CodeEditModal
        isOpen={codeEditModal.isOpen}
        onClose={closeCodeEditor}
        language={codeEditModal.language}
        value={codeEditModal.value}
        onChange={handleCodeChangeInModal}
      />
    </>
  );
};

export default ForgeModal;
