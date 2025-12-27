import React, { useState } from 'react';
import { useStore } from '../store';
import { useSidebarResize } from '../hooks/useSidebarResize';
import { createTab, moveItem } from '../utils/tabs';
import type { Tab } from '../types';
import { FaFileAlt, FaFolder, FaFolderOpen, FaChevronRight, FaPen, FaTimes, FaPlus, FaAngleDoubleLeft, FaAngleDoubleRight } from 'react-icons/fa';

interface SidebarProps {
    collapsed: boolean;
    onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
    const { tabs, setTabs, activeTabId, setActiveTabId, collapsedFolders, toggleFolder, sidebarWidth } = useStore();
    const { isResizing, startResizing } = useSidebarResize();
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const handleCreateTab = (type: 'note' | 'folder' = 'note') => {
        const newTab = createTab(type === 'folder' ? 'New Folder' : 'Untitled', '', type);
        setTabs([...tabs, newTab]);
        if (type === 'note') setActiveTabId(newTab.id);
    };

    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedItemId(id);
        e.dataTransfer.effectAllowed = 'move';
        // Add class via React state or direct DOM manipulation if performance needed
    };

    const handleDrop = (e: React.DragEvent, targetId: string, isTargetFolder: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (draggedItemId && draggedItemId !== targetId) {
            const newTabs = moveItem(draggedItemId, targetId, isTargetFolder, tabs);
            setTabs(newTabs);
        }
        setDraggedItemId(null);
    };

    const renderRecursive = (items: Tab[], depth: number) => {
        return items.map(item => {
            const isFolder = item.type === 'folder';
            const isActive = item.id === activeTabId;
            const isCollapsedFolder = collapsedFolders.includes(item.id);

            return (
                <div key={item.id}>
                    <div
                        className={`tab ${isActive ? 'active' : ''} ${isFolder ? 'folder' : ''}`}
                        style={{ paddingLeft: `${depth * 16 + 12}px` }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, item.id, isFolder)}
                        onClick={() => !isFolder && setActiveTabId(item.id)}
                    >
                        <div className="tab-indent">
                            {isFolder && (
                                <div
                                    className={`folder-toggle ${isCollapsedFolder ? 'collapsed' : 'open'}`}
                                    onClick={(e) => { e.stopPropagation(); toggleFolder(item.id); }}
                                >
                                    <FaChevronRight size={10} />
                                </div>
                            )}
                        </div>

                        <div className="tab-icon">
                            {isFolder ? (isCollapsedFolder ? <FaFolder /> : <FaFolderOpen />) : <FaFileAlt />}
                        </div>

                        <span className="tab-title">{item.title}</span>

                        <div className="tab-actions">
                            <div className="action-btn"><FaPen size={10} /></div>
                            <div className="action-btn delete"><FaTimes size={10} /></div>
                        </div>
                    </div>
                    {isFolder && item.children && !isCollapsedFolder && (
                        <div>{renderRecursive(item.children, depth + 1)}</div>
                    )}
                </div>
            );
        });
    };

    return (
        <div
            className={`sidebar ${collapsed ? 'collapsed' : ''} ${isResizing ? 'resizing' : ''}`}
            style={{ width: collapsed ? 60 : sidebarWidth }}
        >
            <div className="sidebar-header">
                <span className="sidebar-title-text">EXPLORER</span>
                <button id="sidebarToggle" className="btn-icon" onClick={onToggleCollapse}>
                    {collapsed ? <FaAngleDoubleRight /> : <FaAngleDoubleLeft />}
                </button>
            </div>

            <div className="tab-list">
                {renderRecursive(tabs, 0)}
            </div>

            <div className="sidebar-footer">
                <div className="new-tab-btn" onClick={() => handleCreateTab('note')}>
                    <FaPlus /> <span className="btn-text">New Note</span>
                </div>
                <div className="new-tab-btn mt-2" onClick={() => handleCreateTab('folder')}>
                    <FaFolder /> <span className="btn-text">New Folder</span>
                </div>
            </div>

            <div className={`resizer ${isResizing ? 'active' : ''}`} onMouseDown={startResizing} />
        </div>
    );
};
