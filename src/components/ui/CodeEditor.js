// src/components/forge/CodeEditor.js
import React from 'react';
import Editor from '@monaco-editor/react';

/**
 * Monaco Editor를 래핑하는 재사용 가능한 코드 에디터 컴포넌트입니다.
 * @param {object} props - { language, value, onChange, height }
 */
const CodeEditor = ({ language, value, onChange, height = '200px' }) => {
  
  const handleEditorChange = (newValue) => {
    onChange(newValue || '');
  };

  const editorOptions = {
    minimap: { enabled: false }, // 미니맵 비활성화
    fontSize: 14,
    wordWrap: 'on', // 자동 줄바꿈
    scrollBeyondLastLine: false,
    automaticLayout: true, // 컨테이너 크기 변경 시 자동 레이아웃 조정
  };

  return (
    <div 
      className="w-full rounded-md overflow-hidden border border-[var(--border-primary)]" 
      style={{ height: height }}
    >
      <Editor
        height="100%"
        language={language}
        value={value}
        onChange={handleEditorChange}
        theme="vs-dark" // 어두운 테마 사용
        options={editorOptions}
      />
    </div>
  );
};

export default CodeEditor;
