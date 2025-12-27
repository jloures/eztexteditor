import { useState, useEffect, useCallback } from 'react';
import { encodeToUrl, decodeFromUrl, encryptText } from '../utils/persistence';

const DEBOUNCE_MS = 500;

const INITIAL_STATE = {
    tabs: [],
    activeTabId: null,
    collapsedFolders: [],
    settings: {
        isPreviewMode: false,
        isZen: false,
        showLineNumbers: false,
    }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Helper to deep clone
const clone = (obj) => JSON.parse(JSON.stringify(obj));

export function useAppState() {
    const [state, setState] = useState(INITIAL_STATE);
    const [encryptionKey, setEncryptionKey] = useState(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Initial Load
    useEffect(() => {
        const init = async () => {
            const hash = window.location.hash.substring(1);
            if (hash.startsWith('enc_')) {
                setIsLocked(true);
                setIsLoaded(true);
                return;
            }
            if (hash) {
                const decoded = await decodeFromUrl(hash);
                try {
                    const parsed = JSON.parse(decoded);
                    // Migration check
                    if (!parsed.tabs) throw new Error("Legacy");
                    setState(parsed);
                } catch (e) {
                    const id = generateId();
                    setState({
                        ...INITIAL_STATE,
                        tabs: [{ id, title: 'Untitled', content: decoded || '', type: 'note' }],
                        activeTabId: id
                    });
                }
            } else {
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

    const activateTab = useCallback((id) => {
        setState(prev => ({ ...prev, activeTabId: id }));
    }, []);

    const toggleFolder = useCallback((id) => {
        setState(prev => {
            const isCollapsed = prev.collapsedFolders.includes(id);
            return {
                ...prev,
                collapsedFolders: isCollapsed
                    ? prev.collapsedFolders.filter(c => c !== id)
                    : [...prev.collapsedFolders, id]
            };
        });
    }, []);

    // Create Tab with Uniqueness
    const createTab = useCallback((type = 'note', parentId = null) => {
        const id = generateId();
        setState(prev => {
            const newState = clone(prev);

            // Find target list
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

            // Uniqueness check
            let baseTitle = type === 'folder' ? 'New Folder' : 'Untitled'; // Or 'New Note'

            let finalTitle = baseTitle;
            let counter = 1;
            while (targetList.some(item => item.title.toLowerCase() === finalTitle.toLowerCase())) {
                finalTitle = `${baseTitle} ${++counter}`;
            }

            const newItem = {
                id,
                title: finalTitle,
                content: '',
                type,
                children: type === 'folder' ? [] : undefined
            };

            targetList.push(newItem);

            // Auto activate if note
            if (type === 'note') newState.activeTabId = id;

            return newState;
        });
        return id;
    }, []);

    const updateTabContent = useCallback((id, content) => {
        setState(prev => {
            // Optimization: Only clone if found? 
            // For now, clone entire state is easiest safe way
            const newState = clone(prev);

            const update = (items) => {
                for (const item of items) {
                    if (item.id === id) {
                        item.content = content;
                        return true;
                    }
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
                    if (item.id === id) {
                        item.title = newTitle;
                        return true;
                    }
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
            const removeRecursive = (items) => {
                const idx = items.findIndex(i => i.id === id);
                if (idx !== -1) {
                    items.splice(idx, 1);
                    return true;
                }
                for (const item of items) {
                    if (item.children && removeRecursive(item.children)) return true;
                }
                return false;
            };
            removeRecursive(newState.tabs);

            // If active tab deleted, switch to another
            if (prev.activeTabId === id) {
                // Find first available note
                const findFirstNote = (items) => {
                    for (const item of items) {
                        if (item.type === 'note') return item.id;
                        if (item.children) {
                            const res = findFirstNote(item.children);
                            if (res) return res;
                        }
                    }
                    return null;
                };
                newState.activeTabId = findFirstNote(newState.tabs);
            }

            return newState;
        });
    }, []);

    // Persistence
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
        actions: {
            activateTab,
            createTab,
            updateTabContent,
            renameTab,
            deleteTab,
            toggleFolder,
            setState
        }
    };
}
