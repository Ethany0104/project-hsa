// src/components/forge/ForgeManager.js
import React from 'react';
import { ICONS } from '../../constants';
// --- [BUG FIX] 컴포넌트 임포트 경로를 'ui/index.js'가 아닌 'ui/layouts.js'로 직접 지정합니다. ---
import { Card, CardHeader } from '../ui/layouts';

/**
 * 저장된 커스텀 툴 목록을 관리하는 UI 컴포넌트입니다.
 * @param {object} props - { customTools, activeTool, onSelectTool, onDeleteTool, onNewTool }
 */
const ForgeManager = ({ customTools, activeTool, onSelectTool, onDeleteTool, onNewTool }) => {
  return (
    <Card>
        <CardHeader icon={ICONS.LucideCog} title="내 툴 목록">
          <button
          onClick={onNewTool}
          className="flex items-center px-2 py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] hover:bg-[var(--border-secondary)] rounded-md text-xs"
          >
          <ICONS.LucidePlus className="w-4 h-4 mr-1" /> 새 툴 만들기
        </button>
      </CardHeader>
      <div className="space-y-2 max-h-[calc(95vh-150px)] overflow-y-auto pr-2">
        {customTools.length > 0 ? (
          customTools.map(tool => (
            <div
              key={tool.id}
              className={`flex items-center justify-between p-3 rounded-lg group cursor-pointer transition-colors
                ${activeTool?.id === tool.id ? 'bg-[var(--accent-primary)]/20' : 'hover:bg-[var(--bg-tertiary)]'}`
              }
              onClick={() => onSelectTool(tool)}
            >
              <div className="flex items-center min-w-0 space-x-4">
                <div className="w-10 h-10 rounded-md bg-[var(--input-bg)] flex-shrink-0 flex items-center justify-center font-bold overflow-hidden">
                  {tool.type === 'component' ? <ICONS.LucideFileCode size={20} /> : <ICONS.LucideCog size={20} />}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className={`font-bold truncate ${activeTool?.id === tool.id ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'}`}>
                      {tool.name || '이름 없는 툴'}
                    </h3>
                    {tool.isBuiltIn && (
                      <span className="text-[10px] font-bold text-cyan-300 bg-cyan-800/50 px-2 py-0.5 rounded-full flex-shrink-0">
                        내장
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] break-words truncate">{tool.description || '설명 없음'}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 pl-2">
                {!tool.isBuiltIn && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteTool(tool); }}
                    title="삭제"
                    className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)]"
                  >
                    <ICONS.LucideTrash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ICONS.LucideArchiveX className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">저장된 툴이 없습니다.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default ForgeManager;
