import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import type { Tab } from '../../types';
import { FaFileAlt, FaFolder } from 'react-icons/fa';

export const SearchModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
    const { tabs, setActiveTabId } = useStore();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<{ item: Tab, matches: string[] }[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
            setQuery("");
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query) {
            setResults([]);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const newResults: { item: Tab, matches: string[] }[] = [];

        const searchRec = (items: Tab[]) => {
            items.forEach(item => {
                const matches: string[] = [];
                if (item.title.toLowerCase().includes(lowerQuery)) {
                    matches.push("Title match");
                }
                if (item.content && item.content.toLowerCase().includes(lowerQuery)) {
                    // Extract snippet
                    const idx = item.content.toLowerCase().indexOf(lowerQuery);
                    const start = Math.max(0, idx - 20);
                    const end = Math.min(item.content.length, idx + 40);
                    matches.push("..." + item.content.substring(start, end) + "...");
                }

                if (matches.length > 0) {
                    newResults.push({ item, matches });
                }

                if (item.children) searchRec(item.children);
            });
        };

        searchRec(tabs);
        setResults(newResults);
        setSelectedIndex(0);
    }, [query, tabs]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            if (results[selectedIndex]) {
                setActiveTabId(results[selectedIndex].item.id);
                onClose();
            }
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 modal-overlay flex items-start justify-center pt-20 z-50">
            <div className="bg-[#1e1e1e] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden border border-[var(--border-color)]">
                <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
                    <i className="fas fa-search text-gray-400"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search files..."
                        className="bg-transparent border-none outline-none text-white text-lg w-full placeholder-gray-600"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <kbd className="hidden sm:inline-block px-2 py-1 text-xs text-gray-500 bg-gray-800 rounded border border-gray-700">ESC</kbd>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {results.length === 0 && query && (
                        <div className="text-center text-gray-500 py-8">No results found</div>
                    )}
                    {results.map((res, idx) => (
                        <div
                            key={res.item.id}
                            className={`p-3 rounded-lg cursor-pointer flex items-start gap-3 ${idx === selectedIndex ? 'bg-blue-900/30 border border-blue-500/50' : 'hover:bg-gray-800/50 border border-transparent'}`}
                            onClick={() => { setActiveTabId(res.item.id); onClose(); }}
                        >
                            <div className="mt-1 text-gray-400">
                                {res.item.type === 'folder' ? <FaFolder /> : <FaFileAlt />}
                            </div>
                            <div>
                                <div className="text-sm font-medium text-gray-200">{res.item.title}</div>
                                <div className="text-xs text-gray-500 mt-1 font-mono">{res.matches[0]}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="bg-[#181818] px-4 py-2 text-xs text-gray-500 border-t border-[var(--border-color)] flex justify-between">
                    <div>
                        <span className="mr-3">Updated: Just now</span>
                        <span>{results.length} matches</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
