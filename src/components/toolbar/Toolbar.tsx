import React from 'react';
import { useAppStore } from '../../store/useAppStore';

export const Toolbar: React.FC = () => {
    const {
        viewSettings,
        toggleZenMode,
        toggleTypewriterMode,
        togglePreviewMode,
        toggleDarkMode,
        activeTabId,
        items,
        openModal,
        toggleLineNumbers
    } = useAppStore();

    // Word Count Logic
    const getWordCount = () => {
        // ... recursive find active item ...
        // For efficiency, we should probably have a selector or memoized value
        // Doing dirty find for now
        const findItem = (items: any[], id: string): any => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.children) {
                    const found = findItem(item.children, id);
                    if (found) return found;
                }
            }
            return null;
        };
        const item = activeTabId ? findItem(items, activeTabId) : null;
        if (!item || !item.content) return 0;
        return item.content.trim().split(/\s+/).filter((w: string) => w.length > 0).length;
    };

    return (
        <header className="flex justify-between items-center px-10 py-6 border-b border-[var(--border-color)] select-none">
            <div className="flex items-center gap-6 meta-bar">
                <div id="wordCount">{getWordCount()} WORDS</div>
                <div id="encryptionBadge" className="hidden text-blue-400 font-bold">LOCKED</div>
                <div id="modeBadge" className="text-xs px-2 py-0.5 rounded bg-gray-800 text-gray-300">
                    {viewSettings.isPreviewMode ? 'PREVIEW' : 'EDIT'}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <i className="fas fa-shield-halved btn-icon" data-title="Security Settings"></i>
                <i
                    className="fas fa-ghost btn-icon text-orange-400"
                    onClick={() => openModal('panic')}
                    data-title="Panic Button (Alt+P)"
                ></i>

                <i
                    className={`fas fa-expand btn-icon ${viewSettings.isZenMode ? 'btn-active' : ''}`}
                    onClick={toggleZenMode}
                    data-title="Zen Mode (Alt+Z)"
                ></i>

                <i
                    className={`fas fa-arrows-up-down btn-icon ${viewSettings.isTypewriterMode ? 'btn-active' : ''}`}
                    onClick={toggleTypewriterMode}
                    data-title="Typewriter Scrolling"
                ></i>

                <i
                    className="fas fa-search btn-icon"
                    onClick={() => openModal('search')}
                    data-title="Global Search (Cmd+K)"
                ></i>

                {/* Reset entire app? maybe later */}
                <i id="newBtn" className="fas fa-plus btn-icon" data-title="Start from Scratch"></i>

                <i
                    className={`fas fa-eye btn-icon ${viewSettings.isPreviewMode ? 'btn-active' : ''}`}
                    onClick={togglePreviewMode}
                    data-title="Toggle Preview (Markdown)"
                ></i>

                <i className="fas fa-project-diagram btn-icon" data-title="Graph View (Alt+G)"></i>
                <i className="fas fa-unlock btn-icon" data-title="Symmetric Password Encryption"></i>
                <i className="fas fa-share-nodes btn-icon" data-title="Copy Share Link"></i>
                <i className="fas fa-circle-info btn-icon" data-title="Shortcuts & Info"></i>
                <i
                    className={`fas fa-list-ol btn-icon ${viewSettings.showLineNumbers ? 'btn-active' : ''}`}
                    onClick={toggleLineNumbers}
                    data-title="Toggle Line Numbers"
                ></i>

                <i className="fas fa-sun btn-icon"
                    onClick={toggleDarkMode}
                    data-title="Toggle Dark Mode"
                ></i>

                <i className="fas fa-download btn-icon" data-title="Download contents"></i>
                <i className="fas fa-copy btn-icon" data-title="Copy Raw Text"></i>
                <i className="fas fa-trash-alt btn-icon text-red-400" data-title="Clear All"></i>
            </div>
        </header>
    );
};
