import React, { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { SearchModal } from './SearchModal';
import { GraphModal } from './GraphModal';
import { ShareModal } from './ShareModal';
import { InfoModal } from './InfoModal';
import { SecuritySettingsModal } from './SecuritySettingsModal';
import { createPortal } from 'react-dom';

const RenameModal = ({ initialValue, onConfirm, onCancel }) => {
    const [value, setValue] = useState(initialValue || '');
    useEffect(() => { setValue(initialValue || ''); }, [initialValue]);

    const handleConfirm = () => {
        if (!value.trim()) return;
        if (value.includes('/') || value.includes('\\')) {
            alert("Names cannot contain slashes '/' or '\\'.");
            return;
        }
        onConfirm(value.trim());
    };

    return (
        <div className="modal-content">
            <p className="text-sm text-ez-meta mb-4 leading-relaxed">Enter a new name for this item. Slashes are not allowed.</p>
            <input
                type="text"
                className="w-full bg-black/40 border border-ez-border rounded-xl p-4 text-ez-text outline-none focus:border-ez-accent mb-8 font-medium transition-all"
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                autoFocus
            />
            <div className="flex justify-end gap-4">
                <button onClick={onCancel} className="px-6 py-2 text-ez-meta hover:text-ez-text font-bold uppercase text-[10px] tracking-widest transition">Cancel</button>
                <button onClick={handleConfirm} className="px-10 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-500 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-blue-500/20">Save Change</button>
            </div>
        </div>
    );
};

const ConfirmDeleteModal = ({ title, desc, onConfirm, onCancel }) => (
    <div className="modal-content text-center py-4">
        <div className="mb-10">
            <i className="fas fa-triangle-exclamation text-orange-500 text-6xl mb-6 opacity-80" />
            <h4 className="text-white font-bold text-2xl mb-3 tracking-tight">{title || "Are you sure?"}</h4>
            <p className="text-ez-meta text-sm leading-relaxed max-w-[280px] mx-auto opacity-70">{desc || "This action cannot be undone. Always ensure you have a backup of your data."}</p>
        </div>
        <div className="flex justify-center gap-4">
            <button onClick={onCancel} className="px-8 py-2 text-ez-meta hover:text-ez-text font-bold uppercase text-[10px] tracking-widest transition">No, Cancel</button>
            <button onClick={onConfirm} className="px-12 py-2 bg-red-600 text-white rounded-full hover:bg-red-500 font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-red-500/20">
                Yes, I'm Sure
            </button>
        </div>
    </div>
);

const SecurityPasswordModal = ({ isUnlock, onConfirm, onCancel }) => {
    const [password, setPassword] = useState('');
    const [shaking, setShaking] = useState(false);
    const inputRef = useRef(null);

    const handleConfirm = async () => {
        if (!password) return;
        const success = await onConfirm(password);
        if (!success) {
            setShaking(true);
            setTimeout(() => setShaking(false), 400);
            setPassword('');
            inputRef.current?.focus();
        }
    };

    return (
        <div className={shaking ? 'shake' : ''}>
            <p className="text-sm text-ez-meta mb-6 leading-relaxed opacity-80">
                {isUnlock
                    ? "This notebook is protected with a password. Enter it below to unlock your session."
                    : "Create a password to encrypt your notebook. Your data will be AES-256 encrypted using this key."}
            </p>
            <div className="relative mb-8">
                <i className="fas fa-key absolute left-4 top-4 text-ez-meta/30 text-xs" />
                <input
                    ref={inputRef}
                    type="password"
                    className="w-full bg-black/40 border border-ez-border rounded-xl p-4 pl-12 text-ez-text outline-none focus:border-blue-500/50 transition-all font-mono"
                    placeholder="Password..."
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleConfirm()}
                    autoFocus
                />
            </div>
            <div className="flex justify-end gap-4">
                {!isUnlock && <button onClick={onCancel} className="px-6 py-2 text-ez-meta hover:text-ez-text font-bold uppercase text-[10px] tracking-widest transition">Cancel</button>}
                <button onClick={handleConfirm} className={`px-10 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-500 font-bold uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/30 transition-all ${isUnlock ? 'w-full' : ''}`}>
                    {isUnlock ? "Unlock Note" : "Protect Notebook"}
                </button>
            </div>
        </div>
    );
};

const ModalWrapper = ({ title, children, onClose, isOpen, maxWidth = "max-w-md" }) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={onClose}>
            <div className={`bg-ez-bg border border-ez-border rounded-3xl shadow-[0_30px_100px_rgba(0,0,0,0.8)] w-full ${maxWidth} p-10 relative animate-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
                {title && (
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-2xl font-bold text-ez-text tracking-tight flex items-center gap-4">
                            {title}
                        </h3>
                        <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition p-2 bg-ez-border/20 rounded-full">
                            <X size={18} />
                        </button>
                    </div>
                )}
                {children}
            </div>
        </div>,
        document.body
    );
};

export default function Modals({ actions, activeModal, closeModal, modalData, state, hasKey, isLocked }) {

    return (
        <>
            <ModalWrapper title="Modify Asset" isOpen={activeModal === 'rename'} onClose={closeModal}>
                <RenameModal
                    initialValue={modalData?.title}
                    onConfirm={(newName) => {
                        actions.renameTab(modalData.id, newName);
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            </ModalWrapper>

            <ModalWrapper title="Destructive Action" isOpen={activeModal === 'confirm-delete'} onClose={closeModal}>
                <ConfirmDeleteModal
                    title={modalData?.id === 'ALL' ? "Purge Everything?" : "Remove Asset?"}
                    desc={modalData?.id === 'ALL' ? "Warning: This will PERMANENTLY erase all notes and folders from your current session." : "Warning: This action will delete the selected item and all nested data. This cannot be undone."}
                    onConfirm={() => {
                        if (modalData?.id === 'ALL') actions.clearAll();
                        else actions.deleteTab(modalData.id);
                        closeModal();
                    }}
                    onCancel={closeModal}
                />
            </ModalWrapper>

            <ModalWrapper title={modalData?.isUnlock ? "Unlock Session" : "Apply Encryption"} isOpen={activeModal === 'security-password'} onClose={closeModal}>
                <SecurityPasswordModal
                    isUnlock={modalData?.isUnlock}
                    onConfirm={async (password) => {
                        const success = await actions.setEncryptionKey(password);
                        return success;
                    }}
                    onCancel={closeModal}
                />
            </ModalWrapper>

            <SecuritySettingsModal
                isOpen={activeModal === 'security-settings'}
                onClose={closeModal}
                state={state}
                actions={actions}
            />

            <SearchModal
                isOpen={activeModal === 'search'}
                onClose={closeModal}
                tabs={state.tabs}
                onNavigate={actions.activateTab}
                modalData={modalData}
                activeTabId={state.activeTabId}
            />

            <GraphModal
                isOpen={activeModal === 'graph'}
                onClose={closeModal}
                tabs={state.tabs}
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
