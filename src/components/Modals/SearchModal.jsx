import React, { useState, useEffect, useRef } from 'react';
import { clsx } from 'clsx';

export function SearchModal({ tabs, isOpen, onClose, onNavigate, modalData, activeTabId }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    const isLocal = modalData?.local === true;

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Search Logic (Match legacy indexing)
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const qLower = query.trim().toLowerCase();
        const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const highlightRegex = new RegExp(`(${escaped})`, 'gi');
        const matches = [];

        const searchRecursive = (items) => {
            items.forEach(item => {
                if (item.type === 'note') {
                    if (isLocal && item.id !== activeTabId) return;

                    // Title Match
                    if (!isLocal && item.title.toLowerCase().includes(qLower)) {
                        matches.push({
                            id: item.id,
                            title: item.title,
                            type: 'title',
                            matchIndex: -1,
                        });
                    }

                    // Content Match
                    if (item.content) {
                        const content = item.content;
                        const cLower = content.toLowerCase();
                        let pos = cLower.indexOf(qLower);
                        let lastMatchPos = 0;
                        let lineNum = 1;
                        let fileMatches = 0;

                        while (pos !== -1 && fileMatches < 500) {
                            const segment = content.substring(lastMatchPos, pos);
                            lineNum += (segment.match(/\n/g) || []).length;

                            const start = Math.max(0, pos - 40);
                            const end = Math.min(content.length, pos + qLower.length + 60);
                            const snippet = content.substring(start, end);

                            matches.push({
                                id: item.id,
                                title: item.title,
                                type: 'content',
                                snippet,
                                lineNum,
                                matchIndex: pos,
                                prefix: start > 0 ? '...' : '',
                                suffix: end < content.length ? '...' : '',
                            });

                            lastMatchPos = pos;
                            pos = cLower.indexOf(qLower, pos + 1);
                            fileMatches++;
                        }
                    }
                } else if (item.children) {
                    searchRecursive(item.children);
                }
            });
        };

        searchRecursive(tabs);
        setResults(matches);
        setSelectedIndex(0);

    }, [query, tabs, isLocal, activeTabId]);

    const highlightText = (text) => {
        const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (!escaped) return text;
        const regex = new RegExp(`(${escaped})`, 'gi');
        return text.replace(regex, '<span class="search-match-highlight">$1</span>');
    };

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            const match = results[selectedIndex === -1 ? 0 : selectedIndex];
            if (match) {
                onNavigate(match.id); // In legacy, it also sets scroll/selection. We handle that in Editor via effect if needed or pass pos.
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-[15vh]" onClick={onClose}>
            <div className="bg-ez-bg border border-ez-border rounded-xl shadow-2xl w-[600px] max-h-[70vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-ez-border flex items-center gap-4">
                    <i className="fas fa-search text-ez-meta text-lg"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={isLocal ? "Search in this note..." : "Search all notes..."}
                        className="flex-1 bg-transparent outline-none text-xl text-ez-text placeholder-ez-meta/50 font-medium"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="text-[10px] text-ez-meta border border-ez-border rounded px-2 py-1 uppercase tracking-widest font-bold opacity-50">Esc</div>
                </div>

                <div className="overflow-y-auto flex-1 p-3" ref={resultsRef}>
                    {results.length === 0 && query && (
                        <div className="text-center p-10 text-ez-meta">
                            <i className="fas fa-info-circle mb-2 text-2xl block opacity-20"></i>
                            No matches found for "{query}"
                        </div>
                    )}
                    {!query && (
                        <div className="text-center p-10 text-ez-meta opacity-30 select-none italic text-sm">
                            Type to begin searching...
                        </div>
                    )}
                    {results.map((result, index) => (
                        <div
                            key={`${result.id}-${index}-${result.matchIndex}`}
                            className={clsx(
                                "search-item p-4 rounded-lg cursor-pointer mb-2 border border-transparent transition-all",
                                index === selectedIndex && "selected"
                            )}
                            onClick={() => {
                                onNavigate(result.id);
                                onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="font-bold text-gray-200 flex items-center gap-2 mb-1">
                                <i className="fas fa-file-alt text-xs opacity-50"></i>
                                <span dangerouslySetInnerHTML={{ __html: result.type === 'title' ? highlightText(result.title) : result.title }} />
                                {result.type === 'content' && <span className="ml-auto text-xs opacity-30">Line {result.lineNum}</span>}
                            </div>
                            {result.type === 'content' && (
                                <div className="text-sm text-gray-500 truncate font-mono mt-1 opacity-80">
                                    <span dangerouslySetInnerHTML={{ __html: result.prefix + highlightText(result.snippet) + result.suffix }} />
                                </div>
                            )}
                            {result.type === 'title' && (
                                <div className="text-[10px] text-blue-400/50 uppercase tracking-tighter font-bold">Match in title</div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-3 border-t border-ez-border bg-black/20 text-[10px] text-ez-meta flex justify-between px-6 font-bold tracking-widest uppercase">
                    <span>{results.length} {results.length === 1 ? 'RESULT' : 'RESULTS'}</span>
                    <div className="flex gap-4 opacity-50">
                        <span>↑↓ Navigate</span>
                        <span>↵ Select</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
