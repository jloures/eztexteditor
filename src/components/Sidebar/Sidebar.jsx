import React, { useMemo, useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableSidebarItem } from './SortableSidebarItem';

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
    const [sidebarWidth, setSidebarWidth] = useState(300);
    const [isResizing, setIsResizing] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor)
    );

    const handleMouseDown = useCallback((e) => {
        setIsResizing(true);
        const handleMouseMove = (moveEvent) => {
            const newWidth = moveEvent.clientX;
            if (newWidth > 200 && newWidth < 600) {
                setSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, []);

    const handleDragStart = (event) => setActiveIdDrag(event.active.id);
    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveIdDrag(null);
        if (over && active.id !== over.id) {
            actions.moveItem(active.id, over.id);
        }
    };

    return (
        <div
            id="sidebar"
            className={`sidebar flex-shrink-0 border-r border-ez-border flex flex-col h-full relative ${isResizing ? 'resizing' : ''}`}
            style={{ width: `${sidebarWidth}px` }}
        >
            <div className="sidebar-header select-none">
                <span className="sidebar-title-text">NOTEBOOK</span>
                <i id="sidebar-toggle-icon" className="fas fa-bars btn-icon text-[10px]" title="Collapse/Expand"></i>
            </div>

            <div className="flex-1 overflow-y-auto tab-list">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={flattenedItems.map(i => i.id)} strategy={verticalListSortingStrategy}>
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
                            <div className="tab active opacity-60 shadow-xl border border-ez-accent">
                                <i className="fas fa-file-alt tab-icon" />
                                <span className="tab-title">Relocating Item...</span>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </div>

            <div className="sidebar-footer">
                <button
                    onClick={() => actions.createTab('note')}
                    className="new-tab-btn"
                    data-title="Create New Note (Ctrl+Plus)"
                >
                    <i className="fas fa-plus"></i> <span className="btn-text">New Note</span>
                </button>
                <button
                    onClick={() => actions.createTab('folder')}
                    className="new-tab-btn"
                    data-title="Create New Folder"
                >
                    <i className="fas fa-folder-plus"></i> <span className="btn-text">New Folder</span>
                </button>
            </div>

            <div
                className={`resizer ${isResizing ? 'active' : ''}`}
                onMouseDown={handleMouseDown}
            />
        </div>
    );
}
