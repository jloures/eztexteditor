import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store';
import { findItemById } from '../utils/tabs';

export const Editor: React.FC = () => {
    const {
        tabs, activeTabId, updateTab, settings
    } = useStore();

    const editorRef = useRef<HTMLTextAreaElement>(null);
    const gutterRef = useRef<HTMLDivElement>(null);
    const highlightRef = useRef<HTMLDivElement>(null);

    const [content, setContent] = useState("");
    const lastLineCountRef = useRef(-1);

    // activeTab might be undefined if no tabs
    const activeTab = activeTabId ? findItemById(activeTabId, tabs) : null;

    // Initialize content on tab switch
    useEffect(() => {
        if (activeTab) {
            setContent(activeTab.content || "");
            if (editorRef.current) {
                editorRef.current.value = activeTab.content || "";
                updateLineNumbers(activeTab.content || "");
                // Restore cursor logic could go here
            }
        }
    }, [activeTabId]); // Only when ID changes, not on every title change 
    // Note: if 'tabs' changes due to content update, we don't want to reset value if we typed it.
    // The store update is debounced, but we use uncontrolled input for performance.

    const updateLineNumbers = (val: string) => {
        if (!settings.showLineNumbers || !gutterRef.current) return;

        let count = 1;
        for (let i = 0; i < val.length; i++) {
            if (val[i] === '\n') count++;
        }

        if (count !== lastLineCountRef.current) {
            let s = '';
            for (let i = 1; i <= count; i++) {
                s += i + '\n';
            }
            gutterRef.current.textContent = s;
            lastLineCountRef.current = count;
        }
    };

    const handleScroll = () => {
        if (gutterRef.current && editorRef.current) {
            gutterRef.current.scrollTop = editorRef.current.scrollTop;
        }
        updateTypewriterWrapper();
    };

    const updateTypewriterWrapper = (forceCenter = false) => {
        if ((!settings.isTypewriter && !forceCenter) || !editorRef.current) return;

        const editor = editorRef.current;
        const caretPos = editor.selectionStart;
        const val = editor.value;

        let currentLineNum = 1;
        for (let i = 0; i < caretPos; i++) {
            if (val[i] === '\n') currentLineNum++;
        }

        const lineHeight = 30; // Fixed constant matching CSS
        const paddingTop = 40;

        // Highlight Logic
        if (highlightRef.current) {
            highlightRef.current.style.top = `${paddingTop + ((currentLineNum - 1) * lineHeight)}px`;
            highlightRef.current.style.transform = `translateY(-${editor.scrollTop}px)`;
            highlightRef.current.style.display = settings.isTypewriter ? 'block' : 'none';
        }

        // Scrolling Logic
        if (settings.isTypewriter || forceCenter) {
            const targetScroll = (currentLineNum - 1) * lineHeight + paddingTop - (editor.clientHeight / 2) + (lineHeight / 2);
            if (Math.abs(editor.scrollTop - targetScroll) > 1 || forceCenter) {
                editor.scrollTop = targetScroll;
            }
        }
    };

    // Cleanup highlight on disable
    useEffect(() => {
        if (!settings.isTypewriter && highlightRef.current) {
            highlightRef.current.style.display = 'none';
        }
    }, [settings.isTypewriter]);

    // Handle Input
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setContent(val);
        updateLineNumbers(val);
        updateTypewriterWrapper();

        if (activeTabId) {
            // Debounce store update logic should be here or in a hook
            // For now direct update (might need optimization)
            updateTab(activeTabId, { content: val });
        }
    };

    const handleKeyDown = () => {
        if (activeTabId) {
            // updateTab(activeTabId, { cursorPos: e.currentTarget.selectionStart });
        }
        updateTypewriterWrapper();
    }

    const handleClick = () => {
        updateTypewriterWrapper();
    }

    if (!activeTab && tabs.length > 0) return null; // Should activate something

    return (
        <div
            id="editor-container"
            className={`flex flex-row relative h-full bg-transparent ${settings.isPreviewMode ? 'hidden' : ''}`}
        >
            <div ref={highlightRef} className="line-highlight" />

            {settings.showLineNumbers && (
                <div ref={gutterRef} className="line-numbers-gutter" style={{ display: 'block' }} />
            )}

            <textarea
                ref={editorRef}
                id="editor"
                className="flex-1 w-full h-full p-10 resize-none border-none outline-none bg-transparent text-inherit font-mono text-[1.1rem] leading-[30px] whitespace-pre-wrap"
                placeholder="Start typing..."
                spellCheck={false}
                defaultValue={content}
                onScroll={handleScroll}
                onInput={handleInput}
                onKeyDown={handleKeyDown}
                onClick={handleClick}
                // Key forces remount on tab switch to reset uncontrolled value
                key={activeTabId || 'empty'}
            />
        </div>
    );
};
