describe('eztexteditor Functionality', () => {

    describe('ID Generation', () => {
        test('generateId returns a string', () => {
            const id = global.generateId();
            expect(typeof id).toBe('string');
        });

        test('generateId returns unique IDs', () => {
            const id1 = global.generateId();
            const id2 = global.generateId();
            expect(id1).not.toBe(id2);
        });

        test('generateId returns IDs of reasonable length', () => {
            const id = global.generateId();
            expect(id.length).toBeGreaterThan(5);
        });
    });

    describe('Tab Management', () => {
        beforeEach(() => {
            global.appState.tabs = [];
            global.appState.activeTabId = null;
        });

        test('createTab adds a tab to appState', () => {
            const initialCount = global.appState.tabs.length;
            global.createTab('Test Title', 'Test Content');
            expect(global.appState.tabs.length).toBe(initialCount + 1);
            expect(global.appState.tabs[0].title).toBe('Test Title');
            expect(global.appState.tabs[0].content).toBe('Test Content');
        });

        test('createTab returns a valid ID', () => {
            const id = global.createTab();
            expect(global.appState.tabs.find(t => t.id === id)).toBeDefined();
        });

        test('createTab handles folder type', () => {
            const id = global.createTab('My Folder', '', 'folder');
            const folder = global.appState.tabs.find(t => t.id === id);
            expect(folder.type).toBe('folder');
            expect(Array.isArray(folder.children)).toBe(true);
        });

        test('activateTab sets the active tab ID', () => {
            const id = global.createTab('Active Tab');
            global.activateTab(id);
            expect(global.appState.activeTabId).toBe(id);
        });

        test('activateTab updates editor content', () => {
            const content = '# Hello World';
            const id = global.createTab('Content Tab', content);
            global.activateTab(id);
            expect(document.getElementById('editor').value).toBe(content);
        });

        test('findItemById finds item in root', () => {
            const id = global.createTab('Root Item');
            const found = global.findItemById(id);
            expect(found).toBeDefined();
            expect(found.title).toBe('Root Item');
        });

        test('findItemById finds item nested in folder', () => {
            const folderId = global.createTab('Folder', '', 'folder');
            const folder = global.findItemById(folderId);
            const noteId = global.generateId();
            folder.children.push({ id: noteId, title: 'Nested Note', type: 'note' });

            const found = global.findItemById(noteId);
            expect(found).toBeDefined();
            expect(found.title).toBe('Nested Note');
        });

        test('removeItemById removes item from root', () => {
            const id = global.createTab('To Remove');
            const removed = global.removeItemById(id);
            expect(removed.title).toBe('To Remove');
            expect(global.appState.tabs.length).toBe(0);
        });

        test('removeItemById removes item from folder', () => {
            const folderId = global.createTab('Folder', '', 'folder');
            const folder = global.findItemById(folderId);
            const noteId = global.generateId();
            folder.children.push({ id: noteId, title: 'To Remove', type: 'note' });

            const removed = global.removeItemById(noteId);
            expect(removed.title).toBe('To Remove');
            expect(folder.children.length).toBe(0);
        });
    });

    describe('State Sync', () => {
        test('updateCurrentTabState syncs editor content to active tab', () => {
            const id = global.createTab('Sync Tab', 'Initial');
            global.activateTab(id);
            document.getElementById('editor').value = 'Updated Content';
            global.updateCurrentTabState();

            const tab = global.findItemById(id);
            expect(tab.content).toBe('Updated Content');
        });
    });

    describe('URL Encoding/Decoding', () => {
        test('encodeToUrl and decodeFromUrl are inverses', async () => {
            const original = 'Hello World! @#$%^&*()';
            const encoded = await global.encodeToUrl(original);
            const decoded = await global.decodeFromUrl(encoded);
            expect(decoded).toBe(original);
        });

        test('encodeToUrl handles JSON state', async () => {
            const state = { tabs: [{ id: '1', title: 'Test' }] };
            const json = JSON.stringify(state);
            const encoded = await global.encodeToUrl(json);
            const decoded = await global.decodeFromUrl(encoded);
            expect(JSON.parse(decoded)).toEqual(state);
        });
    });

    describe('Content Loading', () => {
        test('loadFromContent handles valid JSON state', () => {
            const state = {
                tabs: [{ id: 'test-id', title: 'Imported', content: 'Content', type: 'note' }],
                activeTabId: 'test-id'
            };
            global.loadFromContent(JSON.stringify(state));
            expect(global.appState.tabs.length).toBe(1);
            expect(global.appState.tabs[0].title).toBe('Imported');
            expect(global.appState.activeTabId).toBe('test-id');
        });

        test('loadFromContent handles plain text as new tab', () => {
            const plainText = 'Just some text';
            global.loadFromContent(plainText);
            expect(global.appState.tabs.length).toBe(1);
            expect(global.appState.tabs[0].content).toBe(plainText);
        });

        test('loadFromContent ensures at least one tab if empty', () => {
            global.loadFromContent('[]'); // Invalid/empty state
            expect(global.appState.tabs.length).toBeGreaterThan(0);
        });
    });

    describe('UI Toggles', () => {
        test('toggleZen toggles zen-mode class on body', () => {
            const body = document.body;
            const initial = body.classList.contains('zen-mode');
            global.toggleZen();
            expect(body.classList.contains('zen-mode')).toBe(!initial);
        });

        test('togglePreview changes isPreviewMode', () => {
            const initial = global.isPreviewMode;
            global.togglePreview();
            expect(global.isPreviewMode).toBe(!initial);
        });

        test('toggleTypewriter changes isTypewriter variable', () => {
            const initial = global.isTypewriter;
            global.toggleTypewriter();
            expect(global.isTypewriter).toBe(!initial);
        });
    });

    describe('Movement', () => {
        test('moveItem moves note into folder', () => {
            const folderId = global.createTab('Folder', '', 'folder');
            const noteId = global.createTab('Note');
            global.moveItem(noteId, folderId, true);

            const folder = global.findItemById(folderId);
            expect(folder.children.find(n => n.id === noteId)).toBeDefined();
            expect(global.appState.tabs.find(n => n.id === noteId)).toBeUndefined();
        });
    });
});
