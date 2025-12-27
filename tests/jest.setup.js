const fs = require('fs');
const path = require('path');
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');

// Mocking some browser APIs
global.crypto.subtle = {
    importKey: jest.fn(),
    deriveKey: jest.fn(),
    encrypt: jest.fn(),
    decrypt: jest.fn(),
};
global.crypto.getRandomValues = jest.fn().mockImplementation((arr) => arr);
global.scrollTo = jest.fn();
global.alert = jest.fn();

// Mocking external libraries
global.marked = {
    setOptions: jest.fn(),
    parse: jest.fn((text) => `<div>${text}</div>`),
};
global.mermaid = {
    initialize: jest.fn(),
    run: jest.fn(),
};
global.hljs = {
    highlight: jest.fn((code) => ({ value: code })),
    highlightAuto: jest.fn((code) => ({ value: code })),
    getLanguage: jest.fn(() => true),
};

// Mocking matchMedia
Object.defineProperty(global, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
    })),
});

beforeEach(() => {
    document.documentElement.innerHTML = html;

    // Extract scripts from HTML and execute them
    const scriptTags = document.querySelectorAll('script');
    scriptTags.forEach(script => {
        if (!script.src) {
            let code = script.textContent;

            // Use var to make it global when eval that's call on global context
            // Match even with leading whitespace
            code = code.replace(/^\s*(const|let) /gm, 'var ');

            try {
                // Indirect eval calls execute in the global scope
                (0, eval)(code);
            } catch (e) {
                // console.error('Error executing script:', e);
            }
        }
    });
});
