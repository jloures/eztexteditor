import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import clsx from 'clsx';

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

    // Sync scroll for line numbers
    const handleScroll = (e) => {
        if (lineNumbersRef.current) {
            lineNumbersRef.current.scrollTop = e.target.scrollTop;
        }
    };

    // Typewriter effect: Keep cursor centered vertically
    const handleInput = (e) => {
        actions.updateTabContent(activeTabId, e.target.value);
        if (settings.isTypewriterMode) {
            // Basic centering logic
            // Ideally we need to calculate cursor Y position.
            // For simple textarea, avoiding complexity, we can just ensure 
            // padding-bottom is huge, but auto-centering on input is tricky without a pixel-perfect measure.
            // The original used `padding-bottom: 50vh`.
            // We can do that in CSS logic below.
        }
    };

    // Line Numbers Generation
    const [lineCount, setLineCount] = useState(1);
    useEffect(() => {
        if (!currentTab) return;
        const lines = (currentTab.content || '').split('\n').length;
        setLineCount(lines);
    }, [currentTab?.content]);

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
        // TODO: Add wikilink custom renderer here
        const rawMarkup = marked.parse(content || '');
        const cleanMarkup = DOMPurify.sanitize(rawMarkup);
        return { __html: cleanMarkup };
    };

    return (
        <div className="flex-1 relative h-full flex bg-ez-bg text-ez-text overflow-hidden">

            {/* Line Numbers Gutter */}
            {!showPreview && showLineNumbers && (
                <div
                    ref={lineNumbersRef}
                    className="w-[50px] pt-10 pb-10 text-right pr-3 bg-gray-50/5 dark:bg-gray-900/20 text-ez-meta border-r border-ez-border font-mono text-lg leading-relaxed select-none overflow-hidden"
                    style={{ lineHeight: '30px' }} // Match textarea line-height
                >
                    {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                    ))}
                    {/* Add extra space for typewriter padding */}
                    {settings.isTypewriterMode && <div className="h-[50vh]" />}
                </div>
            )}

            {!showPreview ? (
                <textarea
                    ref={textareaRef}
                    className={clsx(
                        "w-full h-full p-10 bg-transparent resize-none outline-none font-mono text-lg text-ez-text leading-relaxed",
                        settings.isTypewriterMode && "pb-[50vh]"
                    )}
                    style={{ lineHeight: '30px', whiteSpace: showLineNumbers ? 'pre' : 'pre-wrap' }}
                    value={content || ''}
                    onChange={handleInput}
                    onScroll={handleScroll}
                    placeholder="Start typing..."
                    spellCheck="false"
                />
            ) : (
                <div
                    className="w-full h-full p-10 overflow-y-auto prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={renderPreview()}
                />
            )}
        </div>
    );
}
