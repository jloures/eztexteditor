// EZ Text Editor - Main Entry Point (WASM-accelerated)
import {
    initWasm,
    wasmParseMarkdown,
    wasmPreprocessMarkdown,
    wasmSearchAllNotes,
    wasmSearchInContent,
    wasmCountLines,
    wasmCountWords,
    wasmLineAtOffset,
    wasmGenerateLineNumbers,
    wasmBase64UrlEncode,
    wasmBase64UrlDecode,
    wasmHighlightMatch,
} from './wasm-bridge.js';

// ─── Configuration ──────────────────────────────────────────────────────────
const APP_BASE_URL = window.location.origin + window.location.pathname.replace(/\/$/, "");

// ─── State Management ───────────────────────────────────────────────────────
let appState = {
    tabs: [],
    activeTabId: null,
    autoLockMinutes: 0,
    expiryDate: null,
    collapsedFolders: []
};

let encryptionKey = null;
let isPreviewMode = false;
let isModalOpen = false;
let saveTimeout;
let isResizing = false;
let sidebarWidth = 260;
let lastActivity = Date.now();
let isPanicMode = false;

// ─── Platform Detection ─────────────────────────────────────────────────────
const IS_MAC = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
const CTRL_CMD = IS_MAC ? '⌘' : 'Ctrl';
const ALT_OPT = IS_MAC ? '⌥' : 'Alt';

// ─── DOM Elements ───────────────────────────────────────────────────────────
const editor = document.getElementById('editor');
const preview = document.getElementById('preview');
const lineHighlight = document.getElementById('line-highlight');
const tabBar = document.getElementById('tabBar');
const addTabBtn = document.getElementById('addTabBtn');
const sidebar = document.getElementById('sidebar');
const resizer = document.getElementById('sidebar-resizer');

const previewToggle = document.getElementById('previewToggle');
const modeBadge = document.getElementById('modeBadge');
const wordCountDisplay = document.getElementById('wordCount');
const encryptionBadge = document.getElementById('encryptionBadge');
const themeToggle = document.getElementById('themeToggle');
const saveIndicator = document.getElementById('saveIndicator');
const clearBtn = document.getElementById('clearBtn');
const newBtn = document.getElementById('newBtn');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const lockBtn = document.getElementById('lockBtn');
const shareBtn = document.getElementById('shareBtn');

const passwordModal = document.getElementById('passwordModal');
const modalContainer = document.getElementById('modalContainer');
const passwordInput = document.getElementById('passwordInput');
const passwordError = document.getElementById('passwordError');
const modalSubmit = document.getElementById('modalSubmit');
const modalCancel = document.getElementById('modalCancel');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');

const shareModal = document.getElementById('shareModal');
const shareLinkArea = document.getElementById('shareLinkArea');
const shareClose = document.getElementById('shareClose');
const shareCopy = document.getElementById('shareCopy');

const zenToggle = document.getElementById('zenToggle');
const typewriterToggle = document.getElementById('typewriterToggle');
const searchToggle = document.getElementById('searchToggle');
const searchModal = document.getElementById('searchModal');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchStatus = document.getElementById('searchStatus');

const localSearchModal = document.getElementById('localSearchModal');
const localSearchInput = document.getElementById('localSearchInput');
const localSearchResults = document.getElementById('localSearchResults');
const localSearchStatus = document.getElementById('localSearchStatus');
const wikiSuggestion = document.getElementById('wikiSuggestion');
const graphBtn = document.getElementById('graphBtn');
const graphModal = document.getElementById('graphModal');
const graphClose = document.getElementById('graphClose');
const graphContainer = document.getElementById('graphContainer');
const addFolderBtn = document.getElementById('addFolderBtn');

const securityBtn = document.getElementById('securityBtn');
const panicBtn = document.getElementById('panicBtn');
const infoBtn = document.getElementById('infoBtn');
const linesToggle = document.getElementById('linesToggle');
const infoModal = document.getElementById('infoModal');
const infoClose = document.getElementById('infoClose');
const infoCloseBtn = document.getElementById('infoCloseBtn');
const startTutorialBtn = document.getElementById('startTutorialBtn');
const securityModal = document.getElementById('securityModal');
const autoLockInput = document.getElementById('autoLockInput');
const expiryInput = document.getElementById('expiryInput');
const securitySave = document.getElementById('securitySave');
const securityCancel = document.getElementById('securityCancel');
const panicOverlay = document.getElementById('panicOverlay');

const renameModal = document.getElementById('renameModal');
const renameInput = document.getElementById('renameInput');
const renameSubmit = document.getElementById('renameSubmit');
const renameCancel = document.getElementById('renameCancel');

const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmDesc = document.getElementById('confirmDesc');
const confirmYes = document.getElementById('confirmYes');
const confirmCancel = document.getElementById('confirmCancel');

let confirmCallback = null;

// ─── Confirm Modal ──────────────────────────────────────────────────────────
function showConfirm(title, desc, callback) {
    confirmTitle.innerText = title;
    confirmDesc.innerText = desc;
    confirmCallback = callback;
    confirmModal.classList.remove('hidden');
    isModalOpen = true;
}

confirmYes.onclick = () => {
    if (confirmCallback) confirmCallback();
    confirmModal.classList.add('hidden');
    isModalOpen = false;
};

confirmCancel.onclick = () => {
    confirmModal.classList.add('hidden');
    isModalOpen = false;
};

// ─── Sidebar Resizing ───────────────────────────────────────────────────────
resizer.addEventListener('mousedown', (e) => {
    if (sidebar.classList.contains('collapsed')) return;
    isResizing = true;
    sidebar.classList.add('resizing');
    resizer.classList.add('active');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
});

window.addEventListener('mousemove', (e) => {
    if (!isResizing) return;
    const newWidth = e.clientX;
    if (newWidth >= 160 && newWidth <= 600) {
        sidebarWidth = newWidth;
        sidebar.style.width = `${sidebarWidth}px`;
    }
});

window.addEventListener('mouseup', () => {
    if (!isResizing) return;
    isResizing = false;
    sidebar.classList.remove('resizing');
    resizer.classList.remove('active');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    localStorage.setItem('sidebarWidth', sidebarWidth);
});

const savedWidth = localStorage.getItem('sidebarWidth');
if (savedWidth) {
    sidebarWidth = parseInt(savedWidth);
    if (!sidebar.classList.contains('collapsed')) {
        sidebar.style.width = `${sidebarWidth}px`;
    }
}

// ─── Tab Logic ──────────────────────────────────────────────────────────────
function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function createTab(title = "Untitled", content = "", type = "note", targetList = appState.tabs) {
    let finalTitle = title;
    let counter = 1;
    while (targetList.some(item => item.title.toLowerCase() === finalTitle.toLowerCase())) {
        finalTitle = `${title} ${++counter}`;
    }
    const id = generateId();
    const item = { id, title: finalTitle, content, type };
    if (type === 'folder') item.children = [];
    targetList.push(item);
    return id;
}

// Expose for tests
window.appState = appState;
window.createTab = createTab;

let tabToRenameId = null;

function openRenameModal(id) {
    const tab = findItemById(id);
    if (!tab) return;
    tabToRenameId = id;
    if (tab.title === "Untitled" || tab.title === "New Folder") {
        renameInput.value = "";
        renameInput.placeholder = tab.title;
    } else {
        renameInput.value = tab.title;
    }
    renameModal.classList.remove('hidden');
    renameInput.focus();
    if (renameInput.value) renameInput.select();
    isModalOpen = true;
}

function closeRenameModal() {
    renameModal.classList.add('hidden');
    isModalOpen = false;
    tabToRenameId = null;
}

