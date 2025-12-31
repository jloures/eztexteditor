import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, FileSystemItem } from './types';

function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

// Helper to find parent array and splice
function deleteRecursive(items: FileSystemItem[], id: string): boolean {
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
        items.splice(idx, 1);
        return true;
    }
    for (const item of items) {
        if (item.children && deleteRecursive(item.children, id)) {
            return true;
        }
    }
    return false;
}

// Helper to find an item by id
function findItemRecursive(items: FileSystemItem[], id: string): FileSystemItem | null {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.children) {
            const found = findItemRecursive(item.children, id);
            if (found) return found;
        }
    }
    return null;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            items: [
                { id: 'welcome', title: 'Welcome', type: 'note', content: '# Welcome to EZ Text Editor\n\nStarts typing...', children: [] }
            ],
            activeTabId: 'welcome',
            sidebarWidth: 260,
            viewSettings: {
                isZenMode: false,
                isTypewriterMode: false,
                isPreviewMode: false,
                isDarkMode: true,
                showLineNumbers: false,
                activeModal: null
            },

            addNote: (parentId) => {
                const newItem: FileSystemItem = {
                    id: generateId(),
                    title: 'New Note',
                    type: 'note',
                    content: '',
                };

                set((state) => {
                    const newItems = [...state.items];
                    if (!parentId) {
                        newItems.push(newItem);
                    } else {
                        const parent = findItemRecursive(newItems, parentId);
                        if (parent && parent.children) {
                            parent.children.push(newItem);
                            parent.isOpen = true;
                        }
                    }
                    return { items: newItems, activeTabId: newItem.id };
                });
            },

            addFolder: (parentId) => {
                const newItem: FileSystemItem = {
                    id: generateId(),
                    title: 'New Folder',
                    type: 'folder',
                    children: [],
                    isOpen: true
                };

                set((state) => {
                    const newItems = [...state.items];
                    if (!parentId) {
                        newItems.push(newItem);
                    } else {
                        const parent = findItemRecursive(newItems, parentId);
                        if (parent && parent.children) {
                            parent.children.push(newItem);
                            parent.isOpen = true;
                        }
                    }
                    return { items: newItems };
                });
            },

            deleteItem: (id) => {
                set((state) => {
                    const newItems = [...state.items];
                    deleteRecursive(newItems, id);
                    // If active item deleted, select first available or null
                    let newActiveId = state.activeTabId;
                    if (state.activeTabId === id) {
                        // Simple fallback: first item or null. 
                        // Logic could be improved to select neighbor.
                        newActiveId = newItems.length > 0 && newItems[0].type === 'note' ? newItems[0].id : null;
                    }
                    return { items: newItems, activeTabId: newActiveId };
                });
            },

            renameItem: (id, newTitle) => {
                set((state) => {
                    const newItems = [...state.items];
                    const item = findItemRecursive(newItems, id);
                    if (item) item.title = newTitle;
                    return { items: newItems };
                });
            },

            activateItem: (id) => {
                set({ activeTabId: id });
            },

            updateContent: (id, content) => {
                set((state) => {
                    const newItems = [...state.items];
                    const item = findItemRecursive(newItems, id);
                    if (item) item.content = content;
                    return { items: newItems };
                });
            },

            toggleFolder: (id) => {
                set((state) => {
                    const newItems = [...state.items];
                    const item = findItemRecursive(newItems, id);
                    if (item) item.isOpen = !item.isOpen;
                    return { items: newItems };
                });
            },

            setSidebarWidth: (width) => set({ sidebarWidth: width }),

            toggleZenMode: () => set((state) => ({
                viewSettings: { ...state.viewSettings, isZenMode: !state.viewSettings.isZenMode }
            })),
            toggleTypewriterMode: () => set((state) => ({
                viewSettings: { ...state.viewSettings, isTypewriterMode: !state.viewSettings.isTypewriterMode }
            })),
            togglePreviewMode: () => set((state) => ({
                viewSettings: { ...state.viewSettings, isPreviewMode: !state.viewSettings.isPreviewMode }
            })),
            toggleDarkMode: () => set((state) => ({
                viewSettings: { ...state.viewSettings, isDarkMode: !state.viewSettings.isDarkMode }
            })),

            openModal: (modal) => set((state) => ({
                viewSettings: { ...state.viewSettings, activeModal: modal }
            })),
            closeModal: () => set((state) => ({
                viewSettings: { ...state.viewSettings, activeModal: null }
            })),
            toggleLineNumbers: () => set((state) => ({
                viewSettings: { ...state.viewSettings, showLineNumbers: !state.viewSettings.showLineNumbers }
            })),
        }),
        {
            name: 'eztexteditor-storage',
            // partially persist? or persist almost everything
        }
    )
);
