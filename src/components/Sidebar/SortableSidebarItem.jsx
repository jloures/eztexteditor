import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Edit2, Trash2 } from 'lucide-react';

export function SortableSidebarItem({ item, depth, activeId, collapsed, actions, onOpenModal }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id, data: { ...item, depth } });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: `${depth * 16 + 12}px`,
        opacity: isDragging ? 0.5 : 1,
    };

    const isFolder = item.type === 'folder';
    const isActive = item.id === activeId;
    const isCollapsed = collapsed.includes(item.id);

    const handleToggle = (e) => {
        e.stopPropagation();
        if (actions.toggleFolder) actions.toggleFolder(item.id);
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <div
                className={`group flex items-center gap-2 py-2 pr-2 cursor-pointer text-sm select-none transition-colors relative
                    ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-ez-text font-medium border-l-2 border-ez-accent' : 'text-ez-meta hover:bg-gray-50 dark:hover:bg-gray-900 border-l-2 border-transparent'}
                `}
                onClick={() => !isFolder && actions.activateTab(item.id)}
            >
                {isFolder && (
                    <div className="w-4 h-4 flex items-center justify-center hover:text-ez-text transition"
                        onClick={handleToggle}
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start on toggle
                    >
                        {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    </div>
                )}
                {!isFolder && <div className="w-4" />} {/* Spacer */}

                {isFolder ? (
                    isCollapsed ? <Folder size={14} /> : <FolderOpen size={14} />
                ) : (
                    <FileText size={14} />
                )}

                <span className="flex-1 truncate">{item.title}</span>

                {/* Hover Actions */}
                <div className="hidden group-hover:flex items-center gap-1 mr-2 bg-ez-bg/80 backdrop-blur-sm rounded px-1 absolute right-0 top-1/2 -translate-y-1/2 shadow-sm"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag
                >
                    <button onClick={(e) => { e.stopPropagation(); onOpenModal('rename', { id: item.id, title: item.title }); }} className="p-1 hover:text-ez-accent" title="Rename">
                        <Edit2 size={10} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onOpenModal('confirm-delete', { id: item.id }); }} className="p-1 hover:text-red-500" title="Delete">
                        <Trash2 size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
}