renameSubmit.addEventListener('click', () => {
    if (tabToRenameId) {
        const tab = findItemById(tabToRenameId);
        const newTitle = renameInput.value.trim();
        if (tab && newTitle) {
            if (newTitle.includes('/') || newTitle.includes('\\')) {
                alert("Names cannot contain slashes '/' or '\\'.");
                return;
            }
            const parent = findParent(tabToRenameId);
            const siblings = parent ? parent.children : appState.tabs;
            const exists = siblings.some(s => s.id !== tabToRenameId && s.title.toLowerCase() === newTitle.toLowerCase());
            if (exists) {
                alert(`An item named "${newTitle}" already exists in this folder.`);
                return;
            }
            tab.title = newTitle;
            renderTabs();
            performSave();
        }
    }
    closeRenameModal();
});

renameCancel.addEventListener('click', closeRenameModal);

renameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') renameSubmit.click();
    if (e.key === 'Escape') closeRenameModal();
});

function renameTab(id) {
    openRenameModal(id);
}

function activateTab(id) {
    const tab = findItemById(id);
    if (!tab || tab.type === 'folder') return;

    if (appState.activeTabId && appState.activeTabId !== id) {
        updateCurrentTabState();
    }

    appState.activeTabId = id;
    editor.value = tab.content || "";

    renderTabs();
    updateCounts();
    updateLineNumbers();

    if (tab.cursorPos !== undefined) {
        editor.setSelectionRange(tab.cursorPos, tab.cursorPos);
    }

    if (isPreviewMode) {
        renderMarkdownPreview();
    } else {
        editor.focus();
    }
    updateTypewriterAndHighlight(true);
}

function closeTab(e, id) {
    e.stopPropagation();
    const item = findItemById(id);
    if (!item) return;

    const msg = item.type === 'folder' ? "Delete Folder?" : "Close Tab?";
    const desc = item.type === 'folder' ? "This will delete the folder and all notes inside." : "Are you sure you want to close this tab?";

    showConfirm(msg, desc, () => {
        removeItemById(id);
        if (id === appState.activeTabId || item.type === 'folder') {
            const allNotes = [];
            function collectNotes(items) {
                items.forEach(i => {
                    if (i.type === 'note') allNotes.push(i);
                    if (i.type === 'folder') collectNotes(i.children);
                });
            }
            collectNotes(appState.tabs);
            if (allNotes.length > 0) {
                activateTab(allNotes[0].id);
            } else {
                const newId = createTab();
                activateTab(newId);
            }
        }
        renderTabs();
        performSave();
    });
}

function renderTabs() {
    tabBar.innerHTML = '';
    renderRecursive(appState.tabs, tabBar, 0);
}

function renderRecursive(items, container, depth) {
    items.forEach(item => {
        const el = createTabElement(item, depth);
        container.appendChild(el);
        if (item.type === 'folder' && !appState.collapsedFolders.includes(item.id)) {
            renderRecursive(item.children || [], container, depth + 1);
        }
    });
}

let draggedItemId = null;

function createTabElement(item, depth) {
    const isActive = item.id === appState.activeTabId;
    const isFolder = item.type === 'folder';
    const isCollapsed = appState.collapsedFolders.includes(item.id);

    const tabEl = document.createElement('div');
    tabEl.className = `tab ${isActive ? 'active' : ''} ${isFolder ? 'folder' : ''}`;
    tabEl.style.paddingLeft = `${depth * 16 + 12}px`;
    tabEl.draggable = true;

    const indent = document.createElement('div');
    indent.className = 'tab-indent';
    if (isFolder) {
        const toggle = document.createElement('i');
        toggle.className = `fas fa-chevron-right folder-toggle ${isCollapsed ? 'collapsed' : 'open'}`;
        toggle.onclick = (e) => {
            e.stopPropagation();
            if (isCollapsed) {
                appState.collapsedFolders = appState.collapsedFolders.filter(id => id !== item.id);
            } else {
                appState.collapsedFolders.push(item.id);
            }
            renderTabs();
            performSave();
        };
        indent.appendChild(toggle);
    }
    tabEl.appendChild(indent);

    const icon = document.createElement('i');
    icon.className = isFolder ? (isCollapsed ? 'fas fa-folder' : 'fas fa-folder-open') : 'fas fa-file-alt';
    icon.className += ' tab-icon';
    tabEl.appendChild(icon);

    const titleSpan = document.createElement('span');
    titleSpan.innerText = item.title;
    titleSpan.className = 'tab-title';
    tabEl.appendChild(titleSpan);

    const actions = document.createElement('div');
    actions.className = 'tab-actions';

    const renameBtn = document.createElement('div');
    renameBtn.className = 'action-btn';
    renameBtn.innerHTML = '<i class="fas fa-pen"></i>';
    renameBtn.onclick = (e) => { e.stopPropagation(); renameTab(item.id); };

    const deleteBtn = document.createElement('div');
    deleteBtn.className = 'action-btn delete';
    deleteBtn.innerHTML = '<i class="fas fa-times"></i>';
    deleteBtn.onclick = (e) => closeTab(e, item.id);

    actions.append(renameBtn, deleteBtn);
    tabEl.appendChild(actions);

    tabEl.onclick = () => { if (!isFolder) activateTab(item.id); };

    tabEl.ondragstart = (e) => {
        draggedItemId = item.id;
        tabEl.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
    };
    tabEl.ondragend = () => tabEl.classList.remove('dragging');
    tabEl.ondragover = (e) => {
        e.preventDefault();
        if (draggedItemId === item.id) return;
        if (isFolder) {
            tabEl.classList.add('drag-over-folder');
        } else {
            tabEl.classList.add('drag-over');
        }
    };
    tabEl.ondragleave = () => {
        tabEl.classList.remove('drag-over', 'drag-over-folder');
    };
    tabEl.ondrop = (e) => {
        e.preventDefault();
        tabEl.classList.remove('drag-over', 'drag-over-folder');
        if (draggedItemId === item.id) return;
        moveItem(draggedItemId, item.id, isFolder);
        renderTabs();
        performSave();
    };

    return tabEl;
}

function findItemById(id, items = appState.tabs) {
    for (const item of items) {
        if (item.id === id) return item;
        if (item.type === 'folder' && item.children) {
            const found = findItemById(id, item.children);
            if (found) return found;
        }
    }
    return null;
}

function findParent(id, items = appState.tabs, parent = null) {
    for (const item of items) {
        if (item.id === id) return parent;
        if (item.type === 'folder' && item.children) {
            const found = findParent(id, item.children, item);
            if (found) return found;
        }
    }
    return null;
}

function getItemPath(item, items = appState.tabs) {
    const parent = findParent(item.id, items);
    if (parent) {
        return (getItemPath(parent, items) + '/' + item.title).replace(/^\//, '');
    }
    return item.title;
}

function findItemByPath(path, items = appState.tabs) {
    const parts = path.split(/[\/\\]/).map(p => p.trim());
    let currentItems = items;
    let currentItem = null;

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i].toLowerCase();
        currentItem = currentItems.find(item => item.title.toLowerCase() === part);
        if (!currentItem) return null;
        if (i < parts.length - 1) {
            if (currentItem.type !== 'folder') return null;
            currentItems = currentItem.children;
        }
    }
    return currentItem;
}

function findTabByTitle(title, items = appState.tabs) {
    for (const item of items) {
        if (item.type === 'note' && item.title === title) return item;
        if (item.type === 'folder' && item.children) {
            const found = findTabByTitle(title, item.children);
            if (found) return found;
        }
    }
    return null;
}

function removeItemById(id, items = appState.tabs) {
    for (let i = 0; i < items.length; i++) {
        if (items[i].id === id) return items.splice(i, 1)[0];
        if (items[i].type === 'folder' && items[i].children) {
            const found = removeItemById(id, items[i].children);
            if (found) return found;
        }
    }
    return null;
}

function isDescendant(parentId, childId) {
    const parent = findItemById(parentId);
    if (!parent || parent.type !== 'folder') return false;
    function check(items) {
        for (const item of items) {
            if (item.id === childId) return true;
            if (item.type === 'folder' && item.children) {
                if (check(item.children)) return true;
            }
        }
        return false;
    }
    return check(parent.children);
}

