import React, { useEffect, useRef } from 'react';
import { useStore } from '../store';
import { findItemById } from '../utils/tabs';
import { marked } from 'marked';
import hljs from 'highlight.js';
import mermaid from 'mermaid';
// @ts-ignore
import renderMathInElement from 'katex/dist/contrib/auto-render';
import 'katex/dist/katex.min.css';

// Configure marked
marked.setOptions({
    // @ts-ignore
    highlight: function (code: string, lang: string) {
        if (lang && hljs.getLanguage(lang)) {
            return hljs.highlight(code, { language: lang }).value;
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

mermaid.initialize({ startOnLoad: false, theme: 'dark', securityLevel: 'loose' });

export const Preview: React.FC = () => {
    const { settings, activeTabId, tabs } = useStore();
    const previewRef = useRef<HTMLDivElement>(null);

    const activeTab = activeTabId ? findItemById(activeTabId, tabs) : null;
    const content = activeTab?.content || "";

    useEffect(() => {
        if (settings.isPreviewMode && previewRef.current) {
            // Render basic markdown
            previewRef.current.innerHTML = marked.parse(content) as string;

            // Render Math (Katex)
            renderMathInElement(previewRef.current, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$', right: '$', display: false }
                ],
                throwOnError: false
            });

            // Render Mermaid
            const mermaidBlocks = previewRef.current.querySelectorAll('.language-mermaid');
            mermaidBlocks.forEach((block, index) => {
                const id = `mermaid-${index}`;
                const graphDefinition = block.textContent || "";
                const container = document.createElement('div');
                container.className = 'mermaid';
                block.replaceWith(container);

                mermaid.render(id, graphDefinition).then(({ svg }) => {
                    container.innerHTML = svg;
                }).catch((e) => {
                    container.innerHTML = `<div class="text-red-500">Error rendering graph</div>`;
                    console.error(e);
                });
            });
        }
    }, [content, settings.isPreviewMode]);

    if (!settings.isPreviewMode) return null;

    return (
        <div id="preview-wrapper" className="w-full h-full overflow-hidden">
            <div
                id="preview"
                ref={previewRef}
                className="prose w-full h-full p-10 overflow-y-auto"
            />
        </div>
    );
};
