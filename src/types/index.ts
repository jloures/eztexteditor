export type TabType = 'note' | 'folder';

export interface Tab {
    id: string;
    title: string;
    type: TabType;
    content?: string;
    children?: Tab[]; // For folders
    cursorPos?: number;
    isOpen?: boolean; // For folders visual state (collapsed/expanded is usually separate but let's check legacy)
}

export interface AppSettings {
    isPreviewMode: boolean;
    isZen: boolean;
    isTypewriter: boolean;
    showLineNumbers: boolean;
}

export interface AppState {
    tabs: Tab[];
    activeTabId: string | null;
    autoLockMinutes: number;
    expiryDate: string | null;
    collapsedFolders: string[]; // storage for folder IDs
    sidebarWidth: number;

    // UI State (Ephemeral or persisted via URL/Settings)
    settings: AppSettings;
    encryptionKey: string | null;
    isPanicMode: boolean;
}
