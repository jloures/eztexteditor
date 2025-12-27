import { useState, useEffect, useCallback, useRef } from 'react';
import { encodeToUrl, decodeFromUrl, encryptText, deriveKey } from '../utils/persistence';
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

    // ... Init logic (kept mostly same but ensure autoLockMinutes is respected) ...
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
                try {
                    const parsed = JSON.parse(decoded);
                    if (!parsed.tabs) throw new Error("Legacy");
                    // Ensure defaults
                    const merged = { ...INITIAL_STATE, ...parsed, settings: { ...INITIAL_STATE.settings, ...parsed.settings } };
                    setState(merged);
                } catch (e) {
                    const id = generateId();
                    setState({
                        ...INITIAL_STATE,
                        tabs: [{ id, title: 'Untitled', content: decoded || '', type: 'note' }],
                        activeTabId: id
                    });
                }
            } else {
                // Empty start
                if (state.tabs.length === 0) {
                    const id = generateId();
                    setState({
                        ...INITIAL_STATE,
                        tabs: [{ id, title: 'Untitled', content: '', type: 'note' }],
                        activeTabId: id
                    });
                }
            }
            setIsLoaded(true);
        };
        init();
    }, []);

    // Activity Tracking for AutoLock
    useEffect(() => {
        const reset = () => lastActivity.current = Date.now();
        window.addEventListener('mousemove', reset);
        window.addEventListener('keydown', reset);
        window.addEventListener('mousedown', reset);

        const interval = setInterval(() => {
            if (state.autoLockMinutes > 0 && !isLocked && !activeModal) { // Don't lock if modal open (like unlock modal)
                const elapsed = (Date.now() - lastActivity.current) / 1000 / 60;
                if (elapsed >= state.autoLockMinutes) {
                    location.reload(); // Lock by reload
                }
            }
            // Expiry Check
            if (state.expiryDate) {
                const expiry = new Date(state.expiryDate).getTime();
                if (Date.now() > expiry) {
                    alert("This note has expired and will self-destruct.");
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


    // Action creators
    const activateTab = useCallback((id) => setState(p => ({ ...p, activeTabId: id })), []);
    const updateSettings = useCallback((update) => setState(p => ({ ...p, settings: { ...p.settings, ...update } })), []);

    // ... toggleFolder, createTab, etc (same) ...
    // Re-implementing simplified for the diff apply
    const createTab = useCallback((type = 'note', parentId = null) => {
        const id = generateId();
        setState(prev => {
            const newState = clone(prev);
            // ... (Logic same as before, omitted for brevity in plan but WILL include in file write)
            // Actually I'm writing the whole file so I should include it.
            let targetList = newState.tabs;
            if (parentId) {
                const findParent = (items) => {
                    for (const item of items) {
                        if (item.id === parentId) return item.children;
                        if (item.children) {
                            const res = findParent(item.children);
                            if (res) return res;
                        }
                    }
                    return null;
                };
                const found = findParent(newState.tabs);
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
                    if (item.children) if (update(item.children)) return true;
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
            const renameRecursive = (items) => {
                for (const item of items) {
                    if (item.id === id) { item.title = newTitle; return true; }
                    if (item.children && renameRecursive(item.children)) return true;
                }
                return false;
            }
            renameRecursive(newState.tabs);
            return newState;
        });
    }, []);

    const deleteTab = useCallback((id) => {
        setState(prev => {
            const newState = clone(prev);
            if (id === 'ALL') {
                // Clear All Logic
                newState.tabs = [];
                newState.activeTabId = null;
                // Add one new tab
                const newId = generateId();
                newState.tabs.push({ id: newId, title: 'Untitled', content: '', type: 'note' });
                newState.activeTabId = newId;
                return newState;
            }

            const removeRecursive = (items) => {
                const idx = items.findIndex(i => i.id === id);
                if (idx !== -1) { items.splice(idx, 1); return true; }
                for (const item of items) { if (item.children && removeRecursive(item.children)) return true; }
                return false;
            };
            removeRecursive(newState.tabs);

            if (prev.activeTabId === id) {
                const findFirst = (items) => {
                    for (const item of items) {
                        if (item.type === 'note') return item.id;
                        if (item.children) { const res = findFirst(item.children); if (res) return res; }
                    }
                    return null;
                };
                newState.activeTabId = findFirst(newState.tabs);
            }
            return newState;
        });
    }, []);

    const toggleFolder = useCallback((id) => {
        setState(prev => {
            const isCollapsed = prev.collapsedFolders.includes(id);
            return {
                ...prev,
                collapsedFolders: isCollapsed ? prev.collapsedFolders.filter(c => c !== id) : [...prev.collapsedFolders, id]
            };
        });
    }, []);

    const moveItem = useCallback((activeId, overId) => {
        setState(prev => {
            // ... (Logic kept SAME as existing)
            const newState = clone(prev);
            const findItemAndParent = (items, id, parent = null) => {
                for (const item of items) {
                    if (item.id === id) return { item, parent };
                    if (item.children) {
                        const result = findItemAndParent(item.children, id, item);
                        if (result) return result;
                    }
                }
                return null;
            };
            const activeRes = findItemAndParent(newState.tabs, activeId);
            const overRes = findItemAndParent(newState.tabs, overId);
            if (!activeRes || !overRes) return prev;
            const { item: activeItem, parent: activeParent } = activeRes;
            const { item: overItem, parent: overParent } = overRes;

            const sourceList = activeParent ? activeParent.children : newState.tabs;
            const activeIndex = sourceList.findIndex(i => i.id === activeId);
            sourceList.splice(activeIndex, 1);

            const targetList = overParent ? overParent.children : newState.tabs;
            const overIndex = targetList.findIndex(i => i.id === overId);
            targetList.splice(overIndex, 0, activeItem);
            return newState;
        });
    }, []);

    // NEW: Download/Backup (Legacy Style)
    const backupNotebook = useCallback(async () => {
        try {
            const dataToSave = JSON.stringify(state);
            let hash = '';
            if (encryptionKey) {
                hash = 'enc_' + await encryptText(dataToSave, encryptionKey);
            } else {
                hash = await encodeToUrl(dataToSave);
            }

            const fullUrl = window.location.origin + window.location.pathname + '#' + hash;

            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="refresh" content="0; url=${fullUrl}">
    <title>Restoring Notebook...</title>
    <script>
        window.location.href = "${fullUrl}";
    <\/script>
    <style>
        body { font-family: sans-serif; background: #121212; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; flex-direction: column; }
        a { color: #3b82f6; }
    </style>
</head>
<body>
    <p>Opening your notebook secure environment...</p>
    <p><small>If not redirected automatically, <a href="${fullUrl}">click here</a>.</small></p>
</body>
</html>`;

            const zip = new JSZip();
            zip.file("EzTextEditor_Backup.html", htmlContent);

            const blob = await zip.generateAsync({ type: "blob" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = "notebook_backup.zip";
            a.click();
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error("Export failed:", e);
            alert("Failed to export notebook.");
        }
    }, [state, encryptionKey]);

    const copyCurrentTab = useCallback(() => {
        setState(current => {
            const find = (items) => {
                for (const i of items) {
                    if (i.id === current.activeTabId) return i;
                    if (i.children) { const f = find(i.children); if (f) return f; }
                }
                return null;
            };
            const tab = find(current.tabs);
            if (tab && tab.content) {
                navigator.clipboard.writeText(tab.content);
                // Ideally show toast
            }
            return current;
        });
    }, []);

    const setEncryptionKeyAction = useCallback((password) => {
        setEncryptionKey(password);
        setIsLocked(false);
    }, []);

    const togglePanic = useCallback(() => setShowPanic(p => !p), []);

    // Persistence Effect
    useEffect(() => {
        if (!isLoaded || isLocked) return;
        const handler = setTimeout(async () => {
            const data = JSON.stringify(state);
            let hash = '';
            if (encryptionKey) {
                hash = 'enc_' + await encryptText(data, encryptionKey);
            } else {
                hash = await encodeToUrl(data);
            }
            if (window.location.hash.substring(1) !== hash) {
                window.history.replaceState(null, '', '#' + hash);
            }
        }, DEBOUNCE_MS);
        return () => clearTimeout(handler);
    }, [state, encryptionKey, isLoaded, isLocked]);

    return {
        state,
        isLoaded,
        isLocked,
        showPanic,
        modal: { activeModal, modalData, openModal, closeModal },
        actions: {
            activateTab,
            createTab,
            updateTabContent,
            renameTab,
            deleteTab,
            toggleFolder,
            moveItem,
            updateSettings,
            setEncryptionKey: setEncryptionKeyAction,
            togglePanic,
            backupNotebook,
            copyCurrentTab
        },
        hasKey: !!encryptionKey
    };
}
