use wasm_bindgen::prelude::*;
use pulldown_cmark::{Parser, Options, html, Event, Tag, TagEnd};
use serde::Serialize;

// ─── Markdown Parsing ───────────────────────────────────────────────────────

/// Parse markdown to HTML using pulldown-cmark (much faster than marked.js).
/// Handles GFM tables, strikethrough, task lists, and heading IDs.
#[wasm_bindgen]
pub fn parse_markdown(input: &str) -> String {
    let mut opts = Options::empty();
    opts.insert(Options::ENABLE_TABLES);
    opts.insert(Options::ENABLE_STRIKETHROUGH);
    opts.insert(Options::ENABLE_TASKLISTS);
    opts.insert(Options::ENABLE_HEADING_ATTRIBUTES);

    let parser = Parser::new_ext(input, opts);

    // Add IDs to headings and apply syntax highlighting class hints
    let mut heading_count: usize = 0;
    let mut in_heading = false;
    let mut heading_text = String::new();

    let events: Vec<Event> = parser.collect();
    let mut output = String::with_capacity(input.len() * 2);

    let mut i = 0;
    while i < events.len() {
        match &events[i] {
            Event::Start(Tag::Heading { level, .. }) => {
                in_heading = true;
                heading_text.clear();
                let id = format!("heading-{}", heading_count);
                heading_count += 1;
                output.push_str(&format!("<{} id=\"{}\">", level, id));
                i += 1;
            }
            Event::End(TagEnd::Heading(level)) => {
                in_heading = false;
                output.push_str(&format!("</{}>", level));
                i += 1;
            }
            Event::Start(Tag::CodeBlock(kind)) => {
                let lang = match kind {
                    pulldown_cmark::CodeBlockKind::Fenced(lang) => {
                        let l = lang.as_ref().trim();
                        if l.is_empty() { None } else { Some(l.to_string()) }
                    }
                    _ => None,
                };
                if let Some(ref lang) = lang {
                    output.push_str(&format!("<pre><code class=\"language-{}\">", lang));
                } else {
                    output.push_str("<pre><code>");
                }
                i += 1;
            }
            Event::End(TagEnd::CodeBlock) => {
                output.push_str("</code></pre>\n");
                i += 1;
            }
            Event::Text(text) => {
                if in_heading {
                    heading_text.push_str(text.as_ref());
                }
                output.push_str(&html_escape(text.as_ref()));
                i += 1;
            }
            Event::Code(text) => {
                output.push_str("<code>");
                output.push_str(&html_escape(text.as_ref()));
                output.push_str("</code>");
                i += 1;
            }
            Event::Html(html) | Event::InlineHtml(html) => {
                output.push_str(html.as_ref());
                i += 1;
            }
            Event::SoftBreak => {
                output.push('\n');
                i += 1;
            }
            Event::HardBreak => {
                output.push_str("<br />\n");
                i += 1;
            }
            Event::Rule => {
                output.push_str("<hr />\n");
                i += 1;
            }
            _ => {
                // For all other events, use the default HTML renderer for this chunk
                let mut single = Vec::new();
                single.push(events[i].clone());
                let mut tmp = String::new();
                html::push_html(&mut tmp, single.into_iter());
                output.push_str(&tmp);
                i += 1;
            }
        }
    }

    output
}

fn html_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    for c in s.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            '"' => out.push_str("&quot;"),
            _ => out.push(c),
        }
    }
    out
}

// ─── Markdown Preprocessing ─────────────────────────────────────────────────

/// Preprocess markdown content before parsing:
/// 1. Encode spaces in markdown links/images
/// 2. Auto-embed plain image URLs
/// 3. Convert wiki-links to HTML spans
#[wasm_bindgen]
pub fn preprocess_markdown(input: &str) -> String {
    let mut result = String::with_capacity(input.len() + 256);

    // Process line by line for better control
    let lines: Vec<&str> = input.lines().collect();
    for (idx, line) in lines.iter().enumerate() {
        if idx > 0 {
            result.push('\n');
        }
        let processed = process_line(line);
        result.push_str(&processed);
    }

    // Handle trailing newline
    if input.ends_with('\n') {
        result.push('\n');
    }

    result
}