function moveItem(sourceId, targetId, isTargetFolder) {
    if (sourceId === targetId) return;
    if (isDescendant(sourceId, targetId)) {
        alert("Cannot move a folder into its own subfolder.");
        return;
    }

    const item = removeItemById(sourceId);
    if (!item) return;

    let targetList;
    if (isTargetFolder) {
        const folder = findItemById(targetId);
        targetList = folder.children;
    } else {
        const targetParent = findParent(targetId);
        targetList = targetParent ? targetParent.children : appState.tabs;
    }

    let finalTitle = item.title;
    let counter = 1;
    while (targetList.some(s => s.id !== item.id && s.title.toLowerCase() === finalTitle.toLowerCase())) {
        finalTitle = `${item.title} ${++counter}`;
    }
    item.title = finalTitle;

    if (isTargetFolder) {
        targetList.push(item);
    } else {
        insertAfter(item, targetId, targetList);
    }
}

function insertAfter(item, targetId, list) {
    const idx = list.findIndex(i => i.id === targetId);
    if (idx !== -1) {
        list.splice(idx + 1, 0, item);
        return true;
    }
    for (const i of list) {
        if (i.type === 'folder' && i.children) {
            if (insertAfter(item, targetId, i.children)) return true;
        }
    }
    return false;
}

// ─── Core Editor Logic ──────────────────────────────────────────────────────

function updateCurrentTabState() {
    const tab = findItemById(appState.activeTabId);
    if (tab) {
        tab.content = editor.value;
        tab.cursorPos = editor.selectionStart;
    }
}

// ─── Crypto Logic (uses native Web Crypto API - already optimal) ────────────

async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const baseKey = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey(
        { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
        baseKey, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]
    );
}

async function encryptText(text, password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const encodedText = new TextEncoder().encode(text);
    const encryptedContent = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encodedText);
    const combined = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
    combined.set(salt, 0); combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedContent), salt.length + iv.length);
    return btoa(String.fromCharCode(...combined)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decryptText(encryptedBase64, password) {
    try {
        const combined = new Uint8Array(atob(encryptedBase64.replace(/-/g, '+').replace(/_/g, '/')).split('').map(c => c.charCodeAt(0)));
        const salt = combined.slice(0, 16); const iv = combined.slice(16, 28); const data = combined.slice(28);
        const key = await deriveKey(password, salt);
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
        return new TextDecoder().decode(decrypted);
    } catch (e) { return null; }
}

// ─── WASM-accelerated Base64 URL encoding ───────────────────────────────────

async function encodeToUrl(text) {
    const result = wasmBase64UrlEncode(text);
    if (result !== null) return result;
    // Fallback to JS
    const encoded = btoa(unescape(encodeURIComponent(text)));
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function decodeFromUrl(base64) {
    const result = wasmBase64UrlDecode(base64);
    if (result !== null) return result;
    // Fallback to JS
    try { return decodeURIComponent(escape(atob(base64.replace(/-/g, '+').replace(/_/g, '/')))); }
    catch (e) { return null; }
}

// ─── Save / Load Logic ─────────────────────────────────────────────────────

async function performSave() {
    updateCurrentTabState();
    updateCounts();

    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
        appState.settings = {
            isPreviewMode,
            isZen: document.body.classList.contains('zen-mode'),
            isTypewriter,
            showLineNumbers
        };

        const dataToSave = JSON.stringify(appState);

        try {
            let hash;
            if (encryptionKey) {
                hash = 'enc_' + await encryptText(dataToSave, encryptionKey);
            } else {
                hash = await encodeToUrl(dataToSave);
            }

            window.location.hash = hash;

            saveIndicator.classList.remove('opacity-0');
            setTimeout(() => saveIndicator.classList.add('opacity-0'), 1000);
        } catch (e) {
            console.error("Save failed", e);
        }
    }, 500);
}

function loadFromContent(content) {
    try {
        const parsed = JSON.parse(content);
        if (parsed.tabs && Array.isArray(parsed.tabs)) {
            appState = parsed;
            // Re-expose for tests
            window.appState = appState;
            if (!appState.activeTabId && appState.tabs.length > 0) {
                appState.activeTabId = appState.tabs[0].id;
            }
        } else {
            throw new Error("Not a state object");
        }
    } catch (e) {
        appState = {
            tabs: [],
            activeTabId: null,
            autoLockMinutes: 0,
            expiryDate: null,
            collapsedFolders: []
        };
        window.appState = appState;
        const id = createTab("Untitled", content || "");
        appState.activeTabId = id;
    }

    if (!appState.autoLockMinutes) appState.autoLockMinutes = 0;
    if (!appState.collapsedFolders) appState.collapsedFolders = [];

    if (appState.tabs.length === 0) {
        const id = createTab();
        appState.activeTabId = id;
    }

    activateTab(appState.activeTabId);

    if (appState.settings) {
        const s = appState.settings;
        if (s.isPreviewMode !== undefined && s.isPreviewMode !== isPreviewMode) {
            togglePreview();
        }
        if (s.isZen !== undefined) {
            const currentlyZen = document.body.classList.contains('zen-mode');
            if (s.isZen !== currentlyZen) toggleZen();
        }
        if (s.isTypewriter !== undefined && s.isTypewriter !== isTypewriter) {
            toggleTypewriter();
        }
        if (s.showLineNumbers !== undefined && s.showLineNumbers !== showLineNumbers) {
            toggleLineNumbers();
        }
    }
}

// ─── Markdown Preview (WASM-accelerated) ────────────────────────────────────

function renderMarkdownPreview() {
    let rawContent = editor.value;

    // Use WASM for preprocessing (wiki-links, image URLs, link space encoding)
    rawContent = wasmPreprocessMarkdown(rawContent);

    const previewEl = document.getElementById('preview');
    const tocList = document.getElementById('toc-list');
    const tocContainer = document.getElementById('toc-container');

    // Use WASM markdown parser (pulldown-cmark - much faster than marked.js)
    previewEl.innerHTML = wasmParseMarkdown(rawContent);

    // Post-processing: syntax highlighting via highlight.js
    previewEl.querySelectorAll('pre code[class*="language-"]').forEach(block => {
        // Skip mermaid blocks - they'll be rendered by mermaid.js
        if (block.classList.contains('language-mermaid')) return;
        if (window.hljs) {
            hljs.highlightElement(block);
        }
    });

    // Wiki-link click handlers
    previewEl.querySelectorAll('.wiki-link').forEach(link => {
        link.onclick = () => {
            const targetName = link.getAttribute('data-tab-name');
            const targetTab = targetName.includes('/') ? findItemByPath(targetName) : findTabByTitle(targetName);
            if (targetTab) {
                activateTab(targetTab.id);
            } else {
                showConfirm("Tab Not Found", `Create a new note named "${targetName}"?`, () => {
                    let targetList = appState.tabs;
                    let title = targetName;
                    if (targetName.includes('/')) {
                        const parts = targetName.split(/[\/\\]/);
                        title = parts.pop();
                        const folderPath = parts.join('/');
                        const folder = findItemByPath(folderPath);
                        if (folder && folder.type === 'folder') targetList = folder.children;
                    }
                    const newId = createTab(title, "", "note", targetList);
                    activateTab(newId);
                    renderTabs();
                    performSave();
                });
            }
        };
    });

    // KaTeX math rendering
    if (window.renderMathInElement) {
        renderMathInElement(previewEl, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true }
            ],
            throwOnError: false
        });
    }

    // Mermaid rendering
    const mermaidBlocks = previewEl.querySelectorAll('code.language-mermaid');
    if (mermaidBlocks.length > 0) {
        mermaid.run({ nodes: mermaidBlocks });
    }

    // Table of Contents
    const headings = previewEl.querySelectorAll('h1, h2, h3');
    tocList.innerHTML = '';
    if (headings.length > 2) {
        tocContainer.style.display = 'block';
        headings.forEach((heading, i) => {
            const id = `heading-${i}`;
            heading.id = id;
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = `#${id}`;
            a.textContent = heading.textContent;
            a.onclick = (e) => {
                e.preventDefault();
                heading.scrollIntoView({ behavior: 'smooth' });
            };
            li.appendChild(a);
            tocList.appendChild(li);
        });
    } else {
        tocContainer.style.display = 'none';
    }
}

