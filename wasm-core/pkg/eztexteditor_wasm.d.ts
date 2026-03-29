/* tslint:disable */
/* eslint-disable */
/**
 * Parse markdown to HTML using pulldown-cmark (much faster than marked.js).
 * Handles GFM tables, strikethrough, task lists, and heading IDs.
 */
export function parse_markdown(input: string): string;
/**
 * Preprocess markdown content before parsing:
 * 1. Encode spaces in markdown links/images
 * 2. Auto-embed plain image URLs
 * 3. Convert wiki-links to HTML spans
 */
export function preprocess_markdown(input: string): string;
/**
 * Search across all notes for a query string.
 * Returns JSON array of SearchMatch objects.
 * Much faster than JS string iteration for large content.
 */
export function search_all_notes(state_json: string, query: string): string;
/**
 * Search within a single note's content.
 * Returns JSON array of {match_index, line_num}.
 */
export function search_in_content(content: string, query: string): string;
/**
 * Count lines in text (number of newlines + 1). Optimized byte-level scan.
 */
export function count_lines(text: string): number;
/**
 * Count words in text. Matches \S+ sequences.
 */
export function count_words(text: string): number;
/**
 * Count the line number at a given byte offset (for cursor position tracking).
 */
export function line_at_offset(text: string, offset: number): number;
/**
 * Generate line number string for gutter display.
 */
export function generate_line_numbers(total: number): string;
/**
 * Encode text to base64url (no padding).
 */
export function base64url_encode(text: string): string;
/**
 * Decode base64url to text.
 */
export function base64url_decode(encoded: string): string | undefined;
/**
 * Highlight matching text with a span. Case-insensitive.
 */
export function highlight_match(text: string, query: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly parse_markdown: (a: number, b: number, c: number) => void;
  readonly preprocess_markdown: (a: number, b: number, c: number) => void;
  readonly search_all_notes: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly search_in_content: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly count_lines: (a: number, b: number) => number;
  readonly count_words: (a: number, b: number) => number;
  readonly line_at_offset: (a: number, b: number, c: number) => number;
  readonly generate_line_numbers: (a: number, b: number) => void;
  readonly base64url_encode: (a: number, b: number, c: number) => void;
  readonly base64url_decode: (a: number, b: number, c: number) => void;
  readonly highlight_match: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_export_0: (a: number, b: number) => number;
  readonly __wbindgen_export_1: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export_2: (a: number, b: number, c: number) => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