fn process_line(line: &str) -> String {
    let mut result = String::with_capacity(line.len() + 64);
    let chars: Vec<char> = line.chars().collect();
    let len = chars.len();
    let mut i = 0;

    while i < len {
        // Check for wiki-links: [[...]]
        if i + 1 < len && chars[i] == '[' && chars[i + 1] == '[' {
            if let Some(end) = find_closing_wiki_link(&chars, i + 2) {
                let tab_name: String = chars[i + 2..end].iter().collect();
                let trimmed = tab_name.trim();
                result.push_str(&format!(
                    "<span class=\"wiki-link\" data-tab-name=\"{}\">{}</span>",
                    html_escape_attr(trimmed),
                    trimmed
                ));
                i = end + 2; // skip past ]]
                continue;
            }
        }

        // Check for markdown links/images: ![text](url) or [text](url)
        let is_image = i < len && chars[i] == '!' && i + 1 < len && chars[i + 1] == '[';
        let is_link = chars[i] == '[' && !is_image;

        if is_image || is_link {
            let start = if is_image { i + 1 } else { i };
            if let Some((text_end, url_start, url_end)) = parse_md_link(&chars, start) {
                let url: String = chars[url_start..url_end].iter().collect();
                if url.contains(' ') && !url.starts_with('<') {
                    let prefix: String = chars[i..=text_end].iter().collect();
                    let encoded_url = url.trim().replace(' ', "%20");
                    result.push_str(&format!("{}({})", prefix, encoded_url));
                    i = url_end + 1; // skip past )
                    continue;
                }
            }
        }

        // Check for plain image URLs (not already in markdown syntax)
        if chars[i] == 'h' && !is_in_md_context(&chars, i) {
            let remaining: String = chars[i..].iter().collect();
            if let Some(url_len) = match_image_url(&remaining) {
                let url: String = chars[i..i + url_len].iter().collect();
                result.push_str(&format!("![]({})", url));
                i += url_len;
                continue;
            }
        }

        result.push(chars[i]);
        i += 1;
    }

    result
}

fn find_closing_wiki_link(chars: &[char], start: usize) -> Option<usize> {
    let mut i = start;
    while i + 1 < chars.len() {
        if chars[i] == ']' && chars[i + 1] == ']' {
            return Some(i);
        }
        i += 1;
    }
    None
}

fn parse_md_link(chars: &[char], start: usize) -> Option<(usize, usize, usize)> {
    if start >= chars.len() || chars[start] != '[' {
        return None;
    }
    let mut i = start + 1;
    let mut depth = 1;
    while i < chars.len() && depth > 0 {
        if chars[i] == '[' { depth += 1; }
        if chars[i] == ']' { depth -= 1; }
        i += 1;
    }
    let text_end = i - 1; // position of ]
    if i >= chars.len() || chars[i] != '(' {
        return None;
    }
    let url_start = i + 1;
    depth = 1;
    i = url_start;
    while i < chars.len() && depth > 0 {
        if chars[i] == '(' { depth += 1; }
        if chars[i] == ')' { depth -= 1; }
        i += 1;
    }
    let url_end = i - 1; // position of )
    Some((text_end, url_start, url_end))
}

fn is_in_md_context(chars: &[char], pos: usize) -> bool {
    if pos > 0 {
        let prev = chars[pos - 1];
        if prev == '(' || prev == '[' || prev == '!' {
            return true;
        }
    }
    false
}

fn match_image_url(s: &str) -> Option<usize> {
    if !s.starts_with("http://") && !s.starts_with("https://") {
        return None;
    }
    // Find end of URL (non-whitespace)
    let url_end = s.find(char::is_whitespace).unwrap_or(s.len());
    let url = &s[..url_end];

    let extensions = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif"];
    let lower = url.to_lowercase();
    for ext in &extensions {
        if lower.ends_with(ext) {
            return Some(url_end);
        }
    }
    None
}

