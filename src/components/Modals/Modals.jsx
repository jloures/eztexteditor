import React, { useState, useEffect } from 'react';
import { X, Lock, Shield, AlertTriangle } from 'lucide-react';
import { createPortal } from 'react-dom';

const Modal = ({ title, children, onClose, isOpen }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-ez-bg border border-ez-border rounded-xl shadow-2xl w-full max-w-md p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-ez-text">{title}</h3>
                    <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition">
                        <X size={20} />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
};

export default function Modals({ actions, activeModal, closeModal, modalData }) {
    // We assume parent manages which modal is open or we can manage here via context/props
    // For simplicity, let's say props pass "activeModal" string

    // Rename Modal State
    const [renameValue, setRenameValue] = useState('');
    useEffect(() => {
        if (activeModal === 'rename' && modalData) {
            setRenameValue(modalData.title);
        }
    }, [activeModal, modalData]);

    // Security Modal State
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleRename = () => {
        actions.renameTab(modalData.id, renameValue);
        closeModal();
    };

    const handleSecurity = async () => {
        // Logic to set key
        // Note: deriveKey is async
        // We might need an async action in useAppState
        await actions.setEncryptionKey(password);
        closeModal();
    };

    return (
        <>
            {/* Rename Modal */}
            <Modal title="Rename Note" isOpen={activeModal === 'rename'} onClose={closeModal}>
                <p className="text-sm text-ez-meta mb-4">Enter a new name for this note.</p>
                <input
                    type="text"
                    className="w-full bg-black/20 border border-ez-border rounded p-3 text-ez-text outline-none focus:border-ez-accent mb-6"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRename()}
                    autoFocus
                />
                <div className="flex justify-end gap-3">
                    <button onClick={closeModal} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>
                    <button onClick={handleRename} className="px-6 py-2 bg-ez-accent text-white rounded hover:opacity-90">Save Name</button>
                </div>
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal title="Are you sure?" isOpen={activeModal === 'confirm-delete'} onClose={closeModal}>
                <div className="text-center mb-6">
                    <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
                    <p className="text-ez-meta">This action cannot be undone. Always have a backup.</p>
                </div>
                <div className="flex justify-center gap-3">
                    <button onClick={closeModal} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>
                    <button onClick={() => { actions.deleteTab(modalData.id); closeModal(); }} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500">
                        Yes, Delete
                    </button>
                </div>
            </Modal>

            {/* Security/Password Modal */}
            <Modal title={modalData?.isUnlock ? "Unlock Notebook" : "Set Encryption Password"} isOpen={activeModal === 'security'} onClose={closeModal}>
                <p className="text-sm text-ez-meta mb-4">
                    {modalData?.isUnlock
                        ? "Enter password to decrypt your notes."
                        : "Enter a key to encrypt this session. If you forget this, your data is lost forever."}
                </p>
                <div className="relative mb-6">
                    <Lock className="absolute left-3 top-3.5 text-ez-meta" size={16} />
                    <input
                        type="password"
                        className="w-full bg-black/20 border border-ez-border rounded p-3 pl-10 text-ez-text outline-none focus:border-ez-accent"
                        placeholder="Password..."
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSecurity()}
                        autoFocus
                    />
                </div>
                {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

                <div className="flex justify-end gap-3">
                    {!modalData?.isUnlock && <button onClick={closeModal} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>}
                    <button onClick={handleSecurity} className="px-6 py-2 bg-ez-accent text-white rounded hover:opacity-90">
                        {modalData?.isUnlock ? "Unlock" : "Encrypt"}
                    </button>
                </div>
            </Modal>
        </>
    );
}
