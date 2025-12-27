import React, { useEffect, useState } from 'react';
import { X, Copy, Check } from 'lucide-react';
import { encodeToUrl, encryptText } from '../../utils/persistence';

export function ShareModal({ isOpen, onClose, state }) {
    const [shareUrl, setShareUrl] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setCopied(false);
            return;
        }

        const generateLink = async () => {
            // We need to bundle the state exactly like save does
            // To ensure privacy, maybe we only share the Active Tab? 
            // Or the whole state? Legacy calls "Share Link" and says "The URL contains your content".
            // It uses the same encoding.
            // If the user has encryption on, they probably don't want to share a readable link easily unless they share password?
            // Legacy just dumps current hash.

            // To match legacy behavior exactly:
            // "The URL contains your content. Copy it below."
            // So it's merely the current window URL with the hash.

            setShareUrl(window.location.href);
        };
        generateLink();
    }, [isOpen]);

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-ez-bg border border-ez-border rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-ez-text">Share Link</h3>
                    <button onClick={onClose} className="text-ez-meta hover:text-ez-text transition">
                        <X size={20} />
                    </button>
                </div>
                <p className="text-ez-meta text-sm mb-4">The URL contains your content (state is stored in the hash). Copy it below:</p>

                <div className="relative mb-6">
                    <textarea
                        readOnly
                        className="w-full h-24 bg-black/20 border border-ez-border rounded p-3 text-ez-accent text-xs font-mono outline-none resize-none break-all"
                        value={shareUrl}
                    />
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-ez-meta hover:text-ez-text">Close</button>
                    <button
                        onClick={handleCopy}
                        className={`px-6 py-2 rounded text-white transition flex items-center gap-2 ${copied ? 'bg-green-600' : 'bg-ez-accent hover:opacity-90'}`}
                    >
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
                    </button>
                </div>
            </div>
        </div>
    );
}