fn html_escape_attr(s: &str) -> String {
    s.replace('&', "&amp;")
        .replace('"', "&quot;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
}

// ─── Text Search ────────────────────────────────────────────────────────────

#[derive(Serialize)]
pub struct SearchMatch {
    pub tab_id: String,
    pub tab_title: String,
    pub match_index: i32,
    pub line_num: u32,
    pub is_title: bool,
}

/// Search across all notes for a query string.
/// Returns JSON array of SearchMatch objects.
/// Much faster than JS string iteration for large content.
#[wasm_bindgen]
pub fn search_all_notes(state_json: &str, query: &str) -> String {
    if query.trim().is_empty() {
        return "[]".to_string();
    }

    let state: serde_json::Value = match serde_json::from_str(state_json) {
        Ok(v) => v,
        Err(_) => return "[]".to_string(),
    };

    let mut matches: Vec<SearchMatch> = Vec::new();
    let q_lower = query.to_lowercase();

    if let Some(tabs) = state["tabs"].as_array() {
        search_recursive(tabs, &q_lower, &mut matches);
    }

    serde_json::to_string(&matches).unwrap_or_else(|_| "[]".to_string())
}

fn search_recursive(items: &[serde_json::Value], q_lower: &str, matches: &mut Vec<SearchMatch>) {
    for item in items {
        let item_type = item["type"].as_str().unwrap_or("note");
        let id = item["id"].as_str().unwrap_or("").to_string();
        let title = item["title"].as_str().unwrap_or("").to_string();

        if item_type == "note" {
            // Title match
            if title.to_lowercase().contains(q_lower) {
                matches.push(SearchMatch {
                    tab_id: id.clone(),
                    tab_title: title.clone(),
                    match_index: -1,
                    line_num: 0,
                    is_title: true,
                });
            }

            // Content matches
            let content = item["content"].as_str().unwrap_or("");
            let c_lower = content.to_lowercase();
            let q_bytes = q_lower.as_bytes();
            let c_bytes = c_lower.as_bytes();

            let mut pos = 0;
            let mut current_line: u32 = 1;
            let mut last_match_pos: usize = 0;

            while pos + q_bytes.len() <= c_bytes.len() && matches.len() < 500 {
                if let Some(found) = c_lower[pos..].find(q_lower) {
                    let abs_pos = pos + found;

                    // Count newlines since last match
                    for &b in &content.as_bytes()[last_match_pos..abs_pos] {
                        if b == b'\n' {
                            current_line += 1;
                        }
                    }
                    last_match_pos = abs_pos;

                    matches.push(SearchMatch {
                        tab_id: id.clone(),
                        tab_title: title.clone(),
                        match_index: abs_pos as i32,
                        line_num: current_line,
                        is_title: false,
                    });

                    pos = abs_pos + 1;
                } else {
                    break;
                }
            }
        } else if let Some(children) = item["children"].as_array() {
            search_recursive(children, q_lower, matches);
        }
    }
}

/// Search within a single note's content.
/// Returns JSON array of {match_index, line_num}.
#[wasm_bindgen]
pub fn search_in_content(content: &str, query: &str) -> String {
    if query.trim().is_empty() {
        return "[]".to_string();
    }

    let q_lower = query.to_lowercase();
    let c_lower = content.to_lowercase();
    let mut results: Vec<serde_json::Value> = Vec::new();

    let mut pos = 0;
    let mut current_line: u32 = 1;
    let mut last_pos: usize = 0;

    while pos + q_lower.len() <= c_lower.len() && results.len() < 500 {
        if let Some(found) = c_lower[pos..].find(&q_lower) {
            let abs_pos = pos + found;

            for &b in &content.as_bytes()[last_pos..abs_pos] {
                if b == b'\n' {
                    current_line += 1;
                }
            }
            last_pos = abs_pos;

            results.push(serde_json::json!({
                "matchIndex": abs_pos,
                "lineNum": current_line,
            }));

            pos = abs_pos + 1;
        } else {
            break;
        }
    }

    serde_json::to_string(&results).unwrap_or_else(|_| "[]".to_string())
}

// ─── Line & Word Counting ───────────────────────────────────────────────────

/// Count lines in text (number of newlines + 1). Optimized byte-level scan.
#[wasm_bindgen]
pub fn count_lines(text: &str) -> u32 {
    let mut count: u32 = 1;
    for &b in text.as_bytes() {
        if b == b'\n' {
            count += 1;
        }
    }
    count
}

/// Count words in text. Matches \S+ sequences.
#[wasm_bindgen]
pub fn count_words(text: &str) -> u32 {
    text.split_whitespace().count() as u32
}

/// Count the line number at a given byte offset (for cursor position tracking).
#[wasm_bindgen]
pub fn line_at_offset(text: &str, offset: usize) -> u32 {
    let end = offset.min(text.len());
    let mut line: u32 = 1;
    for &b in &text.as_bytes()[..end] {
        if b == b'\n' {
            line += 1;
        }
    }
    line
}

/// Generate line number string for gutter display.
#[wasm_bindgen]
pub fn generate_line_numbers(total: u32) -> String {
    let mut result = String::with_capacity((total as usize) * 5);
    for i in 1..=total {
        result.push_str(&i.to_string());
        result.push('\n');
    }
    result
}

// ─── Base64 URL Encoding ────────────────────────────────────────────────────

const BASE64_CHARS: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/// Encode text to base64url (no padding).
#[wasm_bindgen]
pub fn base64url_encode(text: &str) -> String {
    // First encode to UTF-8, then URI-encode, then unescape, then base64
    // This matches the JS: btoa(unescape(encodeURIComponent(text)))
    let bytes = text.as_bytes();

    // URI encode then unescape to get the byte sequence JS expects
    let mut uri_bytes: Vec<u8> = Vec::with_capacity(bytes.len() * 3);
    for &b in bytes {
        if b < 128 {
            // For ASCII, encodeURIComponent passes through most chars
            match b {
                b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' |
                b'-' | b'_' | b'.' | b'!' | b'~' | b'*' | b'\'' | b'(' | b')' => {
                    uri_bytes.push(b);
                }
                _ => {
                    uri_bytes.push(b); // unescape brings it back
                }
            }
        } else {
            // Multi-byte UTF-8 chars get percent-encoded then unescaped
            // The JS pattern btoa(unescape(encodeURIComponent(text))) converts
            // UTF-8 to bytes. We already have UTF-8 bytes, so just use them directly.
            uri_bytes.push(b);
        }
    }

    let encoded = base64_encode_bytes(&uri_bytes);
    // Convert to URL-safe: + -> -, / -> _, strip =
    encoded.replace('+', "-").replace('/', "_").trim_end_matches('=').to_string()
}

/// Decode base64url to text.
#[wasm_bindgen]
pub fn base64url_decode(encoded: &str) -> Option<String> {
    // Convert from URL-safe back to standard base64
    let standard = encoded.replace('-', "+").replace('_', "/");
    // Add padding
    let padded = match standard.len() % 4 {
        2 => format!("{}==", standard),
        3 => format!("{}=", standard),
        _ => standard,
    };

    let bytes = base64_decode_bytes(&padded)?;

    // This matches JS: decodeURIComponent(escape(atob(base64)))
    // The bytes are UTF-8
    String::from_utf8(bytes).ok()
}

fn base64_encode_bytes(input: &[u8]) -> String {
    let mut result = String::with_capacity((input.len() + 2) / 3 * 4);
    let chunks = input.chunks(3);

    for chunk in chunks {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };

        let n = (b0 << 16) | (b1 << 8) | b2;

        result.push(BASE64_CHARS[((n >> 18) & 0x3F) as usize] as char);
        result.push(BASE64_CHARS[((n >> 12) & 0x3F) as usize] as char);

        if chunk.len() > 1 {
            result.push(BASE64_CHARS[((n >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }

        if chunk.len() > 2 {
            result.push(BASE64_CHARS[(n & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }

    result
}

fn base64_decode_bytes(input: &str) -> Option<Vec<u8>> {
    let mut result = Vec::with_capacity(input.len() * 3 / 4);
    let bytes: Vec<u8> = input.bytes()
        .filter(|&b| b != b'\n' && b != b'\r' && b != b' ')
        .collect();

    if bytes.len() % 4 != 0 {
        return None;
    }

    for chunk in bytes.chunks(4) {
        let a = b64_val(chunk[0])?;
        let b = b64_val(chunk[1])?;
        let c = if chunk[2] == b'=' { 0 } else { b64_val(chunk[2])? };
        let d = if chunk[3] == b'=' { 0 } else { b64_val(chunk[3])? };

        let n = ((a as u32) << 18) | ((b as u32) << 12) | ((c as u32) << 6) | (d as u32);

        result.push((n >> 16) as u8);
        if chunk[2] != b'=' {
            result.push((n >> 8) as u8);
        }
        if chunk[3] != b'=' {
            result.push(n as u8);
        }
    }

    Some(result)
}

fn b64_val(c: u8) -> Option<u8> {
    match c {
        b'A'..=b'Z' => Some(c - b'A'),
        b'a'..=b'z' => Some(c - b'a' + 26),
        b'0'..=b'9' => Some(c - b'0' + 52),
        b'+' => Some(62),
        b'/' => Some(63),
        _ => None,
    }
}

// ─── Highlight Match ────────────────────────────────────────────────────────

/// Highlight matching text with a span. Case-insensitive.
#[wasm_bindgen]
pub fn highlight_match(text: &str, query: &str) -> String {
    if query.is_empty() {
        return text.to_string();
    }

    let t_lower = text.to_lowercase();
    let q_lower = query.to_lowercase();
    let mut result = String::with_capacity(text.len() * 2);
    let mut last = 0;

    while let Some(pos) = t_lower[last..].find(&q_lower) {
        let abs_pos = last + pos;
        result.push_str(&html_escape(&text[last..abs_pos]));
        result.push_str("<span class=\"search-match-highlight\">");
        result.push_str(&html_escape(&text[abs_pos..abs_pos + query.len()]));
        result.push_str("</span>");
        last = abs_pos + query.len();
    }
    result.push_str(&html_escape(&text[last..]));

    result
}
