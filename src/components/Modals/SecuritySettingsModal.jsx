import React, { useState, useEffect } from 'react';

export function SecuritySettingsModal({ isOpen, onClose, state, actions }) {
    const [autoLock, setAutoLock] = useState(state.autoLockMinutes || 0);
    const [expiry, setExpiry] = useState(state.expiryDate || '');

    useEffect(() => {
        if (isOpen) {
            setAutoLock(state.autoLockMinutes || 0);
            setExpiry(state.expiryDate || '');
        }
    }, [isOpen, state]);

    const handleSave = () => {
        actions.updateSettings({
            autoLockMinutes: parseInt(autoLock) || 0,
            expiryDate: expiry || null
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-ez-bg border border-ez-border rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-bold text-ez-text tracking-tight flex items-center gap-3">
                        <i className="fas fa-shield-halved text-blue-400 opacity-80" />
                        Security Settings
                    </h3>
                    <i className="fas fa-times cursor-pointer text-ez-meta hover:text-ez-text transition text-lg p-1" onClick={onClose} />
                </div>

                <div className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ez-meta mb-3 opacity-80">
                            Auto-Lock Inactivity (Minutes)
                        </label>
                        <div className="relative">
                            <i className="fas fa-clock absolute left-4 top-3.5 text-ez-meta/30 text-xs" />
                            <input
                                type="number"
                                min="0"
                                className="w-full bg-black/40 border border-ez-border rounded-xl p-3 pl-10 text-ez-text outline-none focus:border-blue-500/50 transition-all font-medium"
                                placeholder="0 to disable"
                                value={autoLock}
                                onChange={e => setAutoLock(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-ez-meta mt-2 opacity-50 italic">Session will expire after inactivity.</p>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.2em] text-ez-meta mb-3 opacity-80">
                            Self-Destruct (Expiry GMT)
                        </label>
                        <div className="relative">
                            <i className="fas fa-hourglass-end absolute left-4 top-3.5 text-ez-meta/30 text-xs" />
                            <input
                                type="datetime-local"
                                className="w-full bg-black/40 border border-ez-border rounded-xl p-3 pl-10 text-ez-text outline-none focus:border-blue-500/50 transition-all font-medium"
                                value={expiry}
                                onChange={e => setExpiry(e.target.value)}
                            />
                        </div>
                        <p className="text-[10px] text-ez-meta mt-2 opacity-50 italic">Note will trigger deletion after this time.</p>
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-10 pt-6 border-t border-ez-border/30">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-ez-meta hover:text-ez-text font-bold uppercase text-[10px] tracking-widest transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-10 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 transition font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20"
                    >
                        Apply Settings
                    </button>
                </div>
            </div>
        </div>
    );
}