function togglePreview() {
    isPreviewMode = !isPreviewMode;
    const previewWrapper = document.getElementById('preview-wrapper');
    if (isPreviewMode) {
        renderMarkdownPreview();
        editor.style.display = 'none';
        previewWrapper.style.display = 'block';
        previewToggle.classList.replace('fa-eye', 'fa-pen');
        modeBadge.innerText = 'PREVIEW';
        modeBadge.classList.replace('bg-gray-800', 'bg-blue-900');
        updateTypewriterAndHighlight();
    } else {
        editor.style.display = 'block';
        previewWrapper.style.display = 'none';
        previewToggle.classList.replace('fa-pen', 'fa-eye');
        modeBadge.innerText = 'EDIT';
        modeBadge.classList.replace('bg-blue-900', 'bg-gray-800');
        editor.focus();
        updateTypewriterAndHighlight(true);
    }
    performSave();
}

previewToggle.addEventListener('click', togglePreview);

// ─── Line Numbers (WASM-accelerated) ────────────────────────────────────────
const lineNumbers = document.getElementById('line-numbers');
let showLineNumbers = false;
let lastTotalLineCount = 0;

function updateLineNumbers() {
    if (!showLineNumbers) return;
    const val = editor.value;

    // Use WASM for fast line counting
    const count = wasmCountLines(val);

    if (count === lastTotalLineCount) {
        syncGutterScroll();
        return;
    }
    lastTotalLineCount = count;

    // Use WASM to generate line number string
    lineNumbers.textContent = wasmGenerateLineNumbers(count);
    syncGutterScroll();
}

function syncGutterScroll() {
    if (showLineNumbers) {
        lineNumbers.scrollTop = editor.scrollTop;
    }
}

function toggleLineNumbers() {
    showLineNumbers = !showLineNumbers;
    lineNumbers.style.display = showLineNumbers ? 'block' : 'none';
    linesToggle.classList.toggle('btn-active', showLineNumbers);
    editor.style.whiteSpace = showLineNumbers ? 'pre' : 'pre-wrap';
    if (showLineNumbers) updateLineNumbers();
    performSave();
}

linesToggle.addEventListener('click', toggleLineNumbers);
editor.addEventListener('scroll', syncGutterScroll);

// ─── Productivity Features ──────────────────────────────────────────────────

// Zen Mode
function toggleZen() {
    document.body.classList.toggle('zen-mode');
    const isZen = document.body.classList.contains('zen-mode');
    const hint = document.querySelector('.zen-hint');

    zenToggle.classList.toggle('btn-active', isZen);
    zenToggle.className = isZen ? 'fas fa-compress btn-icon btn-active' : 'fas fa-expand btn-icon';

    if (isZen) {
        hint.classList.remove('faded');
        setTimeout(() => {
            if (document.body.classList.contains('zen-mode')) {
                hint.classList.add('faded');
            }
        }, 3000);
    } else {
        hint.classList.remove('faded');
    }
    performSave();
}
zenToggle.addEventListener('click', toggleZen);

// Typewriter Scrolling
let isTypewriter = false;
function toggleTypewriter() {
    isTypewriter = !isTypewriter;
    document.body.classList.toggle('typewriter-active', isTypewriter);
    typewriterToggle.classList.toggle('btn-active', isTypewriter);
    if (isTypewriter) {
        setTimeout(() => updateTypewriterAndHighlight(true), 50);
    }
    performSave();
}
typewriterToggle.addEventListener('click', toggleTypewriter);

// ─── Global Search (WASM-accelerated) ───────────────────────────────────────
let selectedSearchIndex = 0;
let searchFilteredMatches = [];
let currentSearchQuery = '';
let searchDebounceTimeout;

function openSearch() {
    isModalOpen = true;
    searchModal.classList.remove('hidden');
    searchInput.value = '';
    searchInput.focus();
    renderSearchResults('');
}

function closeSearch() {
    searchModal.classList.add('hidden');
    isModalOpen = false;
}

function renderSearchResults(query) {
    currentSearchQuery = query;
    searchResults.innerHTML = '';
    searchFilteredMatches = [];

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
        searchStatus.innerText = '0 results';
        return;
    }

    // Use WASM for blazing-fast search across all notes
    const stateJson = JSON.stringify(appState);
    const wasmMatches = wasmSearchAllNotes(stateJson, trimmedQuery);

    // Convert WASM results to the format expected by the UI
    wasmMatches.forEach(m => {
        searchFilteredMatches.push({
            tab: { id: m.tab_id, title: m.tab_title, content: findItemById(m.tab_id)?.content || '' },
            matchIndex: m.match_index,
            lineNum: m.line_num,
            isTitle: m.is_title,
        });
    });

    searchStatus.innerText = `${searchFilteredMatches.length}${searchFilteredMatches.length >= 500 ? '+' : ''} results`;
    selectedSearchIndex = -1;

    const fragment = document.createDocumentFragment();
    searchFilteredMatches.forEach((match, index) => {
        const div = document.createElement('div');
        div.className = 'search-item';

        const title = document.createElement('div');
        title.className = 'font-bold text-gray-200 flex items-center gap-2';

        // Use WASM highlight
        title.innerHTML = `<i class="fas fa-file-alt text-xs opacity-50"></i> ${match.isTitle ? wasmHighlightMatch(match.tab.title, trimmedQuery) : match.tab.title}`;

        const snippet = document.createElement('div');
        snippet.className = 'text-sm text-gray-500 truncate font-mono mt-1 flex items-center justify-between';

        if (match.isTitle) {
            snippet.innerHTML = '<span class="text-blue-400/50">Match in title</span>';
        } else {
            const content = match.tab.content;
            const start = Math.max(0, match.matchIndex - 40);
            const end = Math.min(content.length, match.matchIndex + trimmedQuery.length + 60);
            let prefix = start > 0 ? '...' : '';
            let suffix = end < content.length ? '...' : '';
            let text = content.substring(start, end);
            snippet.innerHTML = `<span>${prefix}${wasmHighlightMatch(text, trimmedQuery)}${suffix}</span> <span class="text-xs opacity-30 ml-4">Line ${match.lineNum}</span>`;
        }

        div.append(title, snippet);

        div.onmouseenter = () => {
            const currentItems = searchResults.querySelectorAll('.search-item');
            currentItems.forEach(i => i.classList.remove('selected'));
            div.classList.add('selected');
            selectedSearchIndex = index;
        };

        div.onclick = () => selectSearchResult(index);
        fragment.appendChild(div);
    });
    searchResults.appendChild(fragment);
}

function selectSearchResult(index) {
    const match = searchFilteredMatches[index];
    if (!match) return;

    activateTab(match.tab.id);
    closeSearch();

    if (!match.isTitle) {
        setTimeout(() => {
            editor.focus();
            editor.setSelectionRange(match.matchIndex, match.matchIndex);
            updateTypewriterAndHighlight(true);
            updateLineNumbers();
        }, 150);
    }
}

// ─── Local Search (WASM-accelerated) ────────────────────────────────────────
let selectedLocalSearchIndex = -1;
let localSearchFilteredMatches = [];

function openLocalSearch() {
    if (!appState.activeTabId) return;
    isModalOpen = true;
    localSearchModal.classList.remove('hidden');
    localSearchInput.value = '';
    localSearchInput.focus();
    renderLocalSearchResults('');
}

function closeLocalSearch() {
    localSearchModal.classList.add('hidden');
    isModalOpen = false;
}

