// src/components/pd_chat/idea_board/PinnedItem.js

import React, { useState, useEffect, useRef, memo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ICONS } from '../../../constants';

const PinnedItem = memo(React.forwardRef(({ item, onCopy, onUnpin, onUpdate, style, attributes, listeners, isDragOverlay = false }, ref) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(item.text);
    const [editTags, setEditTags] = useState((item.tags || []).join(', '));
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        if (isEditing) {
            setEditText(item.text);
            setEditTags((item.tags || []).join(', '));
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
                textareaRef.current.focus();
            }
        }
    }, [isEditing, item.text, item.tags]);

    const handleSave = () => {
        const newTags = editTags.split(',').map(t => t.trim()).filter(Boolean);
        onUpdate(item.id, { text: editText, tags: newTags });
        setIsEditing(false);
    };

    const handleCancel = () => setIsEditing(false);
    
    const handleTextareaChange = (e) => {
        setEditText(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const isTruncatable = item.text.length > 120 || item.text.split('\n').length > 2;
    const displayText = isExpanded || !isTruncatable ? item.text : `${item.text.substring(0, 120)}...`;

    const overlayClass = isDragOverlay ? 'shadow-2xl scale-105' : '';

    return (
        <div ref={ref} style={style} {...attributes} className={`bg-[var(--bg-secondary)] rounded-lg group animate-fadeIn border border-[var(--border-primary)] relative transition-all hover:border-[var(--border-secondary)] mb-3 ${overlayClass}`}>
            <div className="p-4">
                {isEditing && !isDragOverlay ? (
                    <div className="space-y-3">
                        <textarea ref={textareaRef} value={editText} onChange={handleTextareaChange} className="w-full bg-[var(--input-bg)] p-2 rounded-md text-sm text-[var(--text-primary)] border border-[var(--border-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]" rows="3" />
                        <input type="text" value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full bg-[var(--input-bg)] p-2 rounded-md text-sm text-[var(--text-primary)] border border-[var(--border-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]" />
                    </div>
                ) : (
                    <>
                        <p className={`text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap break-words ${isTruncatable ? 'cursor-pointer' : ''}`} onClick={() => isTruncatable && !isEditing && setIsExpanded(!isExpanded)}>{displayText}</p>
                        {(item.tags && item.tags.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.tags.map(tag => <span key={tag} className="px-2 py-0.5 bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] text-xs font-semibold rounded-full">{tag}</span>)}
                            </div>
                        )}
                    </>
                )}
            </div>
            <div className="flex items-center justify-between p-2 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/50">
                <div {...listeners} className={`p-1 text-[var(--text-secondary)] touch-none ${isDragOverlay ? 'cursor-grabbing' : 'cursor-grab'}`}>
                    <ICONS.LucideGripVertical size={16} />
                </div>
                <div className="flex items-center space-x-2">
                    {isEditing && !isDragOverlay ? (
                        <>
                            <button onClick={handleSave} title="Save" className="p-1.5 text-white bg-[var(--success)] rounded-md hover:bg-green-700 transition-all"><ICONS.LucideSave size={16} /></button>
                            <button onClick={handleCancel} title="Cancel" className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all"><ICONS.LucideX size={16} /></button>
                        </>
                    ) : (
                        <>
                            {isTruncatable && <button onClick={() => setIsExpanded(!isExpanded)} title={isExpanded ? "접기" : "더보기"} className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all" disabled={isDragOverlay}>{isExpanded ? <ICONS.LucideChevronUp size={16} /> : <ICONS.LucideChevronDown size={16} />}</button>}
                            <button onClick={() => setIsEditing(true)} title="Edit" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all" disabled={isDragOverlay}><ICONS.LucideEdit size={16} /></button>
                            <button onClick={() => onCopy(item.text)} title="Copy" className="p-1 text-[var(--text-secondary)] hover:text-[var(--accent-primary)] transition-all" disabled={isDragOverlay}><ICONS.LucideCopy size={16} /></button>
                            <button onClick={() => onUnpin(item.id)} title="Unpin" className="p-1 text-[var(--text-secondary)] hover:text-[var(--danger)] transition-all" disabled={isDragOverlay}><ICONS.LucidePinOff size={16} /></button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}));

export const SortablePinnedItem = ({ item, onCopy, onUnpin, onUpdate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    
    return (
        <PinnedItem
            item={item}
            onCopy={onCopy}
            onUnpin={onUnpin}
            onUpdate={onUpdate}
            ref={setNodeRef}
            style={style}
            attributes={attributes}
            listeners={listeners}
        />
    );
};

export default PinnedItem; // DragOverlay에서 사용하기 위해 기본 export도 추가
