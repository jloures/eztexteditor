import React, { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../store/useAppStore';
import type { FileSystemItem } from '../../store/types';

export const SearchModal: React.FC = () => {
    const { items, closeModal, activateItem } = useAppStore();
    const [query, setQuery] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();
    }, []);

    // Flatten logic
    const getAllItems = (nodes: FileSystemItem[]): FileSystemItem[] => {
        let result: FileSystemItem[] = [];
        for (const node of nodes) {
            result.push(node);
            if (node.children) {
                result = result.concat(getAllItems(node.children));
            }
        }
        return result;
    };

    const allItems = getAllItems(items).filter(i => i.type === 'note'); // Only search notes for now

    const filtered = allItems.filter(item =>
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(query.toLowerCase()))
    );

    const handleSelect = (id: string) => {
        activateItem(id);
        closeModal();
    };

    return (
        <div id="searchModal" className="fixed inset-0 modal-overlay z-50 flex items-start justify-center pt-20" onClick={closeModal}>
            <div className="bg-[#1e1e1e] rounded-xl w-full max-w-2xl border border-gray-800 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                    <i className="fas fa-search text-gray-500"></i>
                    <input
                        ref={inputRef}
                        type="text"
                        className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600 font-mono"
                        placeholder="Search files..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Escape') closeModal();
                            if (e.key === 'Enter' && filtered.length > 0) handleSelect(filtered[0].id);
                        }}
                    />
                    <div className="text-xs text-gray-600 border border-gray-700 px-2 py-1 rounded">ESC to close</div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {filtered.length === 0 ? (
                        <div className="p-4 text-center text-gray-500 text-sm">No results found</div>
                    ) : (
                        filtered.map(item => (
                            <div
                                key={item.id}
                                className="search-item flex items-center justify-between group"
                                onClick={() => handleSelect(item.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-file-alt text-gray-500 group-hover:text-blue-400"></i>
                                    <span className="text-gray-300 group-hover:text-white">{item.title}</span>
                                </div>
                                <span className="text-xs text-gray-600 font-mono">Note</span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
