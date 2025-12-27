describe('Navigation & Keyboard', () => {
    test('Esc key exits Zen Mode', () => {
        document.body.classList.add('zen-mode');
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
        expect(document.body.classList.contains('zen-mode')).toBe(false);
    });

    test('toggleZen updates body class and hint', () => {
        const body = document.body;
        const initial = body.classList.contains('zen-mode');
        global.toggleZen();
        expect(body.classList.contains('zen-mode')).toBe(!initial);
        global.toggleZen();
        expect(body.classList.contains('zen-mode')).toBe(initial);
    });

    test('togglePanic toggles display', () => {
        const overlay = document.getElementById('panicOverlay');
        const initial = overlay.style.display;
        global.togglePanic();
        expect(overlay.style.display).not.toBe(initial);
    });

    test('openSearch shows modal', () => {
        const searchModal = document.getElementById('searchModal');
        global.openSearch();
        expect(searchModal.classList.contains('hidden')).toBe(false);
    });

    test('Tab key inserts spaces in editor', () => {
        const editor = document.getElementById('editor');
        editor.value = 'hello';
        editor.selectionStart = editor.selectionEnd = 5;

        editor.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
        expect(editor.value).toBe('hello  ');
    });
});
