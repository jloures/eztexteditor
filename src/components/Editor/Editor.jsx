import React, { useState, useEffect, useRef, useCallback } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

// Ported from legacy for Wiki Suggestions placement
function getCaretCoordinates(element, position) {
    const div = document.createElement('div');
    const style = getComputedStyle(element);
    for (const prop of style) {
        if (prop !== 'height') div.style[prop] = style[prop];
    }
    div.style.position = 'absolute';
    div.style.visibility = 'hidden';
    div.style.whiteSpace = 'pre-wrap';
    div.style.width = element.clientWidth + 'px';
    div.style.height = 'auto';
    div.textContent = element.value.substring(0, position);
    const span = document.createElement('span');
    span.textContent = element.value.substring(position) || '.';
    div.appendChild(span);
    document.body.appendChild(div);
    const { offsetTop: top, offsetLeft: left } = span;
    document.body.removeChild(div);
    return { top, left };
}

export default function Editor({ activeTabId, tabs, actions, settings }) {
    const findTab = (items, id) => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findTab(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    const currentTab = findTab(tabs, activeTabId);
    const textareaRef = useRef(null);
    const lineNumbersRef = useRef(null);
    const previewRef = useRef(null);
    const [toc, setToc] = useState([]);

    // Wiki Suggestions State
    const [suggestions, setSuggestions] = useState([]);
    const [selectedSugIdx, setSelectedSugIdx] = useState(0);
    const [sugPos, setSugPos] = useState({ top: 0, left: 0 });

    // Helper: Get item path (recursive)
    const getItemPath = useCallback((item, items = tabs, parent = null) => {
        const findParent = (id, list, p = null) => {
            for (const it of list) {
                if (it.id === id) return p;
                if (it.children) {
                    const res = findParent(id, it.children, it);
                    if (res) return res;
                }
            }
            return null;
        };
        const p = findParent(item.id, items);
        if (p) {
            return (getItemPath(p, items) + '/' + item.title).replace(/^\//, '');
        }
        return item.title;
    }, [tabs]);

    // Generate TOC
    useEffect(() => {
        if (!currentTab?.content) {
            setToc([]);
            return;
        }
        const lines = currentTab.content.split('\n');
        const headers = [];
        const regex = /^(#{1,6})\s+(.*)$/;
        lines.forEach((line) => {
            const match = line.match(regex);
            if (match) {
                headers.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    slug: match[2].trim().toLowerCase().replace(/[^\w]+/g, '-')
                });
            }
        });
        setToc(headers);
    }, [currentTab?.content]);

    // Sync scroll & Typewriter Highlight
    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
        updateHighlightPos();
    };

    const [highlightTop, setHighlightTop] = useState(40);

    // Improved centering logic
    const updateHighlightPos = useCallback((forceCenter = false) => {
        if (!textareaRef.current || settings.isPreviewMode) return;
        const el = textareaRef.current;
        const caretPos = el.selectionStart;
        const text = el.value.substring(0, caretPos);
        const lineNum = text.split('\n').length;
        const paddingTop = 40;
        const lineHeight = 30;

        const newTop = paddingTop + (lineNum - 1) * lineHeight;
        setHighlightTop(newTop);

        if (settings.isTypewriterMode || forceCenter) {
            const targetScroll = newTop - (el.clientHeight / 2) + (lineHeight / 2);
            if (Math.abs(el.scrollTop - targetScroll) > 5 || forceCenter) {
                el.scrollTop = targetScroll;
            }
        }
    }, [settings.isTypewriterMode, settings.isPreviewMode]);

    // Handle initial focus and external navigation (search matches)
    useEffect(() => {
        if (textareaRef.current && !settings.isPreviewMode) {
            // Check if there's a pending selection from search
            const pending = window.__pendingSelection;
            if (pending && pending.id === activeTabId) {
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(pending.pos, pending.pos);
                updateHighlightPos(true);
                delete window.__pendingSelection;
            } else {
                textareaRef.current.focus();
                updateHighlightPos();
            }
        }
    }, [activeTabId, settings.isPreviewMode, updateHighlightPos]);

    const handleInput = (e) => {
        actions.updateTabContent(activeTabId, e.target.value);
        updateWikiSuggestions(e.target);
        updateHighlightPos();
    };

    const updateWikiSuggestions = (el) => {
        const cursor = el.selectionStart;
        const text = el.value.substring(0, cursor);
        const match = text.match(/\[\[([^\]]*)$/);

        if (match) {
            const query = match[1].toLowerCase();
            const allNotes = [];
            const gather = (items) => {
                items.forEach(i => {
                    if (i.type === 'note') allNotes.push(i);
                    else if (i.children) gather(i.children);
                });
            };
            gather(tabs);
            const filtered = allNotes.filter(n => n.title.toLowerCase().includes(query));
            if (filtered.length > 0) {
                setSuggestions(filtered);
                setSelectedSugIdx(0);
                const coords = getCaretCoordinates(el, cursor);
                setSugPos({ top: coords.top + 30, left: coords.left });
            } else {
                setSuggestions([]);
            }
        } else {
            setSuggestions([]);
        }
    };

    const insertWikiLink = (note) => {
        const el = textareaRef.current;
        const path = getItemPath(note);
        const cursor = el.selectionStart;
        const text = el.value;
        const before = text.substring(0, cursor).replace(/\[\[[^\[]*$/, '');
        const after = text.substring(cursor);
        const newValue = before + '[[' + path + ']]' + after;
        actions.updateTabContent(activeTabId, newValue);
        setSuggestions([]);
        el.focus();
    };

    const [lineCount, setLineCount] = useState(1);
    useEffect(() => {
        if (!currentTab) return;
        setLineCount((currentTab.content || '').split('\n').length);
    }, [currentTab?.content]);

    // Preview Clicks for WikiLinks
    useEffect(() => {
        const handlePreviewClick = (e) => {
            if (e.target.classList.contains('wiki-link')) {
                const targetName = e.target.getAttribute('data-tab-name');
                const findNote = (items, name) => {
                    for (const item of items) {
                        if (item.type === 'note') {
                            const path = getItemPath(item);
                            if (path.toLowerCase() === name.toLowerCase() || item.title.toLowerCase() === name.toLowerCase()) return item.id;
                        }
                        if (item.children) {
                            const found = findNote(item.children, name);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const targetId = findNote(tabs, targetName);
                if (targetId) {
                    actions.activateTab(targetId);
                } else if (window.confirm(`Note "${targetName}" not found. Create it?`)) {
                    const id = actions.createTab('note');
                    actions.renameTab(id, targetName);
                    actions.activateTab(id);
                }
            }
        };
        const el = previewRef.current;
        if (el) el.addEventListener('click', handlePreviewClick);
        return () => el && el.removeEventListener('click', handlePreviewClick);
    }, [tabs, actions, getItemPath]);

    useEffect(() => {
        if (settings.isPreviewMode && previewRef.current) {
            mermaid.run({ nodes: previewRef.current.querySelectorAll('.mermaid') });
        }
    }, [currentTab?.content, settings.isPreviewMode]);

    if (!currentTab) return <div className="flex-1 flex items-center justify-center text-ez-meta bg-ez-bg select-none">Select a note to view</div>;

    const renderPreview = () => {
        const renderer = new marked.Renderer();
        renderer.code = (code, lang) => {
            if (lang === 'mermaid') return `<div class="mermaid">${code}</div>`;
            try {
                const language = hljs.getLanguage(lang) ? lang : 'plaintext';
                return `<pre><code class="hljs language-${language}">${hljs.highlight(code, { language }).value}</code></pre>`;
            } catch (e) { return `<pre><code>${code}</code></pre>`; }
        };
        renderer.heading = (text, level) => {
            const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
            return `<h${level} id="${slug}">${text}</h${level}>`;
        };

        let processedContent = currentTab.content || '';
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (m, f) => {
            try { return katex.renderToString(f, { displayMode: true, throwOnError: false }); } catch (e) { return m; }
        });
        processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (m, f) => {
            try { return katex.renderToString(f, { displayMode: false, throwOnError: false }); } catch (e) { return m; }
        });
        processedContent = processedContent.replace(/\[\[([^\]]+)\]\]/g, (m, t) => {
            return `<span class="wiki-link" data-tab-name="${t}">${t}</span>`;
        });
        // Auto-embed image links
        processedContent = processedContent.replace(/(?<![!\[\(])(https?:\/\/\S+\.(?:png|jpg|jpeg|gif|webp|svg|avif))(?![\]\)])/gi, '![]($1)');

        marked.setOptions({ renderer, breaks: true, gfm: true });
        const rawMarkup = marked.parse(processedContent);
        const cleanMarkup = DOMPurify.sanitize(rawMarkup, {
            ADD_TAGS: ['span', 'div', 'math', 'annotation', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'sub', 'sup'],
            ADD_ATTR: ['id', 'class', 'data-tab-name', 'target', 'style', 'xmlns', 'viewBox', 'd', 'fill', 'stroke']
        });
        return { __html: cleanMarkup };
    };

    return (
        <div id="editor-area" className="flex-1 relative h-full flex bg-ez-bg text-ez-text overflow-hidden">
            {settings.isZen && <div className="zen-hint">Press <b>Esc</b> to exit Zen Mode</div>}

            {settings.showLineNumbers && !settings.isPreviewMode && (
                <div
                    ref={lineNumbersRef}
                    className="w-[60px] pt-10 pb-10 text-right pr-3 bg-gray-50/5 dark:bg-gray-900/10 text-ez-meta border-r border-ez-border font-mono text-lg leading-relaxed select-none overflow-hidden"
                    style={{ lineHeight: '30px' }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => <div key={i}>{i + 1}</div>)}
                    {(settings.isTypewriterMode) && <div className="h-[50vh]" />}
                </div>
            )}

            {!settings.isPreviewMode ? (
                <>
                    {(settings.isTypewriterMode || highlightTop !== 0) && (
                        <div
                            className="line-highlight"
                            style={{
                                top: `${highlightTop}px`,
                                display: (settings.isTypewriterMode || (window.__highlightActive)) ? 'block' : 'none',
                                transform: `translateY(-${textareaRef.current?.scrollTop || 0}px)`
                            }}
                        />
                    )}
                    <textarea
                        ref={textareaRef}
                        className={clsx(
                            "w-full h-full p-10 bg-transparent resize-none outline-none font-mono text-lg text-ez-text leading-relaxed relative z-10",
                            settings.isTypewriterMode && "pb-[50vh]"
                        )}
                        style={{ lineHeight: '30px', whiteSpace: settings.showLineNumbers ? 'pre' : 'pre-wrap' }}
                        value={currentTab.content || ''}
                        onChange={handleInput}
                        onScroll={handleScroll}
                        onSelect={() => updateHighlightPos()}
                        onKeyDown={(e) => {
                            if (suggestions.length > 0) {
                                if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedSugIdx(prev => (prev + 1) % suggestions.length); }
                                else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedSugIdx(prev => (prev - 1 + suggestions.length) % suggestions.length); }
                                else if (e.key === 'Enter' || e.key === 'Tab') { e.preventDefault(); insertWikiLink(suggestions[selectedSugIdx]); }
                                else if (e.key === 'Escape') { setSuggestions([]); }
                            }
                            // Update highlight position immediately on keydown for arrows
                            if (e.key.startsWith('Arrow')) {
                                setTimeout(() => updateHighlightPos(), 0);
                            }
                        }}
                        onKeyUp={() => updateHighlightPos()}
                        onClick={() => updateHighlightPos()}
                        placeholder="Start typing..."
                        spellCheck="false"
                    />
                    {suggestions.length > 0 && (
                        <div id="wikiSuggestion" style={{ top: sugPos.top, left: sugPos.left, display: 'block' }}>
                            {suggestions.map((note, i) => (
                                <div
                                    key={note.id}
                                    className={`suggestion-item ${i === selectedSugIdx ? 'selected' : ''}`}
                                    onClick={() => insertWikiLink(note)}
                                >
                                    <i className="fas fa-file-alt"></i> {getItemPath(note)}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <div className="flex w-full h-full overflow-hidden">
                    <div ref={previewRef} className="flex-1 h-full p-10 overflow-y-auto prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={renderPreview()} />
                    {toc.length > 2 && (
                        <div className="w-[220px] hidden lg:block h-full overflow-y-auto border-l border-ez-border p-4 text-sm text-ez-meta flex-shrink-0" id="toc-container" style={{ display: 'block' }}>
                            <h4 className="font-bold mb-4 uppercase text-[0.7rem] tracking-wider opacity-70">Table of Contents</h4>
                            <ul id="toc-list">
                                {toc.map((h, i) => (
                                    <li key={i} style={{ marginLeft: (h.level - 1) * 12 + 'px' }} className="mb-2">
                                        <a href={`#${h.slug}`} onClick={(e) => {
                                            e.preventDefault();
                                            const el = document.getElementById(h.slug);
                                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                                        }} className="hover:text-ez-accent transition block truncate" title={h.text}>
                                            {h.text}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
