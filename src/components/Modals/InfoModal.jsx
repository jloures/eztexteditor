import React from 'react';
import { X } from 'lucide-react';

export function InfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    // Check OS for shortcuts
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const Cmd = isMac ? '⌘' : 'Ctrl';
    const Alt = isMac ? '⌥' : 'Alt';
    const Shift = isMac ? '⇧' : 'Shift';

    const ShortcutRow = ({ label, keys }) => (
        <div className="flex justify-between items-center text-sm border-b border-ez-border pb-2">
            <span className="text-ez-meta">{label}</span>
            <div className="flex gap-1">
                {keys.map((k, i) => (
                    <kbd key={i} className="px-2 py-1 bg-black/50 rounded border border-ez-border text-ez-text text-xs font-mono">{k}</kbd>
                ))}
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-ez-bg border border-ez-border rounded-xl shadow-2xl w-full max-w-2xl p-8 relative overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-ez-text">Help & Shortcuts</h3>
                    <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-8">
                    <div>
                        <h4 className="text-blue-400 font-bold uppercase text-xs tracking-widest mb-4">Keyboard Shortcuts</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="space-y-3">
                                <ShortcutRow label="Search In Note" keys={[Cmd, 'F']} />
                                <ShortcutRow label="Global Search" keys={[Cmd, Shift, 'F']} />
                                <ShortcutRow label="Zen Mode" keys={[isMac ? Cmd : Alt, isMac ? 'E' : 'Z']} />
                                <ShortcutRow label="Typewriter Mode" keys={[isMac ? Cmd : Alt, isMac ? 'J' : 'T']} />
                                <ShortcutRow label="Panic Mode" keys={[isMac ? Cmd : Alt, isMac ? 'K' : 'P']} />
                                <ShortcutRow label="Toggle Preview" keys={[Cmd, Shift, 'P']} />
                                <ShortcutRow label="Graph View" keys={[Alt, 'G']} />
                                <ShortcutRow label="Help / Info" keys={[Cmd, '/']} />
                            </div>
                            <div className="space-y-3">
                                <ShortcutRow label="Download MD" keys={[Cmd, 'S']} />
                                <ShortcutRow label="Share Link" keys={[Cmd, Shift, 'S']} />
                                <ShortcutRow label="Encryption" keys={[Cmd, Shift, 'L']} />
                                <ShortcutRow label="Toggle Theme" keys={[Cmd, Shift, 'D']} />
                                <ShortcutRow label="Copy All" keys={[Cmd, Alt, 'C']} />
                                <ShortcutRow label="Line Numbers" keys={[Cmd, 'H']} />
                                <ShortcutRow label="Start Scratch" keys={[Cmd, Shift, '⌫']} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-ez-border">
                        <div>
                            <h4 className="text-orange-400 font-bold uppercase text-xs tracking-widest mb-4">Storage & Privacy</h4>
                            <div className="space-y-4 text-sm text-ez-meta">
                                <div>
                                    <p className="font-bold text-ez-text mb-1">Zero-Knowledge Storage</p>
                                    <p className="leading-relaxed">Your data is never sent to a server. Everything is stored in the URL hash, keeping it private and local.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-ez-text mb-1">Encrypted Sessions</p>
                                    <p className="leading-relaxed">Lock your notebook with AES-256 encryption. Only those with the password can read the content.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold uppercase text-xs tracking-widest mb-4">Features</h4>
                            <div className="space-y-4 text-sm text-ez-meta">
                                <div>
                                    <p className="font-bold text-ez-text mb-1">Markdown & Diagrams</p>
                                    <p className="leading-relaxed">Full Markdown support including GFM. Use Mermaid.js for diagrams, KaTeX for math, and Highlight.js.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-ez-text mb-1">Wiki-Links & Graph</p>
                                    <p className="leading-relaxed">Use <code className="text-blue-400">[[Link]]</code> to connect notes. View your notebook as a connected graph of ideas.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-ez-border flex justify-center gap-4">
                    <button onClick={onClose} className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-medium">Got it!</button>
                </div>
            </div>
        </div>
    );
}
