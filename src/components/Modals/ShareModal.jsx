import React, { useEffect, useState } from 'react';

export function ShareModal({ isOpen, onClose }) {
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setShareUrl(window.location.href);
            setCopied(false);
        }
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-ez-bg border border-ez-border rounded-2xl shadow-2xl w-full max-w-lg p-8 relative animate-in zoom-in duration-200"
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-ez-text tracking-tight">Share Notebook</h3>
                    <i className="fas fa-times cursor-pointer text-ez-meta hover:text-ez-text transition text-lg p-1" onClick={onClose} />
                </div>

                <p className="text-ez-meta text-sm mb-6 leading-relaxed">
                    The URL contains your entire notebook state in the hash. Copy it below to share or save your session:
                </p>

                <div className="relative mb-8 group">
                    <textarea
                        readOnly
                        className="w-full h-32 bg-black/40 border border-ez-border rounded-xl p-4 text-blue-400 text-[11px] font-mono outline-none resize-none break-all leading-normal transition-all focus:border-blue-500/50"
                        value={shareUrl}
                        onClick={(e) => e.target.select()}
                    />
                    <div className="absolute top-2 right-2 opacity-30 group-hover:opacity-100 transition-opacity">
                        <i className="fas fa-link text-xs" />
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-ez-meta hover:text-ez-text font-bold uppercase text-[10px] tracking-widest transition"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleCopy}
                        className={`px-10 py-2 rounded-full text-white transition-all font-bold uppercase text-[10px] tracking-widest flex items-center gap-3 ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-500'}`}
                    >
                        {copied ? (
                            <><i className="fas fa-check" /> Copied</>
                        ) : (
                            <><i className="fas fa-copy" /> Copy Link</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
