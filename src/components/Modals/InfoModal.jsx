import React from 'react';

const ShortcutRow = ({ label, keys }) => (
    <div className="flex justify-between items-center text-sm border-b border-ez-border pb-2">
        <span className="text-ez-meta">{label}</span>
        <div className="flex gap-1">
            {keys.map((k, i) => (
                <kbd key={i} className="px-2 py-1 bg-black rounded border border-ez-border text-ez-text text-[10px] font-mono shadow-sm">{k}</kbd>
            ))}
        </div>
    </div>
);

export function InfoModal({ isOpen, onClose }) {
    if (!isOpen) return null;

    const isMac = typeof window !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
    const Cmd = isMac ? '⌘' : 'Ctrl';
    const Alt = isMac ? '⌥' : 'Alt';
    const Shift = isMac ? '⇧' : 'Shift';

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-ez-bg border border-ez-border rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative overflow-y-auto max-h-[90vh] animate-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-bold text-ez-text tracking-tight">Help & Shortcuts</h3>
                    <i className="fas fa-times cursor-pointer text-ez-meta hover:text-ez-text transition text-xl p-2" onClick={onClose} />
                </div>

                <div className="space-y-10">
                    <div>
                        <h4 className="text-blue-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-6 opacity-80">Keyboard Shortcuts</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-5">
                            <div className="space-y-4">
                                <ShortcutRow label="Search In Note" keys={[Cmd, 'F']} />
                                <ShortcutRow label="Global Search" keys={[Cmd, Shift, 'F']} />
                                <ShortcutRow label="Zen Mode" keys={[isMac ? Cmd : Alt, isMac ? 'E' : 'Z']} />
                                <ShortcutRow label="Typewriter Mode" keys={[isMac ? Cmd : Alt, isMac ? 'J' : 'T']} />
                                <ShortcutRow label="Panic Mode" keys={[isMac ? Cmd : Alt, isMac ? 'K' : 'P']} />
                                <ShortcutRow label="Toggle Preview" keys={[Cmd, Shift, 'P']} />
                                <ShortcutRow label="Graph View" keys={[Alt, 'G']} />
                                <ShortcutRow label="Help / Shortcuts" keys={[Cmd, '/']} />
                            </div>
                            <div className="space-y-4">
                                <ShortcutRow label="Download MD" keys={[Cmd, 'S']} />
                                <ShortcutRow label="Share Link" keys={[Cmd, Shift, 'S']} />
                                <ShortcutRow label="Encryption" keys={[Cmd, Shift, 'L']} />
                                <ShortcutRow label="Toggle Theme" keys={[Cmd, Shift, 'D']} />
                                <ShortcutRow label="Copy Total" keys={[Cmd, Alt, 'C']} />
                                <ShortcutRow label="Line Numbers" keys={[Cmd, 'H']} />
                                <ShortcutRow label="Start Scratch" keys={[Cmd, Shift, '⌫']} />
                                <ShortcutRow label="Close Modal" keys={['Esc']} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-ez-border/50">
                        <div>
                            <h4 className="text-orange-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 opacity-80">Storage & Privacy</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold text-sm text-ez-text mb-1">Zero-Knowledge Storage</p>
                                    <p className="text-ez-meta text-xs leading-relaxed opacity-70">Your data is never sent to a server. Everything is stored in the URL hash, keeping it private and local to your session.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-ez-text mb-1">Encrypted Sessions</p>
                                    <p className="text-ez-meta text-xs leading-relaxed opacity-70">Lock your notebook with AES-256 encryption. Only those with the password can read the content generated from the hash.</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="text-green-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-4 opacity-80">Features</h4>
                            <div className="space-y-4">
                                <div>
                                    <p className="font-bold text-sm text-ez-text mb-1">Markdown & Math</p>
                                    <p className="text-ez-meta text-xs leading-relaxed opacity-70">Full GFM support including tables and checklists. Use Mermaid.js for diagrams and KaTeX for display & inline math.</p>
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-ez-text mb-1">Interconnected Notes</p>
                                    <p className="text-ez-meta text-xs leading-relaxed opacity-70">Use <code className="text-blue-400 font-bold bg-blue-400/10 px-1 rounded">[[Link]]</code> to connect notes. View your notebook as a connected graph of ideas in Graph View.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-8 border-t border-ez-border/30 flex justify-center">
                    <button
                        onClick={onClose}
                        className="px-12 py-3 bg-white text-black rounded-full hover:bg-gray-200 transition font-bold uppercase text-[11px] tracking-[0.2em]"
                    >
                        Initialize
                    </button>
                </div>
            </div>
        </div>
    );
}
