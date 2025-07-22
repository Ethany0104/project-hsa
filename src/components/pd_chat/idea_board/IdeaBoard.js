// src/components/pd_chat/idea_board/IdeaBoard.js

import React, { useState, useMemo, memo } from 'react';
import { DndContext, PointerSensor, KeyboardSensor, useSensor, useSensors, closestCenter, DragOverlay } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ICONS } from '../../../constants';
import PinnedItem, { SortablePinnedItem } from './PinnedItem';

const IdeaBoard = memo(({ pinnedItems, onCopy, onUnpin, onUpdate, onReorder }) => {
    const [filterTag, setFilterTag] = useState(null);
    const [activeItem, setActiveItem] = useState(null);
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleCopyToClipboard = (text) => {
        navigator.clipboard.writeText(text).then(() => onCopy()).catch(err => console.error('클립보드 복사 실패:', err));
    };

    const handleDragStart = (event) => {
        const { active } = event;
        setActiveItem(pinnedItems.find(item => item.id === active.id));
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = pinnedItems.findIndex(item => item.id === active.id);
            const newIndex = pinnedItems.findIndex(item => item.id === over.id);
            onReorder(arrayMove(pinnedItems, oldIndex, newIndex));
        }
        setActiveItem(null);
    };

    const handleDragCancel = () => {
        setActiveItem(null);
    };
    
    const allTags = useMemo(() => {
        const tags = new Set();
        pinnedItems.forEach(item => (item.tags || []).forEach(tag => tags.add(tag)));
        return Array.from(tags);
    }, [pinnedItems]);

    const filteredItems = useMemo(() => {
        if (!filterTag) return pinnedItems;
        return pinnedItems.filter(item => (item.tags || []).includes(filterTag));
    }, [filterTag, pinnedItems]);
    
    const sortableItemIds = useMemo(() => filteredItems.map(item => item.id), [filteredItems]);

    return (
        <div className="h-full flex flex-col">
            {allTags.length > 0 && (
                <div className="p-2 border-b border-[var(--border-primary)] flex-shrink-0">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setFilterTag(null)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${!filterTag ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-secondary)]'}`}>모두</button>
                        {allTags.map(tag => (
                            <button key={tag} onClick={() => setFilterTag(tag)} className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-colors ${filterTag === tag ? 'bg-[var(--accent-primary)] text-white' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--border-secondary)]'}`}>{tag}</button>
                        ))}
                    </div>
                </div>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
                <SortableContext items={sortableItemIds} strategy={verticalListSortingStrategy} disabled={!!filterTag}>
                    <div className="p-3 overflow-y-auto flex-grow bg-[var(--bg-primary)]" style={{backgroundImage: 'radial-gradient(var(--border-primary) 1px, transparent 1px)', backgroundSize: '1.5rem 1.5rem'}}>
                        {filteredItems.length > 0 ? (
                            filteredItems.map(item => (
                                <SortablePinnedItem key={item.id} id={item.id} item={item} onCopy={handleCopyToClipboard} onUnpin={onUnpin} onUpdate={onUpdate} />
                            ))
                        ) : (
                            <div className="text-center text-[var(--text-secondary)] h-full flex flex-col justify-center items-center p-4">
                                <ICONS.LucidePinOff className="w-10 h-10 mb-4 opacity-50" />
                                <p className="text-sm">{filterTag ? `'${filterTag}' 태그가 붙은 아이디어가 없습니다.` : 'PD와의 대화에서 📌 아이콘을 클릭해 아이디어를 고정하세요.'}</p>
                            </div>
                        )}
                    </div>
                </SortableContext>
                <DragOverlay>
                    {activeItem ? <PinnedItem item={activeItem} isDragOverlay={true} /> : null}
                </DragOverlay>
            </DndContext>
        </div>
    );
});

export default IdeaBoard;