function renderLocalSearchResults(query) {
    localSearchResults.innerHTML = '';
    localSearchFilteredMatches = [];

    const tab = findItemById(appState.activeTabId);
    if (!tab || !query.trim()) {
        localSearchStatus.innerText = '0 results';
        return;
    }

    const trimmedQuery = query.trim();
    const content = tab.content || "";

    // Use WASM for fast local search
    const wasmMatches = wasmSearchInContent(content, trimmedQuery);

    wasmMatches.forEach(m => {
        localSearchFilteredMatches.push({
            tab: tab,
            matchIndex: m.matchIndex,
            lineNum: m.lineNum,
            isTitle: false
        });
    });

    localSearchStatus.innerText = `${localSearchFilteredMatches.length} results`;
    selectedLocalSearchIndex = -1;

    const fragment = document.createDocumentFragment();
    localSearchFilteredMatches.forEach((match, index) => {
        const div = document.createElement('div');
        div.className = 'search-item';

        const title = document.createElement('div');
        title.className = 'font-bold text-gray-200 flex items-center gap-2';
        title.innerHTML = `<i class="fas fa-file-alt text-xs opacity-50"></i> Line ${match.lineNum}`;

        const snippet = document.createElement('div');
        snippet.className = 'text-sm text-gray-500 truncate font-mono mt-1';

        const start = Math.max(0, match.matchIndex - 40);
        const end = Math.min(content.length, match.matchIndex + trimmedQuery.length + 60);
        let prefix = start > 0 ? '...' : '';
        let suffix = end < content.length ? '...' : '';
        let text = content.substring(start, end);
        snippet.innerHTML = `${prefix}${wasmHighlightMatch(text, trimmedQuery)}${suffix}`;

        div.append(title, snippet);
        div.onmouseenter = () => {
            const currentItems = localSearchResults.querySelectorAll('.search-item');
            currentItems.forEach(i => i.classList.remove('selected'));
            div.classList.add('selected');
            selectedLocalSearchIndex = index;
        };
        div.onclick = () => selectLocalSearchResult(index);
        fragment.appendChild(div);
    });
    localSearchResults.appendChild(fragment);
}

function selectLocalSearchResult(index) {
    const match = localSearchFilteredMatches[index];
    if (!match) return;
    closeLocalSearch();
    setTimeout(() => {
        editor.focus();
        editor.setSelectionRange(match.matchIndex, match.matchIndex);
        updateTypewriterAndHighlight(true);
        updateLineNumbers();
    }, 150);
}

localSearchInput.addEventListener('input', (e) => renderLocalSearchResults(e.target.value));

localSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeLocalSearch(); return; }
    const items = localSearchResults.querySelectorAll('.search-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[selectedLocalSearchIndex]?.classList.remove('selected');
        selectedLocalSearchIndex = selectedLocalSearchIndex === -1 ? 0 : (selectedLocalSearchIndex + 1) % items.length;
        items[selectedLocalSearchIndex]?.classList.add('selected');
        items[selectedLocalSearchIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[selectedLocalSearchIndex]?.classList.remove('selected');
        selectedLocalSearchIndex = selectedLocalSearchIndex <= 0 ? items.length - 1 : (selectedLocalSearchIndex - 1) % items.length;
        items[selectedLocalSearchIndex]?.classList.add('selected');
        items[selectedLocalSearchIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
        e.preventDefault();
        selectLocalSearchResult(selectedLocalSearchIndex === -1 ? 0 : selectedLocalSearchIndex);
    }
});

searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimeout);
    searchDebounceTimeout = setTimeout(() => renderSearchResults(e.target.value), 80);
});
searchToggle.addEventListener('click', openSearch);

searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { closeSearch(); return; }
    const items = searchResults.querySelectorAll('.search-item');
    if (items.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        items[selectedSearchIndex]?.classList.remove('selected');
        selectedSearchIndex = selectedSearchIndex === -1 ? 0 : (selectedSearchIndex + 1) % items.length;
        items[selectedSearchIndex]?.classList.add('selected');
        items[selectedSearchIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        items[selectedSearchIndex]?.classList.remove('selected');
        selectedSearchIndex = selectedSearchIndex <= 0 ? items.length - 1 : (selectedSearchIndex - 1) % items.length;
        items[selectedSearchIndex]?.classList.add('selected');
        items[selectedSearchIndex]?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
        e.preventDefault();
        selectSearchResult(selectedSearchIndex === -1 ? 0 : selectedSearchIndex);
    }
});

// ─── Keyboard Shortcuts ─────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    const isMod = IS_MAC ? e.metaKey : e.ctrlKey;
    const primaryKey = e.key.toLowerCase();

    if (isMod && e.shiftKey && primaryKey === 'f') { e.preventDefault(); openSearch(); return; }
    if (isMod && !e.shiftKey && primaryKey === 'f') { e.preventDefault(); openLocalSearch(); return; }
    if (isMod && !e.shiftKey && !e.altKey && primaryKey === 's') { e.preventDefault(); downloadBtn.click(); return; }
    if (isMod && e.shiftKey && primaryKey === 'p') { e.preventDefault(); togglePreview(); return; }
    if (isMod && primaryKey === '/') { e.preventDefault(); infoBtn.click(); return; }
    if (isMod && e.shiftKey && primaryKey === 's') { e.preventDefault(); shareBtn.click(); return; }
    if (isMod && e.shiftKey && primaryKey === 'l') { e.preventDefault(); lockBtn.click(); return; }
    if (isMod && e.shiftKey && (e.key === 'Delete' || e.key === 'Backspace')) { e.preventDefault(); newBtn.click(); return; }
    if (isMod && e.shiftKey && primaryKey === 'd') { e.preventDefault(); themeToggle.click(); return; }
    if (isMod && e.altKey && primaryKey === 'c') { e.preventDefault(); copyBtn.click(); return; }
    if (isMod && primaryKey === 'h') { e.preventDefault(); toggleLineNumbers(); return; }
    if (e.altKey && primaryKey === 'g') { e.preventDefault(); graphBtn.click(); return; }

    if (IS_MAC) {
        if (e.metaKey && !e.shiftKey && !e.altKey && !e.ctrlKey) {
            if (primaryKey === 'e') { e.preventDefault(); toggleZen(); }
            else if (primaryKey === 'j') { e.preventDefault(); toggleTypewriter(); }
            else if (primaryKey === 'k') { e.preventDefault(); togglePanic(); }
        }
    } else {
        if (e.altKey && !e.metaKey && !e.shiftKey && !e.ctrlKey) {
            if (primaryKey === 'z') { e.preventDefault(); toggleZen(); }
            else if (primaryKey === 't') { e.preventDefault(); toggleTypewriter(); }
            else if (primaryKey === 'p') { e.preventDefault(); togglePanic(); }
        }
    }
});

// ─── Privacy & Security ─────────────────────────────────────────────────────

function togglePanic() {
    isPanicMode = !isPanicMode;
    panicOverlay.style.display = isPanicMode ? 'block' : 'none';
}
panicBtn.addEventListener('click', togglePanic);

securityBtn.addEventListener('click', () => {
    isModalOpen = true;
    autoLockInput.value = appState.autoLockMinutes || 0;
    expiryInput.value = appState.expiryDate || "";
    securityModal.classList.remove('hidden');
});

securitySave.addEventListener('click', () => {
    appState.autoLockMinutes = parseInt(autoLockInput.value) || 0;
    appState.expiryDate = expiryInput.value || null;
    securityModal.classList.add('hidden');
    isModalOpen = false;
    performSave();
});

securityCancel.addEventListener('click', () => {
    securityModal.classList.add('hidden');
    isModalOpen = false;
});

infoBtn.addEventListener('click', () => {
    infoModal.classList.remove('hidden');
    isModalOpen = true;
});

const closeInfo = () => {
    infoModal.classList.add('hidden');
    isModalOpen = false;
};

infoClose.addEventListener('click', closeInfo);
infoCloseBtn.addEventListener('click', closeInfo);

// ─── Typewriter & Line Highlight ────────────────────────────────────────────

