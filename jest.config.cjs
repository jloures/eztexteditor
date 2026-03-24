module.exports = {
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['./tests/jest.setup.cjs'],
    testMatch: ['**/tests/**/*.test.js'],
};
