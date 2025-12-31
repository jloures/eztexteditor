export interface FileSystemItem {
    id: string;
    title: string;
    type: 'note' | 'folder';
    content?: string; // Only for notes
    cursorPos?: number;
    isOpen?: boolean; // For folders (collapsed state)
    children?: FileSystemItem[]; // For folders
    parentId?: string | null;
}

export type ModalType = 'search' | 'settings' | 'graph' | 'panic' | null;

export interface ViewSettings {
    isZenMode: boolean;
    isTypewriterMode: boolean;
    isPreviewMode: boolean;
    isDarkMode: boolean;
    showLineNumbers: boolean;
    activeModal: ModalType;
}

export interface AppState {
    items: FileSystemItem[];
    activeTabId: string | null;
    sidebarWidth: number;
    viewSettings: ViewSettings;

    // Actions
    addNote: (parentId?: string) => void;
    addFolder: (parentId?: string) => void;
    deleteItem: (id: string) => void;
    renameItem: (id: string, newTitle: string) => void;
    activateItem: (id: string) => void;
    updateContent: (id: string, content: string) => void;
    toggleFolder: (id: string) => void;
    setSidebarWidth: (width: number) => void;

    // View Actions
    toggleZenMode: () => void;
    toggleTypewriterMode: () => void;
    togglePreviewMode: () => void;
    toggleDarkMode: () => void;
    openModal: (modal: ModalType) => void;
    closeModal: () => void;
    toggleLineNumbers: () => void;
}