function updateTypewriterAndHighlight(forceCenter = false) {
    if (isPreviewMode || (!isTypewriter && forceCenter !== true)) {
        if (lineHighlight) lineHighlight.style.display = 'none';
        document.body.classList.remove('typewriter-active');
        return;
    }

    const caretPos = editor.selectionStart;
    const val = editor.value;

    // Use WASM for fast line-at-offset calculation
    const currentLineNum = wasmLineAtOffset(val, caretPos);

    const lineHeight = 30;
    const paddingTop = 40;

    if (lineHighlight) {
        lineHighlight.style.top = `${paddingTop + ((currentLineNum - 1) * lineHeight)}px`;
        lineHighlight.style.height = `${lineHeight}px`;
        lineHighlight.style.display = 'block';
        lineHighlight.style.transform = `translateY(-${editor.scrollTop}px)`;

        if (forceCenter === true) {
            document.body.classList.add('typewriter-active');
        }
    }

    if (isTypewriter || forceCenter === true) {
        const targetScroll = (currentLineNum - 1) * lineHeight + paddingTop - (editor.clientHeight / 2) + (lineHeight / 2);
        if (Math.abs(editor.scrollTop - targetScroll) > 1 || forceCenter) {
            editor.scrollTop = targetScroll;
        }
        syncGutterScroll();
    }
}

// ─── Wiki Suggestion ────────────────────────────────────────────────────────
let selectedSuggestionIndex = 0;
let wikiDebounce;

function updateWikiSuggestions() {
    const cursor = editor.selectionStart;
    const text = editor.value.substring(0, cursor);
    const match = text.match(/\[\[([^\]]*)$/);

    if (match) {
        clearTimeout(wikiDebounce);
        wikiDebounce = setTimeout(() => {
            const query = match[1].toLowerCase();
            const allNotes = [];
            function gatherNotes(items) {
                items.forEach(i => {
                    if (i.type === 'note') allNotes.push(i);
                    else if (i.children) gatherNotes(i.children);
                });
            }
            gatherNotes(appState.tabs);

            const filtered = allNotes.filter(n => n.title.toLowerCase().includes(query));

            if (filtered.length > 0) {
                wikiSuggestion.innerHTML = '';
                selectedSuggestionIndex = 0;

                filtered.forEach((note, index) => {
                    const fullPath = getItemPath(note);
                    const item = document.createElement('div');
                    item.className = `suggestion-item ${index === 0 ? 'selected' : ''}`;
                    item.innerHTML = `<i class="fas fa-file-alt"></i> ${fullPath}`;
                    item.onclick = () => insertWikiLink(fullPath);
                    wikiSuggestion.appendChild(item);
                });

                const { top, left } = getCaretCoordinates(editor, cursor);
                wikiSuggestion.style.display = 'block';
                wikiSuggestion.style.top = `${top + 30}px`;
                wikiSuggestion.style.left = `${left}px`;
            } else {
                wikiSuggestion.style.display = 'none';
            }
        }, 50);
    } else {
        wikiSuggestion.style.display = 'none';
    }
}

function insertWikiLink(title) {
    const cursor = editor.selectionStart;
    const text = editor.value;
    const before = text.substring(0, cursor).replace(/\[\[[^\[]*$/, '');
    const after = text.substring(cursor);
    editor.value = before + '[[' + title + ']]' + after;
    wikiSuggestion.style.display = 'none';
    editor.focus();
    updateCurrentTabState();
    performSave();
}

function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    for (const prop of style) {
        if (prop !== 'height') div.style[prop] = style[prop];
    }
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = element.clientWidth + 'px';
    div.style.height = 'auto';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const { offsetTop: top, offsetLeft: left } = span;
    document.body.removeChild(div);
    return { top, left };
}

let heavyUpdateTimeout;
function handleEditorInput() {
    updateCurrentTabState();
    updateTypewriterAndHighlight();

    clearTimeout(heavyUpdateTimeout);
    heavyUpdateTimeout = setTimeout(() => {
        updateLineNumbers();
        updateCounts();
        updateWikiSuggestions();
        performSave();
    }, 100);
}

editor.addEventListener('input', handleEditorInput);
editor.addEventListener('keyup', (e) => {
    if (e.key.startsWith('Arrow')) updateTypewriterAndHighlight();
});
editor.addEventListener('click', () => updateTypewriterAndHighlight());

editor.addEventListener('keydown', (e) => {
    if (wikiSuggestion.style.display === 'block') {
        const items = wikiSuggestion.querySelectorAll('.suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            items[selectedSuggestionIndex]?.classList.remove('selected');
            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
            items[selectedSuggestionIndex]?.classList.add('selected');
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            items[selectedSuggestionIndex]?.classList.remove('selected');
            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
            items[selectedSuggestionIndex]?.classList.add('selected');
        } else if (e.key === 'Enter' || e.key === 'Tab') {
            if (items.length > 0) {
                e.preventDefault();
                const selected = items[selectedSuggestionIndex];
                if (selected) {
                    insertWikiLink(selected.textContent.trim());
                }
            }
        } else if (e.key === 'Escape') {
            wikiSuggestion.style.display = 'none';
        }
    }
});

// ─── Graph View ─────────────────────────────────────────────────────────────
function renderGraphView() {
    graphContainer.innerHTML = '';
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight;

    const nodes = [];
    const links = [];

    function gatherGraphData(items) {
        items.forEach(item => {
            if (item.type === 'note') {
                const fullPath = getItemPath(item);
                nodes.push({ id: fullPath, title: item.title, path: fullPath });
                const linkMatches = item.content.matchAll(/\[\[([^\]]+)\]\]/g);
                for (const match of linkMatches) {
                    const targetName = match[1].trim();
                    const targetTab = targetName.includes('/') ? findItemByPath(targetName) : findTabByTitle(targetName);
                    if (targetTab) {
                        links.push({ source: fullPath, target: getItemPath(targetTab) });
                    }
                }
            } else if (item.children) {
                gatherGraphData(item.children);
            }
        });
    }
    gatherGraphData(appState.tabs);

    const svg = d3.select("#graphContainer")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [0, 0, width, height]);

    const g = svg.append("g");

    svg.call(d3.zoom().on("zoom", (event) => {
        g.attr("transform", event.transform);
    }));

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(100))
        .force("charge", d3.forceManyBody().strength(-300))
        .force("center", d3.forceCenter(width / 2, height / 2));

    const link = g.append("g")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line");

    const node = g.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .call(d3.drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended));

    node.append("circle")
        .attr("r", 8)
        .attr("fill", d => d.id === (getItemPath(findItemById(appState.activeTabId))) ? "#3b82f6" : "#666");

    node.append("text")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(d => d.title);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node
            .attr("transform", d => `translate(${d.x},${d.y})`);
    });

    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }

    node.on("click", (event, d) => {
        const tab = findItemByPath(d.id);
        if (tab) {
            activateTab(tab.id);
            graphModal.classList.add('hidden');
            isModalOpen = false;
        }
    });
}

graphBtn.onclick = () => {
    graphModal.classList.remove('hidden');
    isModalOpen = true;
    renderGraphView();
};

graphClose.onclick = () => {
    graphModal.classList.add('hidden');
    isModalOpen = false;
};

editor.addEventListener('scroll', () => {
    if (lineHighlight) {
        lineHighlight.style.transform = `translateY(-${editor.scrollTop}px)`;
    }
});

// ─── Inactivity Timer ───────────────────────────────────────────────────────
function resetActivity() { lastActivity = Date.now(); }
window.addEventListener('mousemove', resetActivity);
window.addEventListener('keydown', resetActivity);
window.addEventListener('mousedown', resetActivity);

setInterval(() => {
    if (appState.autoLockMinutes > 0 && !isModalOpen) {
        const elapsed = (Date.now() - lastActivity) / 1000 / 60;
        if (elapsed >= appState.autoLockMinutes) {
            location.reload();
        }
    }
}, 10000);

function checkExpiry() {
    if (appState.expiryDate) {
        const expiry = new Date(appState.expiryDate).getTime();
        if (Date.now() > expiry) {
            document.body.innerHTML = `
                <div class="flex items-center justify-center h-screen bg-black text-white p-10 text-center">
                    <div>
                        <h1 class="text-4xl font-bold mb-4">Note Expired</h1>
                        <p class="text-gray-400">This secure notebook has self-destructed based on its preset expiry date.</p>
                        <button onclick="location.hash=''; location.reload();" class="mt-8 px-6 py-2 bg-blue-600 rounded">Start New Notebook</button>
                    </div>
                </div>
            `;
        }
    }
}

