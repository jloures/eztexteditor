describe('Environment Setup', () => {
    it('should have appState defined', () => {
        expect(global.appState).toBeDefined();
    });

    it('should have createTab function defined', () => {
        expect(typeof global.createTab).toBe('function');
    });
});
