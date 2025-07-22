import React from 'react';
import { ICONS } from '../../../constants';

/**
 * Modal to display the list of saved stories.
 */
export const StoryListModal = ({ isOpen, stories, onLoad, onDelete, onClose }) => {
    if (!isOpen) return null;

    return ( 
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-[140] animate-fadeIn backdrop-blur-sm p-4"> 
            <div className="panel-ui rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col border border-[var(--border-primary)]"> 
                <header className="p-4 border-b border-[var(--border-primary)] flex justify-between items-center flex-shrink-0">
                    <h2 className="text-lg font-bold text-[var(--accent-primary)] font-sans flex items-center">
                        <ICONS.LucideLibrary className="w-5 h-5 mr-3" />
                        이야기 불러오기
                    </h2>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-1 rounded-full hover:bg-[var(--bg-tertiary)]"><ICONS.LucideX /></button>
                </header> 
                <div className="p-2 overflow-y-auto">
                    {stories.length === 0 ? (
                        <div className="text-center py-16 text-[var(--text-secondary)]">
                            <ICONS.LucideArchiveX className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p className="font-sans">저장된 이야기가 없습니다.</p>
                        </div>
                    ) : (
                        <ul className="space-y-2 p-2">
                            {stories.map(story => (
                                <li key={story.id} className="flex items-center justify-between p-3 bg-[var(--panel-bg)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors duration-200 font-sans group">
                                    <span className="font-semibold text-[var(--text-primary)]">{story.title}</span>
                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => onLoad(story.id)} className="px-3 py-1 bg-[var(--accent-primary)] text-white text-xs rounded-md hover:bg-[var(--accent-secondary)] transition-opacity">불러오기</button>
                                        <button onClick={() => onDelete(story)} className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] rounded-full hover:bg-red-500/10 transition-colors"><ICONS.LucideTrash2 size={16}/></button>
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
