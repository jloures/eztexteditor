import { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { encryptText, encodeToUrl, decodeFromUrl } from '../utils/crypto';
import { createTab } from '../utils/tabs';
import type { AppState } from '../types';

export const usePersistence = () => {
    const state = useStore();
    const isFirstLoad = useRef(true);

    // Save Logic (Debounced)
    useEffect(() => {
        if (isFirstLoad.current) return;

        const save = async () => {
            const dataToSave: Partial<AppState> = {
                tabs: state.tabs,
                activeTabId: state.activeTabId,
                autoLockMinutes: state.autoLockMinutes,
                expiryDate: state.expiryDate,
                collapsedFolders: state.collapsedFolders,
                settings: state.settings
            };

            const json = JSON.stringify(dataToSave);

            try {
                let hash;
                if (state.encryptionKey) {
                    hash = 'enc_' + await encryptText(json, state.encryptionKey);
                } else {
                    hash = await encodeToUrl(json);
                }

                // Avoid pushing history for every keystroke, use replaceState
                window.history.replaceState(null, '', '#' + hash);
            } catch (e) {
                console.error("Save failed", e);
            }
        };

        const timeout = setTimeout(save, 500);
        return () => clearTimeout(timeout);
    }, [state.tabs, state.activeTabId, state.settings, state.encryptionKey, state.collapsedFolders]); // Dependencies that trigger save

    // Load Logic
    useEffect(() => {
        const load = async () => {
            const hash = window.location.hash.substring(1);
            if (!hash) {
                // Initialize default
                if (state.tabs.length === 0) {
                    const t = createTab();
                    state.setTabs([t]);
                    state.setActiveTabId(t.id);
                }
                isFirstLoad.current = false;
                return;
            }

            if (hash.startsWith('enc_')) {
                // Handle encrypted - we can't load yet, we need password
                // This logic needs coordination with a password modal or global state
                // For now, we assume we might set a flag or let the UI ask
                // But simplified: we just don't load content yet.
                // Or trigger a "Locked" state.
                state.setEncryptionKey('PENDING'); // Hack to signal locked
            } else {
                const decoded = await decodeFromUrl(hash);
                if (decoded) {
                    try {
                        const parsed = JSON.parse(decoded);
                        state.setTabs(parsed.tabs || []);
                        state.setActiveTabId(parsed.activeTabId || null);
                        state.updateSettings(parsed.settings || {});
                        // ... other props
                    } catch (e) { console.error(e); }
                }
            }
            isFirstLoad.current = false;
        };
        load();
    }, []); // Run once on mount
};