// ─── Word Count (WASM-accelerated) ──────────────────────────────────────────

function updateCounts() {
    const text = editor.value;
    const words = wasmCountWords(text);
    wordCountDisplay.innerText = `${words} WORDS`;
}

// ─── Modal Handling ─────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
    if (isModalOpen) {
        if (!passwordModal.classList.contains('hidden')) {
            if (document.activeElement !== passwordInput) passwordInput.focus();
            if (e.key === 'Enter') modalSubmit.click();
        }
        else if (!renameModal.classList.contains('hidden')) {
            if (document.activeElement !== renameInput) renameInput.focus();
        }

        if (e.key === 'Escape') {
            if (!infoModal.classList.contains('hidden')) closeInfo();
            if (!securityModal.classList.contains('hidden')) securityCancel.click();
            if (!passwordModal.classList.contains('hidden')) modalCancel.click();
            if (!renameModal.classList.contains('hidden')) closeRenameModal();
        }
    } else {
        if (e.key === 'Escape' && document.body.classList.contains('zen-mode')) {
            toggleZen();
        }
    }
});

// ─── Tab/Folder Creation ────────────────────────────────────────────────────
addTabBtn.addEventListener('click', () => {
    const id = createTab();
    activateTab(id);
    renderTabs();
    performSave();
    renameTab(id);
});

addFolderBtn.addEventListener('click', () => {
    const id = createTab("New Folder", "", "folder");
    renderTabs();
    performSave();
    renameTab(id);
});

// ─── Controls ───────────────────────────────────────────────────────────────
newBtn.addEventListener('click', () => {
    showConfirm("Start Fresh?", "This will clear all tabs and reset the notebook.", () => {
        appState = { tabs: [], activeTabId: null };
        window.appState = appState;
        encryptionKey = null;
        lockBtn.classList.replace('fa-lock', 'fa-unlock');
        encryptionBadge.classList.add('hidden');
        window.location.hash = '';
        loadFromContent("");
    });
});

lockBtn.addEventListener('click', () => {
    if (encryptionKey) {
        showConfirm("Remove Encryption?", "This will make your URL readable by anyone with the link.", () => {
            encryptionKey = null;
            lockBtn.classList.replace('fa-lock', 'fa-unlock');
            encryptionBadge.classList.add('hidden');
            performSave();
        });
    } else {
        showModal("Encrypt Notebook", "Secure all tabs with a password URL.", (pass) => {
            if (pass) {
                encryptionKey = pass;
                lockBtn.classList.replace('fa-unlock', 'fa-lock');
                encryptionBadge.classList.remove('hidden');
                passwordModal.classList.add('hidden');
                isModalOpen = false;
                performSave();
            }
        });
    }
});

shareBtn.addEventListener('click', async () => {
    updateCurrentTabState();
    const dataToSave = JSON.stringify(appState);
    const hash = encryptionKey ? 'enc_' + await encryptText(dataToSave, encryptionKey) : await encodeToUrl(dataToSave);
    const fullUrl = window.location.href.split('#')[0] + '#' + hash;
    shareLinkArea.value = fullUrl;
    shareModal.classList.remove('hidden');
    isModalOpen = true;
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(editor.value);
    copyBtn.classList.replace('fa-copy', 'fa-check');
    setTimeout(() => copyBtn.classList.replace('fa-check', 'fa-copy'), 1500);
});

themeToggle.addEventListener('click', () => {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    themeToggle.classList.toggle('fa-sun', next === 'dark');
    themeToggle.classList.toggle('fa-moon', next === 'light');
    localStorage.setItem('minimal_editor_theme', next);
});

clearBtn.addEventListener('click', () => {
    showConfirm("Clear Text?", "This will delete all text in the current tab.", () => {
        editor.value = '';
        updateCounts();
        performSave();
    });
});

downloadBtn.addEventListener('click', async () => {
    try {
        updateCurrentTabState();
        const dataToSave = JSON.stringify(appState);
        const hash = encryptionKey ? 'enc_' + await encryptText(dataToSave, encryptionKey) : await encodeToUrl(dataToSave);
        const fullUrl = APP_BASE_URL + '#' + hash;

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
        zip.file("Open Notebook.html", htmlContent);
        const blob = await zip.generateAsync({ type: "blob" });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = "notebook_backup.zip";
        a.click();
    } catch (e) {
        console.error("Export failed:", e);
        alert("Failed to export notebook.");
    }
});

function showModal(title, desc, callback) {
    isModalOpen = true;
    modalTitle.innerText = title;
    modalDesc.innerText = desc;
    passwordInput.value = '';
    passwordInput.classList.remove('border-red-500');
    passwordError.classList.add('opacity-0');
    passwordModal.classList.remove('hidden');
    passwordInput.focus();

    modalSubmit.onclick = () => { callback(passwordInput.value); };
    modalCancel.onclick = () => { passwordModal.classList.add('hidden'); isModalOpen = false; };
}

shareClose.addEventListener('click', () => { shareModal.classList.add('hidden'); isModalOpen = false; });

shareCopy.addEventListener('click', () => {
    shareLinkArea.select();
    document.execCommand('copy');
    shareCopy.innerText = "Copied!";
    setTimeout(() => shareCopy.innerText = "Copy Link", 2000);
});

// ─── Sidebar Toggle ─────────────────────────────────────────────────────────
const sidebarToggle = document.getElementById('sidebarToggle');
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    const isCollapsed = sidebar.classList.contains('collapsed');
    if (isCollapsed) {
        sidebar.style.width = '';
    } else {
        sidebar.style.width = `${sidebarWidth}px`;
    }
    sidebarToggle.title = isCollapsed ? "Expand Sidebar" : "Collapse Sidebar";
});

// ─── Tab Key Handling ───────────────────────────────────────────────────────
editor.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = editor.selectionStart;
        editor.value = editor.value.substring(0, start) + "  " + editor.value.substring(editor.selectionEnd);
        editor.selectionStart = editor.selectionEnd = start + 2;
        updateCurrentTabState();
        performSave();
    }
});

