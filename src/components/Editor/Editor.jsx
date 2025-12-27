import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import clsx from 'clsx';
import mermaid from 'mermaid';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css'; // Or similar
import katex from 'katex';
import 'katex/dist/katex.min.css';

// Initialize Mermaid
mermaid.initialize({ startOnLoad: false, theme: 'dark' });

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

    // Generate TOC
    useEffect(() => {
        if (!currentTab?.content) {
            setToc([]);
            return;
        }
        const lines = currentTab.content.split('\n');
        const headers = [];
        // Simple regex for headers # to ######
        const regex = /^(#{1,6})\s+(.*)$/;

        lines.forEach((line, index) => {
            const match = line.match(regex);
            if (match) {
                headers.push({
                    level: match[1].length,
                    text: match[2].trim(),
                    // simple slug
                    slug: match[2].trim().toLowerCase().replace(/[^\w]+/g, '-')
                });
            }
        });
        setToc(headers);
    }, [currentTab?.content]);

    // Sync scroll
    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    const handleInput = (e) => {
        actions.updateTabContent(activeTabId, e.target.value);
    };

    const [lineCount, setLineCount] = useState(1);
    useEffect(() => {
        if (!currentTab) return;
        const lines = (currentTab.content || '').split('\n').length;
        setLineCount(lines);
    }, [currentTab?.content]);

    // WikiLink Click Handler
    useEffect(() => {
        // We need to attach listeners to the preview container for delegated events
        // or handle clicks globally if they bubble up.
        // React's onClick on dangerouslySetInnerHTML doesn't catch inner clicks easily for non-react nodes.
        const handlePreviewClick = (e) => {
            if (e.target.classList.contains('wiki-link')) {
                const targetName = e.target.getAttribute('data-tab-name');
                // Logic to find tab by name and activate it
                // We need to pass this up or handle it here.
                // Ideally `actions.activateTabByName` or similar.
                // For now, let's try to find it locally.
                const findIdByName = (items, name) => {
                    for (const item of items) {
                        if (item.type === 'note' && item.title.toLowerCase() === name.toLowerCase()) return item.id;
                        if (item.children) {
                            const found = findIdByName(item.children, name);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                const targetId = findIdByName(tabs, targetName);
                if (targetId) {
                    actions.activateTab(targetId);
                } else {
                    // TODO: Propose creation?
                    alert(`Note "${targetName}" not found.`);
                }
            }
        };

        const el = previewRef.current;
        if (el) el.addEventListener('click', handlePreviewClick);
        return () => el && el.removeEventListener('click', handlePreviewClick);
    }, [tabs, actions]);


    // Effect to run Mermaid and Katex after render
    // Effect to run Mermaid after render
    useEffect(() => {
        if (settings.isPreviewMode && previewRef.current) {
            mermaid.run({
                nodes: previewRef.current.querySelectorAll('.mermaid')
            });
        }
    }, [currentTab?.content, settings.isPreviewMode]);


    if (!currentTab) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-ez-meta bg-ez-bg select-none">
                <p>Select a note to view</p>
            </div>
        );
    }

    const { content } = currentTab;
    const showPreview = settings?.isPreviewMode;
    const showLineNumbers = settings?.showLineNumbers;

    const renderPreview = () => {
        // Custom Renderer for Marked
        const renderer = new marked.Renderer();

        // Handle Mermaid
        renderer.code = (code, lang) => {
            if (lang === 'mermaid') {
                return `<div class="mermaid">${code}</div>`;
            }
            // Default highlight
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            const highlighted = hljs.highlight(code, { language }).value;
            return `<pre><code class="hljs language-${language}">${highlighted}</code></pre>`;
        };

        let processedContent = content || '';

        // 1. Math Pre-processing (Simple approach: replace blocks, then inline)
        // We use a temporary placeholders technique to avoid markdown messing up math
        // But simpler: just replace with katex.renderToString immediately.

        // Display Math $$...$$
        processedContent = processedContent.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula, { displayMode: true, throwOnError: false });
            } catch (e) {
                return match;
            }
        });

        // Inline Math $...$
        processedContent = processedContent.replace(/\$([^$\n]+?)\$/g, (match, formula) => {
            try {
                return katex.renderToString(formula, { displayMode: false, throwOnError: false });
            } catch (e) {
                return match;
            }
        });

        // 2. WikiLinks
        processedContent = processedContent.replace(/\[\[([^\]]+)\]\]/g, (match, text) => {
            return `<span class="wiki-link text-ez-accent cursor-pointer hover:underline border-b border-dashed border-ez-accent" data-tab-name="${text}">${text}</span>`;
        });

        marked.setOptions({ renderer });

        const rawMarkup = marked.parse(processedContent);
        // We need to allow KaTeX math classes/tags and Mermaid divs
        const cleanMarkup = DOMPurify.sanitize(rawMarkup, {
            ADD_TAGS: ['span', 'div', 'math', 'annotation', 'semantics', 'mrow', 'mn', 'mo', 'mi', 'msup', 'sub', 'sup'],
            ADD_ATTR: ['class', 'data-tab-name', 'target', 'style', 'xmlns', 'viewBox', 'd', 'fill', 'stroke']
        });

        return { __html: cleanMarkup };
    };

    return (
        <div id="editor-area" className="flex-1 relative h-full flex bg-ez-bg text-ez-text overflow-hidden">

            {showLineNumbers && !showPreview && (
                <div
                    ref={lineNumbersRef}
                    className="w-[50px] pt-10 pb-10 text-right pr-3 bg-gray-50/5 dark:bg-gray-900/20 text-ez-meta border-r border-ez-border font-mono text-lg leading-relaxed select-none overflow-hidden"
                    style={{ lineHeight: '30px' }}
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                    {settings.isTypewriterMode && <div className="h-[50vh]" />}
                </div>
            )}

            {!showPreview ? (
                <>
                    {settings.isTypewriterMode && (
                        <div
                            className="line-highlight"
                            style={{
                                top: '50%',
                                marginTop: '-15px',
                                width: '100%',
                                display: 'block'
                            }}
                        />
                    )}
                    <textarea
                        ref={textareaRef}
                        className={clsx(
                            "w-full h-full p-10 bg-transparent resize-none outline-none font-mono text-lg text-ez-text leading-relaxed relative z-10",
                            settings.isTypewriterMode && "pb-[50vh]"
                        )}
                        style={{ lineHeight: '30px', whiteSpace: showLineNumbers ? 'pre' : 'pre-wrap' }}
                        value={content || ''}
                        onChange={handleInput}
                        onScroll={handleScroll}
                        placeholder="Start typing..."
                        spellCheck="false"
                    />
                </>
            ) : (
                <div className="flex w-full h-full overflow-hidden">
                    {/* TOC Sidebar if needed, or just inline. Legacy had sticky TOC. */}
                    <div
                        ref={previewRef}
                        className="flex-1 h-full p-10 overflow-y-auto prose dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={renderPreview()}
                    />

                    {/* TOC Sidebar */}
                    {toc.length > 0 && (
                        <div className="w-[200px] hidden lg:block h-full overflow-y-auto border-l border-ez-border p-4 text-sm text-ez-meta flex-shrink-0">
                            <h4 className="font-bold mb-4 uppercase text-xs tracking-wider opacity-70">Table of Contents</h4>
                            <ul>
                                {toc.map((h, i) => (
                                    <li key={i} style={{ marginLeft: (h.level - 1) * 12 + 'px' }} className="mb-2">
                                        <a
                                            href={`#${h.slug}`}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                const el = document.getElementById(h.slug);
                                                if (el) el.scrollIntoView({ behavior: 'smooth' });
                                            }}
                                            className="hover:text-ez-text transition block truncate"
                                            title={h.text}
                                        >
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
