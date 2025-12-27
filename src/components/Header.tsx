import React from 'react';
import { useStore } from '../store';
import {
    FaShieldAlt, FaGhost, FaExpand, FaCompress, FaArrowsAltV, FaSearch,
    FaPlus, FaEye, FaPen, FaProjectDiagram, FaUnlock, FaLock, FaShareAlt,
    FaInfoCircle, FaListOl, FaSun, FaDownload, FaCopy, FaTrashAlt
} from 'react-icons/fa';

export const Header: React.FC = () => {
    const {
        settings, updateSettings, isPanicMode, togglePanicMode,
        encryptionKey
    } = useStore();

    // Placeholder actions (to be implemented fully)
    const toggleZen = () => updateSettings({ isZen: !settings.isZen });
    const toggleTypewriter = () => updateSettings({ isTypewriter: !settings.isTypewriter });
    const togglePreview = () => updateSettings({ isPreviewMode: !settings.isPreviewMode });
    const toggleLineNumbers = () => updateSettings({ showLineNumbers: !settings.showLineNumbers });

    // Theme logic usually requires document.body manipulation
    const toggleTheme = () => {
        const body = document.body;
        const isDark = body.getAttribute('data-theme') === 'dark';
        body.setAttribute('data-theme', isDark ? 'light' : 'dark');
        // Persist to local storage if needed
    };

    return (
        <header className={`flex justify-between items-center px-10 py-6 border-b border-[var(--border-color)] select-none ${settings.isZen ? 'hidden' : ''}`}>
            <div className="flex items-center gap-6 meta-bar">
                <div id="wordCount">0 WORDS</div>
                {encryptionKey && (
                    <div id="encryptionBadge" className="text-blue-400 font-bold">LOCKED</div>
                )}
                <div id="modeBadge" className={`text-xs px-2 py-0.5 rounded ${settings.isPreviewMode ? 'bg-blue-900' : 'bg-gray-800'} text-gray-300`}>
                    {settings.isPreviewMode ? 'PREVIEW' : 'EDIT'}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <FaShieldAlt className="btn-icon" title="Security Settings" />
                <FaGhost
                    className={`btn-icon ${isPanicMode ? 'text-red-500' : 'text-orange-400'}`}
                    onClick={togglePanicMode}
                    title="Panic Button (Alt+P)"
                />

                {settings.isZen ? (
                    <FaCompress className="btn-icon btn-active" onClick={toggleZen} title="Exit Zen Mode" />
                ) : (
                    <FaExpand className="btn-icon" onClick={toggleZen} title="Zen Mode (Alt+Z)" />
                )}

                <FaArrowsAltV
                    className={`btn-icon ${settings.isTypewriter ? 'btn-active' : ''}`}
                    onClick={toggleTypewriter}
                    title="Typewriter Scrolling"
                />

                <FaSearch className="btn-icon" title="Global Search (Cmd+K)" />
                <FaPlus className="btn-icon" title="Start from Scratch" />

                {settings.isPreviewMode ? (
                    <FaPen className="btn-icon" onClick={togglePreview} title="Edit Mode" />
                ) : (
                    <FaEye className="btn-icon" onClick={togglePreview} title="Preview Mode" />
                )}

                <FaProjectDiagram className="btn-icon" title="Graph View (Alt+G)" />

                {encryptionKey ? (
                    <FaLock className="btn-icon" title="Encrypted" />
                ) : (
                    <FaUnlock className="btn-icon" title="Encrypt Notebook" />
                )}

                <FaShareAlt className="btn-icon" title="Copy Share Link" />
                <FaInfoCircle className="btn-icon" title="Shortcuts & Info" />

                <FaListOl
                    className={`btn-icon ${settings.showLineNumbers ? 'btn-active' : ''}`}
                    onClick={toggleLineNumbers}
                    title="Toggle Line Numbers"
                />

                <FaSun className="btn-icon" onClick={toggleTheme} title="Toggle Theme" />
                <FaDownload className="btn-icon" title="Download contents" />
                <FaCopy className="btn-icon" title="Copy Raw Text" />
                <FaTrashAlt className="btn-icon text-red-400" title="Clear All" />
            </div>
        </header>
    );
};
