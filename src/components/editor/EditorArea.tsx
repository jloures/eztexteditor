import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { PreviewPane } from './PreviewPane';
import { LineNumbers } from './LineNumbers';

// Helper to find content by ID (duplicated logic from store, but needed for select)
const useActiveContent = () => {
    const { items, activeTabId } = useAppStore();

    // Better approach: Select the item object
    const findItem = (items: any[], id: string): any => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findItem(item.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    if (!activeTabId) return '';
    const item = findItem(items, activeTabId);
    return item ? item.content || '' : '';
};

export const EditorArea: React.FC = () => {
    const { activeTabId, updateContent, viewSettings } = useAppStore();
    const content = useActiveContent();
    const { isPreviewMode, isTypewriterMode, showLineNumbers } = viewSettings;
    const [scrollTop, setScrollTop] = useState(0);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (activeTabId) {
            updateContent(activeTabId, e.target.value);
        }
    };

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        setScrollTop(e.currentTarget.scrollTop);
    };

    return (
        <div id="editor-container" className={isTypewriterMode ? 'typewriter-active' : ''}>
            {/* Wrapper for Line Numbers to handle independent scrolling if needed, or synced */}
            {showLineNumbers && !isPreviewMode && (
                <div className="relative overflow-hidden" style={{ width: '60px', flexShrink: 0 }}>
                    <LineNumbers content={content} scrollTop={scrollTop} />
                </div>
            )}

            <div id="line-highlight" className="line-highlight"></div>

            {!isPreviewMode ? (
                <textarea
                    id="editor"
                    placeholder="Start typing..."
                    spellCheck={false}
                    value={content}
                    onChange={handleChange}
                    onScroll={handleScroll}
                    disabled={!activeTabId}
                ></textarea>
            ) : (
                <div id="preview-wrapper" className="flex-1" style={{ height: '100%', overflowY: 'auto', padding: '40px' }}>
                    <div id="preview">
                        <PreviewPane content={content} />
                    </div>
                </div>
            )}
        </div>
    );
};
