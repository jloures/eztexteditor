import React from 'react';
import {
    Ghost, Expand, Minimize, ArrowUp, ArrowDown, Search, Plus, Eye, EyeOff,
    Network, Lock, Unlock, Share2, Info, ListOrdered, Moon, Sun,
    Download, Copy, Trash2, Shield, HelpCircle
} from 'lucide-react';
import { startTutorial } from '../utils/tutorial';

export default function Header({ settings, actions, onOpenModal, wordCount, isLocked }) {

    // Combining Arrows for Typewriter icon approximation
    const TypewriterIcon = () => (
        <div className="flex flex-col items-center justify-center h-4 w-4">
            <ArrowUp size={8} />
            <ArrowDown size={8} />
        </div>
    );

    const downloadContent = () => {
        actions.backupNotebook();
    };

    const copyContent = () => {
        actions.copyCurrentTab();
    };

    const clearAll = () => {
        onOpenModal('confirm-delete', { id: 'ALL' });
    };

    const IconBtn = ({ icon: Icon, onClick, title, active = false, colorClass = "" }) => (
        <button
            onClick={onClick}
            title={title}
            className={`p-1.5 rounded transition hover:bg-white/10 ${active ? 'text-ez-accent' : 'text-ez-meta hover:text-ez-text'} ${colorClass}`}
        >
            <Icon size={16} />
        </button>
    );

    return (
        <header className="flex justify-between items-center px-4 py-3 border-b border-ez-border h-[60px] bg-ez-bg select-none shrink-0">
            <div id="word-count" className="flex items-center gap-4 text-xs font-mono text-ez-meta">
                <div className="flex gap-2 items-center">
                    <span>{wordCount} WORDS</span>
                </div>
                {isLocked && <div className="text-blue-400 font-bold tracking-wider">LOCKED</div>}
                <div className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 text-[10px] font-bold tracking-wider">EDIT</div>
            </div>

            <div id="header-toolbar" className="flex items-center gap-1.5">
                <IconBtn icon={HelpCircle} onClick={startTutorial} title="Start Tutorial" />
                <IconBtn id="security-btn" icon={Shield} onClick={() => onOpenModal('security')} title="Security Settings" />
                <IconBtn icon={Ghost} onClick={actions.togglePanic} title="Panic Mode (Alt+P)" colorClass="text-orange-400 hover:text-orange-300" />
                <IconBtn
                    icon={settings.isZen ? Minimize : Expand}
                    onClick={() => actions.updateSettings({ isZen: !settings.isZen })}
                    title="Zen Mode (Alt+Z)"
                />
                <IconBtn
                    icon={TypewriterIcon}
                    onClick={() => actions.updateSettings({ isTypewriterMode: !settings.isTypewriterMode })}
                    active={settings.isTypewriterMode}
                    title="Typewriter Scrolling"
                />
                <IconBtn id="search-btn" icon={Search} onClick={() => onOpenModal('search')} title="Global Search (Cmd+K)" />
                <IconBtn id="new-btn" icon={Plus} onClick={() => actions.createTab('note')} title="New Note" />

                <div className="w-px h-4 bg-ez-border mx-1" />

                <IconBtn
                    id="preview-toggle"
                    icon={settings.isPreviewMode ? EyeOff : Eye}
                    onClick={() => actions.updateSettings({ isPreviewMode: !settings.isPreviewMode })}
                    active={settings.isPreviewMode}
                    title="Toggle Preview"
                />
                <IconBtn icon={Network} onClick={() => onOpenModal('graph')} title="Graph View (Alt+G)" />
                <IconBtn id="lock-btn" icon={isLocked ? Lock : Unlock} onClick={() => onOpenModal('security')} title={isLocked ? "Current: Encrypted" : "Encrypt Notebook"} />
                <IconBtn id="share-btn" icon={Share2} onClick={() => onOpenModal('share')} title="Share" />
                <IconBtn id="info-btn" icon={Info} onClick={() => onOpenModal('info')} title="Shortcuts & Info" />

                <div className="w-px h-4 bg-ez-border mx-1" />

                <IconBtn
                    icon={ListOrdered}
                    onClick={() => actions.updateSettings({ showLineNumbers: !settings.showLineNumbers })}
                    active={settings.showLineNumbers}
                    title="Line Numbers"
                />
                <IconBtn
                    icon={settings.theme === 'dark' ? Sun : Moon}
                    onClick={() => actions.updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                    title="Toggle Theme"
                />
                <IconBtn icon={Download} onClick={downloadContent} title="Download" />
                <IconBtn icon={Copy} onClick={copyContent} title="Copy" />
                <IconBtn icon={Trash2} onClick={clearAll} title="Clear All" colorClass="text-red-400 hover:text-red-300" />
            </div>
        </header>
    );
}
