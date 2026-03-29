document.getElementById('openBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
    window.close();
});

// List saved notebooks from IndexedDB
const DB_NAME = 'ez_text_editor';
const DB_STORE = 'notebooks';
const DB_VERSION = 1;

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(DB_STORE)) {
                db.createObjectStore(DB_STORE, { keyPath: 'name' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadSavedList() {
    try {
        const db = await openDB();
        const tx = db.transaction(DB_STORE, 'readonly');
        const request = tx.objectStore(DB_STORE).getAll();
        request.onsuccess = () => {
            const notebooks = request.result;
            const list = document.getElementById('savedList');
            if (notebooks.length === 0) {
                list.innerHTML = '<div class="empty">No saved notebooks</div>';
                return;
            }
            notebooks.sort((a, b) => b.savedAt - a.savedAt);
            list.innerHTML = '';
            for (const nb of notebooks) {
                const item = document.createElement('div');
                item.className = 'saved-item';
                item.innerHTML = `<span class="icon">&#128274;</span> ${nb.name}`;
                item.addEventListener('click', () => {
                    chrome.tabs.create({ url: chrome.runtime.getURL('index.html') });
                    window.close();
                });
                list.appendChild(item);
            }
        };
    } catch (e) {
        document.getElementById('savedList').innerHTML = '<div class="empty">No saved notebooks</div>';
    }
}

loadSavedList();
