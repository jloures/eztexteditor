import React, { useState, useEffect, useRef } from 'react';
import { FileText, CornerDownRight } from 'lucide-react';
import { clsx } from 'clsx';
import { useAppState } from '../../hooks/useAppState'; // Assuming we need types or helpers? No, props passed.

export function SearchModal({ tabs, isOpen, onClose, onNavigate }) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef(null);
    const resultsRef = useRef(null);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    // Search Logic
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const qLower = query.toLowerCase();
        const matches = [];

        const searchRecursive = (items) => {
            items.forEach(item => {
                if (item.type === 'note') {
                    // Title Match
                    if (item.title.toLowerCase().includes(qLower)) {
                        matches.push({
                            id: item.id,
                            title: item.title,
                            type: 'title',
                            score: 10,
                        });
                    }

                    // Content Match
                    if (item.content) {
                        const cLower = item.content.toLowerCase();
                        let pos = cLower.indexOf(qLower);
                        let lastMatchPos = 0;
                        let lineNum = 1;

                        // Find all matches in content (cap at 5 per file to avoid spam)
                        let fileMatches = 0;
                        while (pos !== -1 && fileMatches < 5) {
                            // Calculate line number
                            const segment = item.content.substring(lastMatchPos, pos);
                            lineNum += (segment.match(/\n/g) || []).length;

                            // Extract Snippet
                            const start = Math.max(0, pos - 20);
                            const end = Math.min(item.content.length, pos + query.length + 40);
                            const snippet = item.content.substring(start, end);

                            matches.push({
                                id: item.id,
                                title: item.title,
                                type: 'content',
                                snippet,
                                lineNum,
                                score: 5,
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

    }, [query, tabs]);

    const handleKeyDown = (e) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (results[selectedIndex]) {
                const match = results[selectedIndex];
                onNavigate(match.id); // TODO: Navigate to specific line?
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    // Scroll selected into view
    useEffect(() => {
        if (resultsRef.current && results.length > 0) {
            const el = resultsRef.current.children[selectedIndex];
            if (el) el.scrollIntoView({ block: 'nearest' });
        }
    }, [selectedIndex, results]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-[20vh]" onClick={onClose}>
            <div className="bg-ez-bg border border-ez-border rounded-lg shadow-2xl w-[600px] max-h-[60vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-ez-border flex items-center gap-3">
                    <div className="text-ez-meta"><FileText size={20} /></div>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search notes..."
                        className="flex-1 bg-transparent outline-none text-lg text-ez-text placeholder-ez-meta"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="text-xs text-ez-meta border border-ez-border rounded px-1.5 py-0.5">Esc to close</div>
                </div>

                <div className="overflow-y-auto flex-1 p-2" ref={resultsRef}>
                    {results.length === 0 && query && (
                        <div className="text-center p-4 text-ez-meta">No results found</div>
                    )}
                    {results.map((result, index) => (
                        <div
                            key={`${result.id}-${index}`}
                            className={clsx(
                                "p-3 rounded cursor-pointer mb-1 border border-transparent",
                                index === selectedIndex ? "bg-ez-accent/10 border-ez-accent/50" : "hover:bg-ez-border/50"
                            )}
                            onClick={() => {
                                onNavigate(result.id);
                                onClose();
                            }}
                            onMouseEnter={() => setSelectedIndex(index)}
                        >
                            <div className="flex items-center gap-2 text-sm font-medium text-ez-text">
                                <FileText size={14} className="opacity-50" />
                                <span>{result.title}</span>
                                {result.type === 'content' && <span className="text-ez-meta text-xs ml-auto">Line {result.lineNum}</span>}
                            </div>
                            {result.type === 'content' && (
                                <div className="ml-6 mt-1 text-xs text-ez-meta font-mono truncate">
                                    ...{result.snippet}...
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-2 border-t border-ez-border bg-ez-bg/50 text-xs text-ez-meta flex justify-between px-4">
                    <span>{results.length} results</span>
                    <div className="flex gap-2">
                        <span>↑↓ to navigate</span>
                        <span>↵ to select</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
