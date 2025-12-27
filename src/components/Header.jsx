import React from 'react';
import { Ghost, Expand, Type, Search, Plus, Eye, Share2, Info, Lock, Trash2 } from 'lucide-react';

export default function Header() {
    return (
        <header className="flex justify-between items-center px-6 py-4 border-b border-ez-border h-[60px] bg-ez-bg">
            <div className="flex items-center gap-4 text-xs font-mono text-ez-meta">
                <div>0 WORDS</div>
                <div className="hidden text-blue-400 font-bold">LOCKED</div>
                <div className="px-2 py-0.5 rounded bg-gray-800 text-gray-300">EDIT</div>
            </div>
            <div className="flex items-center gap-4 text-ez-meta">
                {/* Buttons */}
                <Ghost className="w-4 h-4 hover:text-ez-text cursor-pointer" />
                <Expand className="w-4 h-4 hover:text-ez-text cursor-pointer" />
                <Eye className="w-4 h-4 hover:text-ez-text cursor-pointer" />
                <Trash2 className="w-4 h-4 hover:text-red-400 cursor-pointer" />
            </div>
        </header>
    );
}
