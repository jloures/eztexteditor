describe('Collaboration Logic', () => {
    beforeEach(() => {
        global.colabState = {
            active: false,
            roomId: null,
            provider: null,
            doc: null,
            binding: null
        };
        global.appState.tabs = [{ id: 't1', title: 'Tab 1', content: 'Init', type: 'note' }];
        global.appState.activeTabId = 't1';
        jest.clearAllMocks();
    });

    test('generateRoomId returns 6-character random string', () => {
        for (let i = 0; i < 10; i++) {
            const id = global.generateRoomId();
            expect(id).toHaveLength(6);
            expect(typeof id).toBe('string');
        }
    });

    test('getSecureRoomId returns plain ID if no encryption key', async () => {
        global.encryptionKey = null;
        const id = 'abc-123';
        const secure = await global.getSecureRoomId(id);
        expect(secure).toBe(id);
    });

    test('getSecureRoomId returns hashed ID if encryption key exists', async () => {
        global.encryptionKey = 'secret-pass';
        const id = 'abc-123';
        const secure = await global.getSecureRoomId(id);
        expect(secure).not.toBe(id);
        expect(secure.startsWith('enc-')).toBe(true);
    });

    test('startCollaboration initializes Y.Doc and WebrtcProvider', async () => {
        await global.startCollaboration('room-xyz');
        expect(global.colabState.active).toBe(true);
        expect(global.Y.Doc).toHaveBeenCalled();
        expect(global.WebrtcProvider).toHaveBeenCalled();
        expect(global.colabState.rawRoomId).toBe('room-xyz');
    });

    test('stopCollaboration cleans up resources', async () => {
        await global.startCollaboration('room1');
        const providerDestroy = global.colabState.provider.destroy;
        const docDestroy = global.colabState.doc.destroy;

        global.stopCollaboration();

        expect(global.colabState.active).toBe(false);
        expect(providerDestroy).toHaveBeenCalled();
        expect(docDestroy).toHaveBeenCalled();
        expect(global.colabState.provider).toBeNull();
    });

    test('updateCollabUI updates DOM elements correctly (Active)', () => {
        global.colabState.active = true;
        global.colabState.rawRoomId = 'test-room';
        global.updateCollabUI();

        expect(document.getElementById('collabStatusText').textContent).toBe('Connected');
        expect(document.getElementById('roomNameInput').value).toBe('test-room');
    });

    test('checkCollabUrl triggers collaboration if room param exists', (done) => {
        // Safe JSDOM way
        window.history.pushState({}, '', '?room=auto-room');

        global.checkCollabUrl();

        setTimeout(() => {
            try {
                expect(global.colabState.active).toBe(true);
                expect(global.colabState.rawRoomId).toBe('auto-room');
                window.history.pushState({}, '', '/');
                done();
            } catch (error) {
                window.history.pushState({}, '', '/');
                done(error);
            }
        }, 600);
    });

    test.each(['a', '123'])('getSecureRoomId produces valid hash for input %s', async (input) => {
        global.encryptionKey = 'key';
        const secure = await global.getSecureRoomId(input);
        expect(secure).toMatch(/^enc-[a-f0-9]{12}$/);
    });
});
