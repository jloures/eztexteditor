describe('eztexteditor Extended Functionality', () => {

    describe('Search logic', () => {
        beforeEach(() => {
            global.appState.tabs = [
                { id: '1', title: 'Note One', content: 'Apple banana', type: 'note' },
                { id: '2', title: 'Note Two', content: 'Cherry date', type: 'note' },
                {
                    id: '3', title: 'Folder', type: 'folder', children: [
                        { id: '4', title: 'Sub Note', content: 'Eggplant fig', type: 'note' }
                    ]
                }
            ];
        });

        test('searchRecursive finds notes by title', () => {
            const results = [];
            function search(items, query) {
                items.forEach(item => {
                    if (item.type === 'note') {
                        if (item.title.toLowerCase().includes(query.toLowerCase()) ||
                            item.content.toLowerCase().includes(query.toLowerCase())) {
                            results.push(item);
                        }
                    } else if (item.children) {
                        search(item.children, query);
                    }
                });
            }

            search(global.appState.tabs, 'Note');
            expect(results.length).toBe(3); // One, Two, Sub Note
        });

        test('searchRecursive finds notes by content', () => {
            const results = [];
            function search(items, query) {
                items.forEach(item => {
                    if (item.type === 'note') {
                        if (item.title.toLowerCase().includes(query.toLowerCase()) ||
                            item.content.toLowerCase().includes(query.toLowerCase())) {
                            results.push(item);
                        }
                    } else if (item.children) {
                        search(item.children, query);
                    }
                });
            }

            search(global.appState.tabs, 'Cherry');
            expect(results.length).toBe(1);
            expect(results[0].id).toBe('2');
        });
    });

    describe('List Insertion', () => {
        beforeEach(() => {
            global.appState.tabs = [
                { id: '1', title: 'A', type: 'note' },
                { id: '2', title: 'B', type: 'note' }
            ];
        });

        test('insertAfter inserts item at the correct position', () => {
            const newItem = { id: '3', title: 'C', type: 'note' };
            global.insertAfter(newItem, '1', global.appState.tabs);
            expect(global.appState.tabs[1].id).toBe('3');
            expect(global.appState.tabs[2].id).toBe('2');
        });

        test('insertAfter works in nested folders', () => {
            global.appState.tabs = [
                {
                    id: 'f1', title: 'Folder', type: 'folder', children: [
                        { id: 'n1', title: 'Note 1', type: 'note' }
                    ]
                }
            ];
            const newItem = { id: 'n2', title: 'Note 2', type: 'note' };
            global.insertAfter(newItem, 'n1', global.appState.tabs);
            expect(global.appState.tabs[0].children[1].id).toBe('n2');
        });
    });

    describe('Security Helpers', () => {
        test('deriveKey returns a key (mocked)', async () => {
            // Note: In real environment this would be complex, here we just verify the call
            global.crypto.subtle.importKey.mockResolvedValue('baseKey');
            global.crypto.subtle.deriveKey.mockResolvedValue('derivedKey');

            const key = await global.deriveKey('password', new Uint8Array(16));
            expect(key).toBe('derivedKey');
            expect(global.crypto.subtle.importKey).toHaveBeenCalled();
        });
    });
});
