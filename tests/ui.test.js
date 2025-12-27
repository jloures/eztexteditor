describe('User Interface & Interactions', () => {
    beforeEach(() => {
        global.appState.tabs = [
            { id: 'n1', title: 'Note 1', content: 'Apple banana cherry', type: 'note' },
            {
                id: 'f1', title: 'My Folder', type: 'folder', children: [
                    { id: 'n3', title: 'Nested', content: 'Goat', type: 'note' }
                ]
            }
        ];
        global.appState.activeTabId = 'n1';
        global.renderTabs();
        jest.clearAllMocks();
    });

    test('renderSearchResults filters correctly', () => {
        global.renderSearchResults('Apple');
        expect(global.searchFilteredTabs.length).toBe(1);
        expect(global.searchFilteredTabs[0].title).toBe('Note 1');
    });

    test('Renaming a tab via modal updates State and UI', () => {
        global.openRenameModal('n1');
        const input = document.getElementById('renameInput');
        input.value = 'New Name';
        document.getElementById('renameSubmit').click();

        expect(global.findItemById('n1').title).toBe('New Name');
        // Use textContent for JSDOM
        expect(document.getElementById('tabBar').textContent).toContain('New Name');
    });

    test('Theme toggle updates data-theme attribute', () => {
        document.body.setAttribute('data-theme', 'dark');
        document.getElementById('themeToggle').click();
        expect(document.body.getAttribute('data-theme')).toBe('light');
    });

    test('Panic mode toggle display', () => {
        const overlay = document.getElementById('panicOverlay');
        const initial = overlay.style.display;
        global.togglePanic();
        expect(overlay.style.display).not.toBe(initial);
    });

    test('Deleting a note handles empty state correctly', () => {
        global.showConfirm = jest.fn((t, d, cb) => cb());
        global.appState.tabs = [{ id: '1', title: 'T', type: 'note' }];
        global.appState.activeTabId = '1';
        const event = { stopPropagation: jest.fn() };
        global.closeTab(event, '1');

        expect(global.appState.tabs.length).toBe(1);
        expect(global.appState.tabs[0].title).toBe('Untitled');
    });

    test.each(Array.from({ length: 10 }, (_, i) => i))('Parameterized UI Test %i: renderTabs is idempotent', (i) => {
        const initialCount = document.querySelectorAll('.tab').length;
        global.renderTabs();
        expect(document.querySelectorAll('.tab').length).toBe(initialCount);
    });
});
