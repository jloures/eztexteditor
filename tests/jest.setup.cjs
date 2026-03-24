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
    highlightElement: jest.fn(),
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

    // Since the app now uses ES modules (src/main.js importing WASM),
    // we load the main.js source directly and execute it with WASM functions mocked.
    // The module script tag in HTML won't auto-execute in jsdom.

    // First, mock the WASM functions as JS fallbacks
    const wasmMocks = `
        // WASM bridge mocks - pure JS fallbacks for testing
        function wasmParseMarkdown(input) {
            return marked.parse(input);
        }
        function wasmPreprocessMarkdown(input) {
            return input;
        }
        function wasmSearchAllNotes(stateJson, query) { return []; }
        function wasmSearchInContent(content, query) { return []; }
        function wasmCountLines(text) {
            var count = 1;
            for (var i = 0; i < text.length; i++) {
                if (text[i] === '\\n') count++;
            }
            return count;
        }
        function wasmCountWords(text) {
            var m = text.match(/\\S+/g);
            return m ? m.length : 0;
        }
        function wasmLineAtOffset(text, offset) {
            var end = Math.min(offset, text.length);
            var line = 1;
            for (var i = 0; i < end; i++) {
                if (text[i] === '\\n') line++;
            }
            return line;
        }
        function wasmGenerateLineNumbers(total) {
            var result = '';
            for (var i = 1; i <= total; i++) {
                result += i + '\\n';
            }
            return result;
        }
        function wasmBase64UrlEncode(text) {
            return null; // fallback to JS
        }
        function wasmBase64UrlDecode(encoded) {
            return null; // fallback to JS
        }
        function wasmHighlightMatch(text, query) {
            if (!query) return text;
            var escaped = query.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&');
            var regex = new RegExp('(' + escaped + ')', 'gi');
            return text.replace(regex, '<span class="search-match-highlight">$1</span>');
        }
        function initWasm() { return Promise.resolve(); }
    `;

    // Load the main.js source
    let mainCode = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');

    // Remove the ES module import line and the init() call at the bottom
    mainCode = mainCode.replace(/^import\s+\{[\s\S]*?\}\s+from\s+['"].*?['"];?\s*$/gm, '');

    // Remove the init() boot call - we'll call loadFromContent directly in tests
    mainCode = mainCode.replace(/\/\/ Boot the app\s*\n\s*init\(\);/, '');

    // Convert const/let to var for global scope
    mainCode = mainCode.replace(/^\s*(const|let) /gm, 'var ');

    try {
        (0, eval)(wasmMocks + '\n' + mainCode);
    } catch (e) {
        // Silence initialization errors (e.g., missing DOM in jsdom)
    }
});
