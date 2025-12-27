describe('State & Rendering Edge Cases', () => {
    test.each(Array.from({ length: 28 }, (_, i) => i))('Parameterized test case %i: togglePreview works consistently', (i) => {
        const initial = global.isPreviewMode;
        global.togglePreview();
        expect(global.isPreviewMode).toBe(!initial);
        global.togglePreview();
        expect(global.isPreviewMode).toBe(initial);
    });

    test('renderMarkdownPreview calls marked.parse', () => {
        const editor = document.getElementById('editor');
        editor.value = '# Hello';
        global.renderMarkdownPreview();
        expect(global.marked.parse).toHaveBeenCalledWith('# Hello');
    });

    test('renderMarkdownPreview handles empty content', () => {
        const editor = document.getElementById('editor');
        editor.value = '';
        expect(() => global.renderMarkdownPreview()).not.toThrow();
    });

    test('sidebarToggle changes collapsed class', () => {
        const sidebar = document.getElementById('sidebar');
        const btn = document.getElementById('sidebarToggle');
        const initial = sidebar.classList.contains('collapsed');
        btn.click();
        expect(sidebar.classList.contains('collapsed')).toBe(!initial);
    });

    test('generateId produces distinct IDs over 1000 iterations', () => {
        const ids = new Set();
        for (let i = 0; i < 1000; i++) {
            ids.add(global.generateId());
        }
        expect(ids.size).toBe(1000);
    });
});
