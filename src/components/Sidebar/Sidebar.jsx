import React, { useMemo, useState } from 'react';
import { FolderPlus, Plus } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSidebarItem } from './SortableSidebarItem';

// Helper to flatten tree for simple sortable list
const flatten = (items, collapsed = [], depth = 0) => {
    let result = [];
    for (const item of items) {
        result.push({ ...item, depth });
        if (item.type === 'folder' && !collapsed.includes(item.id) && item.children) {
            result = result.concat(flatten(item.children, collapsed, depth + 1));
        }
    }
    return result;
};

export default function Sidebar({ tabs, activeId, collapsed, actions, onOpenModal }) {
    const flattenedItems = useMemo(() => flatten(tabs, collapsed), [tabs, collapsed]);
    const [activeIdDrag, setActiveIdDrag] = useState(null);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragStart = (event) => {
        setActiveIdDrag(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveIdDrag(null);
        if (!over) return;

        if (active.id !== over.id) {
            actions.moveItem(active.id, over.id);
        }
    };

    return (
        <div className="w-[260px] flex-shrink-0 border-r border-ez-border flex flex-col bg-ez-bg h-full">
            <div className="p-4 text-xs font-bold text-ez-meta tracking-widest uppercase flex justify-between items-center border-b border-ez-border h-[50px]">
                <span>NOTEBOOK</span>
                <button className="hover:text-ez-text"><i className="fas fa-bars"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 h-[calc(100%-100px)] custom-scrollbar">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={flattenedItems.map(i => i.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {flattenedItems.map(item => (
                            <SortableSidebarItem
                                key={item.id}
                                item={item}
                                depth={item.depth}
                                activeId={activeId}
                                collapsed={collapsed}
                                actions={actions}
                                onOpenModal={onOpenModal}
                            />
                        ))}
                    </SortableContext>

                    <DragOverlay>
                        {activeIdDrag ? (
                            <div className="bg-ez-bg border border-ez-accent p-2 shadow-lg opacity-80 rounded text-sm text-ez-text">
                                {/* Simple preview */}
                                Dragging...
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <div className="p-4 border-t border-ez-border bg-ez-bg h-[60px] flex gap-2">
                <button onClick={() => actions.createTab('note')} className="flex-1 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <Plus size={12} /> Note
                </button>
                <button onClick={() => actions.createTab('folder')} className="flex-1 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs flex items-center justify-center gap-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition">
                    <FolderPlus size={12} /> Folder
                </button>
            </div>
        </div>
    );
}
