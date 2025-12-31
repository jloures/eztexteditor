import React, { useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { FileSystemItem } from '../../store/types';

interface TabItemProps {
    item: FileSystemItem;
    depth: number;
}

export const TabItem: React.FC<TabItemProps> = ({ item, depth }) => {
    const { activeTabId, activateItem, toggleFolder, deleteItem, renameItem, addNote } = useAppStore();
    const isActive = item.id === activeTabId;
    const isFolder = item.type === 'folder';
    const isCollapsed = !item.isOpen;

    // Drag-and-drop placeholder handling (Stage 4)

    // Rename ref
    const titleRef = useRef<HTMLSpanElement>(null);

    const handleRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        const newName = prompt("Enter new name:", item.title);
        if (newName) renameItem(item.id, newName);
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
            deleteItem(item.id);
        }
    };

    const handleAddNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        addNote(item.id);
    };

    return (
        <React.Fragment>
            <div
                className={`tab ${isActive ? 'active' : ''} ${isFolder ? 'folder' : ''}`}
                style={{ paddingLeft: `${depth * 16 + 12}px` }}
                onClick={() => isFolder ? toggleFolder(item.id) : activateItem(item.id)}
            >
                <div className="tab-indent">
                    {isFolder && (
                        <i
                            className={`fas fa-chevron-right folder-toggle ${isCollapsed ? 'collapsed' : 'open'}`}
                            onClick={(e) => { e.stopPropagation(); toggleFolder(item.id); }}
                        ></i>
                    )}
                </div>

                <i className={`${isFolder ? (isCollapsed ? 'fas fa-folder' : 'fas fa-folder-open') : 'fas fa-file-alt'} tab-icon`}></i>

                <span className="tab-title" ref={titleRef}>{item.title}</span>

                <div className="tab-actions">
                    <div className="action-btn" onClick={handleRename}><i className="fas fa-pen"></i></div>
                    {isFolder && <div className="action-btn" onClick={handleAddNote} title="Add Note inside"><i className="fas fa-plus"></i></div>}
                    <div className="action-btn delete" onClick={handleDelete}><i className="fas fa-times"></i></div>
                </div>
            </div>

            {/* Recursion */}
            {isFolder && !isCollapsed && item.children && item.children.map(child => (
                <TabItem key={child.id} item={child} depth={depth + 1} />
            ))}
        </React.Fragment>
    );
};
