import React from 'react';
import { ICONS } from '../../../constants';

/**
 * 저장된 이야기 목록을 보여주는 모달
 */
export const StoryListModal = ({ isOpen, stories, onLoad, onDelete, onClose }) => {
    if (!isOpen) return null;
    return ( 
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50 animate-fadeIn backdrop-blur-sm"> 
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col border border-[var(--border)]"> 
                <header className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h2 className="text-lg font-bold text-[var(--accent)] font-sans">이야기 목록</h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><ICONS.LucideX /></button>
                </header> 
                <div className="p-2 overflow-y-auto">
                    {stories.length === 0 ? (
                        <p className="text-[var(--text-secondary)] text-center py-8 font-sans">저장된 이야기가 없습니다.</p>
                    ) : (
                        <ul className="space-y-2 p-2">
                            {stories.map(story => (
                                <li key={story.id} className="flex items-center justify-between p-3 bg-[var(--panel-bg-alt)] hover:bg-[var(--border)] rounded-lg transition-colors duration-200 font-sans group">
                                    <span className="font-semibold text-[var(--text-primary)]">{story.title}</span>
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onLoad(story.id)} className="px-3 py-1 bg-[var(--accent)] text-white text-xs rounded-md hover:opacity-90 transition-opacity">불러오기</button>
                                        <button onClick={() => onDelete(story)} className="p-1 text-[var(--text-secondary)] hover:text-red-500 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div> 
            </div> 
        </div> 
    )
};
