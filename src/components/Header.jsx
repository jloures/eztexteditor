import React from 'react';
import { startTutorial } from '../utils/tutorial';

const IS_MAC = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);

export default function Header({ settings, actions, onOpenModal, wordCount, isLocked }) {

    const zenMod = IS_MAC ? '⌘E' : 'Alt+Z';
    const typewriterMod = IS_MAC ? '⌘J' : 'Alt+T';
    const panicMod = IS_MAC ? '⌘K' : 'Alt+P';
    const searchLabel = IS_MAC ? '⌘⇧F' : 'Ctrl+Shift+F';
    const newMod = IS_MAC ? '⌘⇧⌫' : 'Ctrl+Shift+Del';
    const previewMod = IS_MAC ? '⌘⇧P' : 'Ctrl+Shift+P';
    const lockMod = IS_MAC ? '⌘⇧L' : 'Ctrl+Shift+L';
    const shareMod = IS_MAC ? '⌘⇧S' : 'Ctrl+Shift+S';
    const infoMod = IS_MAC ? '⌘/' : 'Ctrl+/';
    const themeMod = IS_MAC ? '⌘⇧D' : 'Ctrl+Shift+D';
    const copyMod = IS_MAC ? '⌘⌥C' : 'Ctrl+Alt+C';
    const saveMod = IS_MAC ? '⌘S' : 'Ctrl+S';
    const graphMod = IS_MAC ? '⌥G' : 'Alt+G';
    const linesMod = IS_MAC ? '⌘H' : 'Ctrl+H';
    const clearMod = IS_MAC ? '⌘⇧⌫' : 'Ctrl+Shift+BS';

    const IconBtn = ({ id, iconClass, onClick, title, active = false, colorClass = "" }) => (
        <i
            id={id}
            onClick={onClick}
            data-title={title}
            className={`fas ${iconClass} btn-icon ${active ? 'btn-active' : ''} ${colorClass}`}
        />
    );

    return (
        <header className="flex justify-between items-center px-10 py-6 border-b border-[var(--border-color)] select-none bg-ez-bg shrink-0">
            <div className="flex items-center gap-6 meta-bar">
                <div id="wordCount">{wordCount} WORDS</div>
                {isLocked && (
                    <div id="encryptionBadge" className="text-blue-400 font-bold">LOCKED</div>
                )}
                <div
                    id="modeBadge"
                    className={`text-xs px-2 py-0.5 rounded font-bold tracking-wider ${settings.isPreviewMode ? 'bg-blue-900 text-blue-100' : 'bg-gray-800 text-gray-300'}`}
                >
                    {settings.isPreviewMode ? 'PREVIEW' : 'EDIT'}
                </div>
            </div>

            <div className="flex items-center gap-4">
                <IconBtn id="helpBtn" iconClass="fa-circle-question" onClick={startTutorial} title="Start Tutorial" colorClass="text-blue-400 opacity-80 hover:opacity-100" />
                <IconBtn id="securityBtn" iconClass="fa-shield-halved" onClick={() => onOpenModal('security-settings')} title="Security Settings" />
                <IconBtn id="panicBtn" iconClass="fa-ghost" onClick={actions.togglePanic} title={`Panic Button (${panicMod})`} colorClass="text-orange-400" />
                <IconBtn
                    id="zenToggle"
                    iconClass={settings.isZen ? "fa-compress" : "fa-expand"}
                    onClick={() => actions.updateSettings({ isZen: !settings.isZen })}
                    active={settings.isZen}
                    title={`Zen Mode (${zenMod})`}
                />
                <IconBtn
                    id="typewriterToggle"
                    iconClass="fa-arrows-up-down"
                    onClick={() => actions.updateSettings({ isTypewriterMode: !settings.isTypewriterMode })}
                    active={settings.isTypewriterMode}
                    title={`Typewriter Scrolling (${typewriterMod})`}
                />
                <IconBtn id="searchToggle" iconClass="fa-search" onClick={() => onOpenModal('search')} title={`Global Search (${searchLabel})`} />
                <IconBtn id="newBtn" iconClass="fa-plus" onClick={() => actions.createTab('note')} title={`Start from Scratch (${newMod})`} />
                <IconBtn
                    id="previewToggle"
                    iconClass={settings.isPreviewMode ? "fa-pen" : "fa-eye"}
                    onClick={() => actions.updateSettings({ isPreviewMode: !settings.isPreviewMode })}
                    active={settings.isPreviewMode}
                    title={`Toggle Preview (${previewMod})`}
                />
                <IconBtn id="graphBtn" iconClass="fa-project-diagram" onClick={() => onOpenModal('graph')} title={`Graph View (${graphMod})`} />
                <IconBtn
                    id="lockBtn"
                    iconClass={isLocked ? "fa-lock" : "fa-unlock"}
                    onClick={() => onOpenModal('security-password')}
                    active={isLocked}
                    title={`Password Encryption (${lockMod})`}
                />
                <IconBtn id="shareBtn" iconClass="fa-share-nodes" onClick={() => onOpenModal('share')} title={`Share Link (${shareMod})`} />
                <IconBtn id="infoBtn" iconClass="fa-circle-info" onClick={() => onOpenModal('info')} title={`Shortcuts & Info (${infoMod})`} />
                <IconBtn
                    id="linesToggle"
                    iconClass="fa-list-ol"
                    onClick={() => actions.updateSettings({ showLineNumbers: !settings.showLineNumbers })}
                    active={settings.showLineNumbers}
                    title={`Line Numbers (${linesMod})`}
                />
                <IconBtn
                    id="themeToggle"
                    iconClass={settings.theme === 'dark' ? "fa-sun" : "fa-moon"}
                    onClick={() => actions.updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })}
                    title={`Toggle Theme (${themeMod})`}
                />
                <IconBtn id="downloadBtn" iconClass="fa-download" onClick={actions.backupNotebook} title={`Backup Notebook (${saveMod})`} />
                <IconBtn id="copyBtn" iconClass="fa-copy" onClick={actions.copyCurrentTab} title={`Copy All (${copyMod})`} />
                <IconBtn id="clearBtn" iconClass="fa-trash-alt" onClick={() => onOpenModal('confirm-delete', { id: 'ALL' })} title={`Clear Editor (${clearMod})`} colorClass="text-red-400" />
            </div>
        </header>
    );
}
