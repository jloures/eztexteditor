import { create } from 'zustand';
import type { AppState, Tab, AppSettings } from './types';

interface StoreState extends AppState {
    // Actions
    setTabs: (tabs: Tab[]) => void;
    setActiveTabId: (id: string | null) => void;
    updateTab: (id: string, updates: Partial<Tab>) => void;
    setSidebarWidth: (width: number) => void;
    setEncryptionKey: (key: string | null) => void;
    togglePanicMode: () => void;
    updateSettings: (settings: Partial<AppSettings>) => void;
    toggleFolder: (id: string) => void;

    // Computed helpers could go here or in hooks
}

export const useStore = create<StoreState>((set) => ({
    tabs: [],
    activeTabId: null,
    autoLockMinutes: 0,
    expiryDate: null,
    collapsedFolders: [],
    sidebarWidth: 260,
    settings: {
        isPreviewMode: false,
        isZen: false,
        isTypewriter: false,
        showLineNumbers: false,
    },
    encryptionKey: null,
    isPanicMode: false,

    setTabs: (tabs) => set({ tabs }),
    setActiveTabId: (activeTabId) => set({ activeTabId }),
    updateTab: (id, updates) => set((state) => {
        // Recursive update helper
        const updateRecursive = (items: Tab[]): Tab[] => {
            return items.map(item => {
                if (item.id === id) {
                    return { ...item, ...updates };
                }
                if (item.children) {
                    return { ...item, children: updateRecursive(item.children) };
                }
                return item;
            });
        };
        return { tabs: updateRecursive(state.tabs) };
    }),

    setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
    setEncryptionKey: (encryptionKey) => set({ encryptionKey }),
    togglePanicMode: () => set((state) => ({ isPanicMode: !state.isPanicMode })),

    updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
    })),

    toggleFolder: (id) => set((state) => {
        const isCollapsed = state.collapsedFolders.includes(id);
        return {
            collapsedFolders: isCollapsed
                ? state.collapsedFolders.filter(fid => fid !== id)
                : [...state.collapsedFolders, id]
        };
    }),
}));
