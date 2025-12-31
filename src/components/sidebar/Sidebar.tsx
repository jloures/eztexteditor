import React from 'react';
import { useAppStore } from '../../store/useAppStore';
import { TabItem } from './TabItem';

export const Sidebar: React.FC = () => {
    const { items, addNote, addFolder, sidebarWidth, setSidebarWidth } = useAppStore();
    const sidebarRef = React.useRef<HTMLDivElement>(null);
    const [isResizing, setIsResizing] = React.useState(false);

    // Initial resize (simple version for now)
    React.useEffect(() => {
        if (sidebarRef.current) sidebarRef.current.style.width = `${sidebarWidth}px`;
    }, [sidebarWidth]);

    const handleMouseDown = () => setIsResizing(true);

    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            const newWidth = Math.max(160, Math.min(600, e.clientX));
            setSidebarWidth(newWidth);
        };
        const handleMouseUp = () => setIsResizing(false);

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, setSidebarWidth]);


    return (
        <div id="sidebar" className="sidebar" ref={sidebarRef}>
            <div className="sidebar-header">
                <span className="sidebar-title-text">NOTEBOOK</span>
                <i id="sidebarToggle" className="fas fa-bars btn-icon text-xs" title="Collapse Sidebar"></i>
            </div>

            <div id="tabBar" className="tab-list">
                {items.map(item => (
                    <TabItem key={item.id} item={item} depth={0} />
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="flex flex-col gap-2">
                    <button id="addTabBtn" className="new-tab-btn" title="New Note" onClick={() => addNote()}>
                        <i className="fas fa-plus"></i> <span className="btn-text">New Note</span>
                    </button>
                    <button id="addFolderBtn" className="new-tab-btn" title="New Folder" onClick={() => addFolder()}>
                        <i className="fas fa-folder-plus"></i> <span className="btn-text">New Folder</span>
                    </button>
                </div>
            </div>
            <div
                id="sidebar-resizer"
                className={`resizer ${isResizing ? 'active' : ''}`}
                onMouseDown={handleMouseDown}
            ></div>
        </div>
    );
};
