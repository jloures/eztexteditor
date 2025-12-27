import { useState, useEffect, useCallback, useRef } from 'react';
import { encodeToUrl, decodeFromUrl, encryptText, decryptText } from '../utils/persistence';
import JSZip from 'jszip';

const DEBOUNCE_MS = 500;

const INITIAL_STATE = {
    tabs: [],
    activeTabId: null,
    collapsedFolders: [],
    autoLockMinutes: 0,
    expiryDate: null,
    settings: {
        isPreviewMode: false,
        isZen: false,
        showLineNumbers: false,
        isTypewriterMode: false,
        theme: 'dark'
    }
};

const generateId = () => Math.random().toString(36).substr(2, 9);
const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function useAppState() {
    const [state, setState] = useState(INITIAL_STATE);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Modal & Overlay State
    const [activeModal, setActiveModal] = useState(null);
    const [modalData, setModalData] = useState(null);
    const [showPanic, setShowPanic] = useState(false);

    // Inactivity Timer
    const lastActivity = useRef(Date.now());

    const openModal = useCallback((name, data = null) => {
        setActiveModal(name);
        setModalData(data);
    }, []);

    const closeModal = useCallback(() => {
        setActiveModal(null);
        setModalData(null);
    }, []);

    // Init Logic
    useEffect(() => {
        const init = async () => {
            const hash = window.location.hash.substring(1);
            if (hash.startsWith('enc_')) {
                setIsLocked(true);
                setIsLoaded(true);
                openModal('security', { isUnlock: true });
                return;
            }
            if (hash) {
                const decoded = await decodeFromUrl(hash);
                if (decoded) {
                    try {
                        const parsed = JSON.parse(decoded);
                        if (!parsed.tabs) throw new Error("Legacy");
                        const merged = { ...INITIAL_STATE, ...parsed, settings: { ...INITIAL_STATE.settings, ...parsed.settings } };
                        setState(merged);
                    } catch (e) {
                        const id = generateId();
                        setState({
                            ...INITIAL_STATE,
                            tabs: [{ id, title: 'Untitled', content: decoded, type: 'note' }],
                            activeTabId: id
                        });
                    }
                }
            } else if (state.tabs.length === 0) {
                const id = generateId();
                setState({
                    ...INITIAL_STATE,
                    tabs: [{ id, title: 'Untitled', content: '', type: 'note' }],
                    activeTabId: id
                });
            }
            setIsLoaded(true);
        };
        init();
    }, []);

    // Activity Tracking
    useEffect(() => {
        const reset = () => lastActivity.current = Date.now();
        window.addEventListener('mousemove', reset);
        window.addEventListener('keydown', reset);
        window.addEventListener('mousedown', reset);

        const interval = setInterval(() => {
            if (state.autoLockMinutes > 0 && !isLocked && !activeModal) {
                const elapsed = (Date.now() - lastActivity.current) / 1000 / 60;
                if (elapsed >= state.autoLockMinutes) {
                    location.reload();
                }
            }
            if (state.expiryDate) {
                const expiry = new Date(state.expiryDate).getTime();
                if (Date.now() > expiry) {
                    alert("This note has expired and will be destroyed.");
                    window.location.hash = '';
                    location.reload();
                }
            }
        }, 10000);

        return () => {
            window.removeEventListener('mousemove', reset);
            window.removeEventListener('keydown', reset);
            window.removeEventListener('mousedown', reset);
            clearInterval(interval);
        };
    }, [state.autoLockMinutes, state.expiryDate, isLocked, activeModal]);

    // Actions
    const activateTab = useCallback((id) => setState(p => ({ ...p, activeTabId: id })), []);
    const updateSettings = useCallback((update) => setState(p => ({ ...p, settings: { ...p.settings, ...update } })), []);

    const createTab = useCallback((type = 'note', parentId = null) => {
        const id = generateId();
        setState(prev => {
            const newState = clone(prev);
            let targetList = newState.tabs;

            const findParentList = (items) => {
                for (const item of items) {
                    if (item.id === parentId) return item.children;
                    if (item.children) {
                        const res = findParentList(item.children);
                        if (res) return res;
                    }
                }
                return null;
            };

            if (parentId) {
                const found = findParentList(newState.tabs);
                if (found) targetList = found;
            }

            let baseTitle = type === 'folder' ? 'New Folder' : 'Untitled';
            let finalTitle = baseTitle;
            let counter = 1;
            while (targetList.some(item => item.title.toLowerCase() === finalTitle.toLowerCase())) {
                finalTitle = `${baseTitle} ${++counter}`;
            }

            const newItem = { id, title: finalTitle, content: '', type, children: type === 'folder' ? [] : undefined };
            targetList.push(newItem);
            if (type === 'note') newState.activeTabId = id;
            return newState;
        });
        return id;
    }, []);

    const updateTabContent = useCallback((id, content) => {
        setState(prev => {
            const newState = clone(prev);
            const update = (items) => {
                for (const item of items) {
                    if (item.id === id) { item.content = content; return true; }
                    if (item.children && update(item.children)) return true;
                }
                return false;
            };
            update(newState.tabs);
            return newState;
        });
    }, []);

    const renameTab = useCallback((id, newTitle) => {
        setState(prev => {
            const newState = clone(prev);
            const rename = (items) => {
                for (const item of items) {
                    if (item.id === id) { item.title = newTitle; return true; }
                    if (item.children && rename(item.children)) return true;
                }
                return false;
            }
            rename(newState.tabs);
            return newState;
        });
    }, []);

    const deleteTab = useCallback((id) => {
        setState(prev => {
            const newState = clone(prev);
            const remove = (items) => {
                const idx = items.findIndex(i => i.id === id);
                if (idx !== -1) { items.splice(idx, 1); return true; }
                for (const item of items) { if (item.children && remove(item.children)) return true; }
                return false;
            };
            remove(newState.tabs);

            if (newState.activeTabId === id) {
                const findAnyNote = (items) => {
                    for (const i of items) {
                        if (i.type === 'note') return i.id;
                        if (i.children) { const r = findAnyNote(i.children); if (r) return r; }
                    }
                    return null;
                };
                newState.activeTabId = findAnyNote(newState.tabs);
            }
            if (newState.tabs.length === 0) {
                const newId = generateId();
                newState.tabs = [{ id: newId, title: 'Untitled', content: '', type: 'note' }];
                newState.activeTabId = newId;
            }
            return newState;
        });
    }, []);

    const clearAll = useCallback(() => {
        const id = generateId();
        setState({
            ...INITIAL_STATE,
            tabs: [{ id, title: 'Untitled', content: '', type: 'note' }],
            activeTabId: id
        });
    }, []);

    const toggleFolder = useCallback((id) => {
        setState(prev => ({
            ...prev,
            collapsedFolders: prev.collapsedFolders.includes(id)
                ? prev.collapsedFolders.filter(c => c !== id)
                : [...prev.collapsedFolders, id]
        }));
    }, []);

    const moveItem = useCallback((activeId, overId) => {
        setState(prev => {
            const newState = clone(prev);
            const find = (items, id, parent = null) => {
                for (const item of items) {
                    if (item.id === id) return { item, parent };
                    if (item.children) { const r = find(item.children, id, item); if (r) return r; }
                }
                return null;
            };
            const activeRes = find(newState.tabs, activeId);
            const overRes = find(newState.tabs, overId);
            if (!activeRes || !overRes) return prev;

            const { item: activeItem, parent: activeParent } = activeRes;
            const sourceList = activeParent ? activeParent.children : newState.tabs;
            const activeIndex = sourceList.findIndex(i => i.id === activeId);
            sourceList.splice(activeIndex, 1);

            const { item: overItem, parent: overParent } = overRes;
            const targetList = overParent ? overParent.children : newState.tabs;
            const overIndex = targetList.findIndex(i => i.id === overId);
            targetList.splice(overIndex, 0, activeItem);
            return newState;
        });
    }, []);

    const setEncryptionKeyAction = useCallback(async (password) => {
        if (isLocked) {
            const hash = window.location.hash.substring(1).substring(4);
            const decrypted = await decryptText(hash, password);
            if (decrypted) {
                try {
                    const parsed = JSON.parse(decrypted);
                    setState(parsed);
                    setEncryptionKey(password);
                    setIsLocked(false);
                    return true;
                } catch (e) { return false; }
            }
            return false;
        } else {
            setEncryptionKey(password);
            return true;
        }
    }, [isLocked]);

    const backupNotebook = useCallback(async () => {
        try {
            const dataToSave = JSON.stringify(state);
            const hash = encryptionKey ? 'enc_' + await encryptText(dataToSave, encryptionKey) : await encodeToUrl(dataToSave);
            const fullUrl = window.location.origin + window.location.pathname + '#' + hash;
            const htmlContent = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta http-equiv="refresh" content="0; url=${fullUrl}"><title>Restoring...</title><script>window.location.href = "${fullUrl}";<\/script><style>body { font-family: sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; }</style></head><body><p>Opening your secure environment...</p><p><small>If not redirected, <a href="${fullUrl}" style="color: #3b82f6;">click here</a>.</small></p></body></html>`;
            const zip = new JSZip();
            zip.file("Notebook_Restore.html", htmlContent);
            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = "notebook_backup.zip"; a.click();
            URL.revokeObjectURL(url);
        } catch (e) { alert("Export failed."); }
    }, [state, encryptionKey]);

    const copyCurrentTab = useCallback(() => {
        const find = (items) => {
            for (const i of items) {
                if (i.id === state.activeTabId) return i;
                if (i.children) { const f = find(i.children); if (f) return f; }
            }
            return null;
        };
        const tab = find(state.tabs);
        if (tab?.content) navigator.clipboard.writeText(tab.content);
    }, [state.tabs, state.activeTabId]);

    const togglePanic = useCallback(() => setShowPanic(p => !p), []);

    // Persistence
    useEffect(() => {
        if (!isLoaded || isLocked) return;
        const handler = setTimeout(async () => {
            const data = JSON.stringify(state);
            const hash = encryptionKey ? 'enc_' + await encryptText(data, encryptionKey) : await encodeToUrl(data);
            if (window.location.hash.substring(1) !== hash) {
                window.history.replaceState(null, '', '#' + hash);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(handler);
    }, [state, encryptionKey, isLoaded, isLocked]);

    return {
        state, isLoaded, isLocked, showPanic,
        modal: { activeModal, modalData, openModal, closeModal },
        actions: {
            activateTab, createTab, updateTabContent, renameTab, deleteTab, clearAll,
            toggleFolder, moveItem, updateSettings, setEncryptionKey: setEncryptionKeyAction,
            togglePanic, backupNotebook, copyCurrentTab
        },
        hasKey: !!encryptionKey
    };
}
