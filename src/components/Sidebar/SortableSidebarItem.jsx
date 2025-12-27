import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export function SortableSidebarItem({ item, depth, activeId, collapsed, actions, onOpenModal }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { ...item, depth } });

    const isFolder = item.type === 'folder';
    const isActive = item.id === activeId;
    const isCollapsed = collapsed.includes(item.id);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: `${depth * 16 + 12}px`,
        opacity: isDragging ? 0.4 : 1,
    };

    const handleToggle = (e) => {
        e.stopPropagation();
        if (actions.toggleFolder) actions.toggleFolder(item.id);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={`tab ${isActive ? 'active' : ''} ${isFolder ? 'folder' : ''} group`}
            onClick={() => !isFolder && actions.activateTab(item.id)}
        >
            <div className="tab-indent">
                {isFolder && (
                    <i
                        className={`fas fa-chevron-right folder-toggle ${isCollapsed ? 'collapsed' : 'open'}`}
                        onClick={handleToggle}
                        onPointerDown={(e) => e.stopPropagation()}
                    />
                )}
            </div>

            <i className={`fas ${isFolder ? (isCollapsed ? 'fa-folder' : 'fa-folder-open') : 'fa-file-alt'} tab-icon text-[10px]`} />

            <span className="tab-title">{item.title}</span>

            <div className="tab-actions" onPointerDown={(e) => e.stopPropagation()}>
                <div
                    className="action-btn"
                    onClick={(e) => { e.stopPropagation(); onOpenModal('rename', { id: item.id, title: item.title }); }}
                    data-title="Rename"
                >
                    <i className="fas fa-pen" />
                </div>
                <div
                    className="action-btn delete"
                    onClick={(e) => { e.stopPropagation(); onOpenModal('confirm-delete', { id: item.id }); }}
                    data-title="Delete"
                >
                    <i className="fas fa-times" />
                </div>
            </div>
        </div>
    );
}
