// WASM Bridge - wraps the Rust WASM module for use in the editor
import init, {
    parse_markdown,
    preprocess_markdown,
    search_all_notes,
    search_in_content,
    count_lines,
    count_words,
    line_at_offset,
    generate_line_numbers,
    base64url_encode,
    base64url_decode,
    highlight_match,
} from '../wasm-core/pkg/eztexteditor_wasm.js';

let wasmReady = false;

export async function initWasm() {
    await init();
    wasmReady = true;
}

// ─── Markdown ───────────────────────────────────────────────────────────────

export function wasmParseMarkdown(input) {
    if (!wasmReady) return '';
    return parse_markdown(input);
}

export function wasmPreprocessMarkdown(input) {
    if (!wasmReady) return input;
    return preprocess_markdown(input);
}

// ─── Search ─────────────────────────────────────────────────────────────────

export function wasmSearchAllNotes(stateJson, query) {
    if (!wasmReady) return [];
    const json = search_all_notes(stateJson, query);
    return JSON.parse(json);
}

export function wasmSearchInContent(content, query) {
    if (!wasmReady) return [];
    const json = search_in_content(content, query);
    return JSON.parse(json);
}

// ─── Counting ───────────────────────────────────────────────────────────────

export function wasmCountLines(text) {
    if (!wasmReady) return 1;
    return count_lines(text);
}

export function wasmCountWords(text) {
    if (!wasmReady) return 0;
    return count_words(text);
}

export function wasmLineAtOffset(text, offset) {
    if (!wasmReady) return 1;
    return line_at_offset(text, offset);
}

export function wasmGenerateLineNumbers(total) {
    if (!wasmReady) return '';
    return generate_line_numbers(total);
}

// ─── Base64 URL ─────────────────────────────────────────────────────────────

export function wasmBase64UrlEncode(text) {
    if (!wasmReady) return null;
    return base64url_encode(text);
}

export function wasmBase64UrlDecode(encoded) {
    if (!wasmReady) return null;
    const result = base64url_decode(encoded);
    return result !== undefined ? result : null;
}

// ─── Highlight ──────────────────────────────────────────────────────────────

export function wasmHighlightMatch(text, query) {
    if (!wasmReady) return text;
    return highlight_match(text, query);
}
