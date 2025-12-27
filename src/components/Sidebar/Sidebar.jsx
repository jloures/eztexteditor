import React from 'react';
import { ChevronRight, ChevronDown, FileText, Folder, FolderOpen, Plus, FolderPlus } from 'lucide-react';

const SidebarItem = ({ item, depth, activeId, collapsed, actions }) => {
    const isFolder = item.type === 'folder';
    const isActive = item.id === activeId;
    const isCollapsed = collapsed.includes(item.id);
    const paddingLeft = depth * 16 + 12;

    const handleToggle = (e) => {
        e.stopPropagation();
        if (actions.toggleFolder) actions.toggleFolder(item.id);
    };

    return (
        <div>
            <div
                className={`flex items-center gap-2 py-2 pr-2 cursor-pointer text-sm select-none transition-colors
                    ${isActive ? 'bg-gray-100 dark:bg-gray-800 text-ez-text font-medium border-l-2 border-ez-accent' : 'text-ez-meta hover:bg-gray-50 dark:hover:bg-gray-900 border-l-2 border-transparent'}
                `}
                style={{ paddingLeft: `${paddingLeft}px` }}
                onClick={() => !isFolder && actions.activateTab(item.id)}
            >
                {isFolder && (
                    <div className="w-4 h-4 flex items-center justify-center hover:text-ez-text" onClick={handleToggle}>
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
            </div>

            {isFolder && !isCollapsed && item.children && (
                <div>
                    {item.children.map(child => (
                        <SidebarItem
                            key={child.id}
                            item={child}
                            depth={depth + 1}
                            activeId={activeId}
                            collapsed={collapsed}
                            actions={actions}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default function Sidebar({ tabs, activeId, collapsed, actions }) {
    return (
        <div className="w-[260px] flex-shrink-0 border-r border-ez-border flex flex-col bg-ez-bg h-full">
            <div className="p-4 text-xs font-bold text-ez-meta tracking-widest uppercase flex justify-between items-center border-b border-ez-border h-[50px]">
                <span>NOTEBOOK</span>
                <button className="hover:text-ez-text"><i className="fas fa-bars"></i></button>
            </div>

            <div className="flex-1 overflow-y-auto py-2 h-[calc(100%-100px)]">
                {tabs.map(tab => (
                    <SidebarItem
                        key={tab.id}
                        item={tab}
                        depth={0}
                        activeId={activeId}
                        collapsed={collapsed}
                        actions={actions}
                    />
                ))}
            </div>

            <div className="p-4 border-t border-ez-border bg-ez-bg h-[50px] flex gap-2">
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