// ─── Shortcut Labels ────────────────────────────────────────────────────────
function updateShortcutLabels() {
    const zenMod = IS_MAC ? '⌘E' : 'Alt+Z';
    const typewriterMod = IS_MAC ? '⌘J' : 'Alt+T';
    const panicMod = IS_MAC ? '⌘K' : 'Alt+P';
    const searchLabel = IS_MAC ? '⌘⇧F' : 'Ctrl+Shift+F';
    const localSearchLabel = IS_MAC ? '⌘F' : 'Ctrl+F';
    const newMod = IS_MAC ? '⌘⇧⌫' : 'Ctrl+Shift+Del';
    const previewMod = IS_MAC ? '⌘⇧P' : 'Ctrl+Shift+P';
    const lockMod = IS_MAC ? '⌘⇧L' : 'Ctrl+Shift+L';
    const shareMod = IS_MAC ? '⌘⇧S' : 'Ctrl+Shift+S';
    const infoMod = IS_MAC ? '⌘/' : 'Ctrl+/';
    const themeMod = IS_MAC ? '⌘⇧D' : 'Ctrl+Shift+D';
    const clearMod = IS_MAC ? '⌘⇧⌫' : 'Ctrl+Shift+BS';
    const copyMod = IS_MAC ? '⌘⌥C' : 'Ctrl+Alt+C';
    const saveMod = IS_MAC ? '⌘S' : 'Ctrl+S';
    const graphMod = IS_MAC ? '⌥G' : 'Alt+G';
    const linesMod = IS_MAC ? '⌘H' : 'Ctrl+H';

    document.getElementById('panicBtn').setAttribute('data-title', `Panic Button (${panicMod})`);
    document.getElementById('zenToggle').setAttribute('data-title', `Zen Mode (${zenMod})`);
    document.getElementById('typewriterToggle').setAttribute('data-title', `Typewriter Scrolling (${typewriterMod})`);
    document.getElementById('searchToggle').setAttribute('data-title', `Global Search (${searchLabel})`);
    document.getElementById('newBtn').setAttribute('data-title', `Start from Scratch (${newMod})`);
    document.getElementById('previewToggle').setAttribute('data-title', `Toggle Preview (${previewMod})`);
    document.getElementById('lockBtn').setAttribute('data-title', `Encryption (${lockMod})`);
    document.getElementById('shareBtn').setAttribute('data-title', `Share Link (${shareMod})`);
    document.getElementById('infoBtn').setAttribute('data-title', `Shortcuts & Info (${infoMod})`);
    document.getElementById('themeToggle').setAttribute('data-title', `Toggle Theme (${themeMod})`);
    document.getElementById('clearBtn').setAttribute('data-title', `Clear Editor (${clearMod})`);
    document.getElementById('copyBtn').setAttribute('data-title', `Copy All (${copyMod})`);
    document.getElementById('downloadBtn').setAttribute('data-title', `Download Markdown (${saveMod})`);
    document.getElementById('graphBtn').setAttribute('data-title', `Graph View (${graphMod})`);
    document.getElementById('linesToggle').setAttribute('data-title', `Line Numbers (${linesMod})`);

    const kbdMap = {
        'kbd-search': searchLabel, 'kbd-local-search': localSearchLabel,
        'kbd-zen': zenMod, 'kbd-typewriter': typewriterMod, 'kbd-panic': panicMod,
        'kbd-preview': previewMod, 'kbd-graph': graphMod, 'kbd-info': infoMod,
        'kbd-save': saveMod, 'kbd-share': shareMod, 'kbd-lock': lockMod,
        'kbd-theme': themeMod, 'kbd-copy': copyMod, 'kbd-new': newMod, 'kbd-lines': linesMod,
    };
    for (const [id, val] of Object.entries(kbdMap)) {
        const el = document.getElementById(id);
        if (el) el.innerText = val;
    }

    const panicExitMsg = panicOverlay.querySelector('p.mt-8.text-xs');
    if (panicExitMsg) panicExitMsg.innerText = `Press ${panicMod} to exit workspace`;
}

// ─── Tutorial ───────────────────────────────────────────────────────────────
function startTutorial() {
    const infoModal = document.getElementById('infoModal');
    const securityModal = document.getElementById('securityModal');
    const searchModal = document.getElementById('searchModal');
    const graphModal = document.getElementById('graphModal');

    if (infoModal) infoModal.classList.add('hidden');
    if (securityModal) securityModal.classList.add('hidden');
    if (searchModal) searchModal.classList.add('hidden');
    if (graphModal) graphModal.classList.add('hidden');
    isModalOpen = false;

    if (typeof window.driver === 'undefined' || !window.driver.js) {
        console.error('Driver.js not loaded');
        return;
    }

    const driver = window.driver.js.driver;
    const driverObj = driver({
        showProgress: true,
        animate: true,
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        steps: [
            { element: 'header', popover: { title: 'Welcome to EZ Text Editor', description: 'A secure, private Markdown editor where 100% of your data stays in your browser and URL.', side: "bottom", align: 'start' } },
            { element: '#sidebar', popover: { title: 'Note Sidebar', description: 'Manage your notes and folders here. All changes are saved instantly to the URL.', side: "right", align: 'start' } },
            { element: '#newBtn', popover: { title: 'Create New Note', description: 'Click here to start a fresh note or use the "+" button in the sidebar.', side: "bottom", align: 'center' } },
            { element: '#editor', popover: { title: 'The Editor', description: 'Write your Markdown here. We support GFM, LaTeX, Mermaid diagrams, and Wiki links [[like this]].', side: "bottom", align: 'center' } },
            { element: '#previewToggle', popover: { title: 'Live Preview', description: 'Toggle between the editor and a beautiful live preview of your Markdown.', side: "bottom", align: 'center' } },
            { element: '#securityBtn', popover: { title: 'Security Settings', description: 'Configure auto-lock and other security preferences to keep your notes private.', side: "bottom", align: 'center' } },
            { element: '#lockBtn', popover: { title: 'Encryption', description: 'Enable symmetric password encryption for your notes. This happens 100% locally.', side: "bottom", align: 'center' } },
            { element: '#shareBtn', popover: { title: 'Share & Sync', description: 'Since all data is in the URL, sharing this link shares the entire state of your editor!', side: "bottom", align: 'center' } },
            { element: '#infoBtn', popover: { title: 'Shortcuts & Help', description: 'You can always come back to this tutorial and see all keyboard shortcuts here.', side: "bottom", align: 'center' } },
        ]
    });
    driverObj.drive();
}

if (startTutorialBtn) {
    startTutorialBtn.addEventListener('click', startTutorial);
}

function initTutorial() {
    const hasSeenTutorial = localStorage.getItem('ez_has_seen_tutorial');
    if (!hasSeenTutorial) {
        setTimeout(() => {
            if (!isModalOpen) {
                startTutorial();
                localStorage.setItem('ez_has_seen_tutorial', 'true');
            }
        }, 1500);
    }
}

// ─── Initialization (WASM + App) ────────────────────────────────────────────

async function init() {
    // Initialize WASM module first
    await initWasm();

    // Configure marked.js as fallback (still used for edge cases)
    if (window.marked) {
        marked.setOptions({
            highlight: function (code, lang) {
                if (lang && hljs.getLanguage(lang)) {
                    return hljs.highlight(code, { language: lang }).value;
                }
                return hljs.highlightAuto(code).value;
            },
            breaks: true,
            gfm: true,
            mangle: false,
            headerIds: true
        });
    }

    // Mermaid Init
    if (window.mermaid) {
        mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });
    }

    const hash = window.location.hash.substring(1);

    if (hash.startsWith('enc_')) {
        const encryptedData = hash.substring(4);

        const handleInitialDecryption = async (pass) => {
            const decrypted = await decryptText(encryptedData, pass);
            if (decrypted !== null) {
                encryptionKey = pass;
                loadFromContent(decrypted);
                lockBtn.classList.replace('fa-unlock', 'fa-lock');
                encryptionBadge.classList.remove('hidden');
                passwordModal.classList.add('hidden');
                isModalOpen = false;
                updateCounts();
            } else {
                passwordInput.classList.add('border-red-500');
                passwordError.classList.remove('opacity-0');
                modalContainer.classList.add('shake');
                setTimeout(() => modalContainer.classList.remove('shake'), 400);
                passwordInput.value = '';
                passwordInput.focus();
            }
        };

        showModal("Decrypt Notebook", "This notebook is encrypted. Enter password to view tabs.", handleInitialDecryption);
    } else if (hash) {
        const decoded = await decodeFromUrl(hash);
        if (decoded !== null) {
            loadFromContent(decoded);
        } else {
            loadFromContent("");
        }
    } else {
        loadFromContent("");
    }

    if (localStorage.getItem('minimal_editor_theme') === 'light') {
        document.body.setAttribute('data-theme', 'light');
        themeToggle.classList.replace('fa-sun', 'fa-moon');
    }

    if (!isModalOpen) editor.focus();

    updateShortcutLabels();
    checkExpiry();
    initTutorial();
}

// Expose functions for tests
window.findItemById = findItemById;
window.findParent = findParent;
window.findItemByPath = findItemByPath;
window.findTabByTitle = findTabByTitle;
window.removeItemById = removeItemById;
window.isDescendant = isDescendant;
window.moveItem = moveItem;
window.activateTab = activateTab;
window.toggleZen = toggleZen;
window.togglePreview = togglePreview;
window.toggleTypewriter = toggleTypewriter;
window.encodeToUrl = encodeToUrl;
window.decodeFromUrl = decodeFromUrl;
window.loadFromContent = loadFromContent;
window.renderTabs = renderTabs;
window.performSave = performSave;
window.deriveKey = deriveKey;
window.insertAfter = insertAfter;
window.generateId = generateId;

// Boot the app
init();
