import React, { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';

export default function Editor({ activeTabId, tabs, actions, settings }) {
    // Find active tab helper
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

    if (!currentTab) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center text-ez-meta bg-ez-bg">
                <p>Select a note to view</p>
            </div>
        );
    }

    const { content } = currentTab;
    const showPreview = settings?.isPreviewMode;

    const renderPreview = () => {
        const rawMarkup = marked.parse(content || '');
        const cleanMarkup = DOMPurify.sanitize(rawMarkup);
        return { __html: cleanMarkup };
    };

    return (
        <div className="flex-1 relative h-full flex bg-ez-bg text-ez-text overflow-hidden">

            {!showPreview ? (
                <textarea
                    className="w-full h-full p-10 bg-transparent resize-none outline-none font-mono leading-relaxed text-lg text-ez-text"
                    value={content || ''}
                    onChange={(e) => actions.updateTabContent(activeTabId, e.target.value)}
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
