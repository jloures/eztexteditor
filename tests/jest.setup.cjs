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

// Mock IndexedDB for browser storage tests
const mockStore = {};
const mockIDB = {
    open: jest.fn().mockImplementation(() => {
        const request = {
            result: {
                objectStoreNames: { contains: () => true },
                createObjectStore: jest.fn(),
                transaction: jest.fn().mockReturnValue({
                    objectStore: jest.fn().mockReturnValue({
                        put: jest.fn(),
                        get: jest.fn().mockReturnValue({ onsuccess: null, onerror: null, result: null }),
                        getAll: jest.fn().mockReturnValue({ onsuccess: null, onerror: null, result: [] }),
                        delete: jest.fn(),
                    }),
                    oncomplete: null,
                    onerror: null,
                }),
            },
            onupgradeneeded: null,
            onsuccess: null,
            onerror: null,
        };
        setTimeout(() => { if (request.onsuccess) request.onsuccess(); }, 0);
        return request;
    }),
};
global.indexedDB = mockIDB;

// Mock JSZip for file import
global.JSZip = {
    loadAsync: jest.fn().mockResolvedValue({
        file: jest.fn().mockReturnValue(null),
    }),
};

// Mocking external libraries (these are now ES module imports, stripped in test setup)
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
global.katex = {};
global.renderMathInElement = jest.fn();
global.d3 = {
    select: jest.fn(() => ({
        selectAll: jest.fn().mockReturnThis(),
        remove: jest.fn().mockReturnThis(),
        append: jest.fn().mockReturnThis(),
        attr: jest.fn().mockReturnThis(),
        call: jest.fn().mockReturnThis(),
    })),
    zoom: jest.fn(() => ({ on: jest.fn().mockReturnThis() })),
    forceSimulation: jest.fn(() => ({
        force: jest.fn().mockReturnThis(),
        on: jest.fn().mockReturnThis(),
    })),
    forceLink: jest.fn(() => ({ id: jest.fn().mockReturnThis(), distance: jest.fn().mockReturnThis() })),
    forceManyBody: jest.fn(() => ({ strength: jest.fn().mockReturnThis() })),
    forceCenter: jest.fn(),
    drag: jest.fn(() => ({
        on: jest.fn().mockReturnThis(),
    })),
};
global.driver = jest.fn(() => ({ drive: jest.fn() }));

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

    // Remove all ES module import lines and the init() call at the bottom
    mainCode = mainCode.replace(/^import\s+[\s\S]*?from\s+['"].*?['"];?\s*$/gm, '');
    mainCode = mainCode.replace(/^import\s+['"].*?['"];?\s*$/gm, '');

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
