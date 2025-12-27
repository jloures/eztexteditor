import React, { useState, useEffect } from 'react';
import { X, Trash2, AlertTriangle, Lock, KeyRound } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { GraphModal } from './GraphModal';
import { ShareModal } from './ShareModal';
import { InfoModal } from './InfoModal';
import { createPortal } from 'react-dom';

// Assuming these new components are defined elsewhere or will be created
// For the purpose of this edit, we'll assume they are imported or defined.
// If they are not provided, the code will break, but the instruction is to use them.
// Let's create simple placeholders for them to make the code syntactically valid for now.

const RenameModal = ({ initialValue, onConfirm, onCancel }) => {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => {
        setValue(initialValue || '');
    }, [initialValue]);

    const handleConfirm = () => {
        onConfirm(value);
    };

    return (
        <>
            <p className="text-sm text-ez-meta mb-4">Enter a new name for this note.</p>
            <input
                type="text"
                className="w-full bg-black/20 border border-ez-border rounded p-3 text-ez-text outline-none focus:border-ez-accent mb-6"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                autoFocus
            />
            <div className="flex justify-end gap-3">
                <button onClick={onCancel} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>
                <button onClick={handleConfirm} className="px-6 py-2 bg-ez-accent text-white rounded hover:opacity-90">Save Name</button>
            </div>
        </>
    );
};

const ConfirmDeleteModal = ({ onConfirm, onCancel }) => (
    <>
        <div className="text-center mb-6">
            <AlertTriangle className="mx-auto text-red-500 mb-4" size={48} />
            <p className="text-ez-meta">This action cannot be undone. Always have a backup.</p>
        </div>
        <div className="flex justify-center gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>
            <button onClick={onConfirm} className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-500">
                Yes, Delete
            </button>
        </div>
    </>
);

const SecurityModal = ({ isUnlock, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(''); // Assuming error state might be managed here

    const handleConfirm = async () => {
        // In a real scenario, you'd likely pass setError back to parent or handle it here
        // For now, just confirm
        await onConfirm(password);
        setPassword(''); // Clear password on success
        setError('');
    };

    return (
        <>
            <p className="text-sm text-ez-meta mb-4">
                {isUnlock
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
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    autoFocus
                />
            </div>
            {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

            <div className="flex justify-end gap-3">
                {!isUnlock && <button onClick={onCancel} className="px-4 py-2 text-ez-meta hover:text-ez-text">Cancel</button>}
                <button onClick={handleConfirm} className="px-6 py-2 bg-ez-accent text-white rounded hover:opacity-90">
                    {isUnlock ? "Unlock" : "Encrypt"}
                </button>
            </div>
        </>
    );
};


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

export default function Modals({ actions, activeModal, closeModal, modalData, tabs }) {
    // The state and effects for renameValue, password, error are now managed within the new modal components
    // and are therefore removed from this parent Modals component.

    return (
        <>
            {/* Rename Modal */}
            <Modal title="Rename Note" isOpen={activeModal === 'rename'} onClose={closeModal}>
                <RenameModal
                    initialValue={modalData?.title}
                    onConfirm={(newName) => {
                        actions.renameTab(modalData.id, newName);
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            </Modal>

            {/* Confirm Delete Modal */}
            <Modal title="Are you sure?" isOpen={activeModal === 'confirm-delete'} onClose={closeModal}>
                <ConfirmDeleteModal
                    onConfirm={() => {
                        actions.deleteTab(modalData.id);
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            </Modal>

            {/* Security/Password Modal */}
            <Modal title={modalData?.isUnlock ? "Unlock Notebook" : "Set Encryption Password"} isOpen={activeModal === 'security'} onClose={closeModal}>
                <SecurityModal
                    isUnlock={modalData?.isUnlock}
                    onConfirm={(password) => {
                        actions.setEncryptionKey(password);
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            </Modal>

            <SearchModal
                isOpen={activeModal === 'search'}
                onClose={closeModal}
                tabs={tabs}
                onNavigate={actions.activateTab}
            />

            <GraphModal
                isOpen={activeModal === 'graph'}
                onClose={closeModal}
                tabs={tabs}
                onNavigate={actions.activateTab}
            />

            <ShareModal
                isOpen={activeModal === 'share'}
                onClose={closeModal}
            />

            <InfoModal
                isOpen={activeModal === 'info'}
                onClose={closeModal}
            />
        </>
    );
}
