import React, { useMemo } from 'react';

interface LineNumbersProps {
    content: string;
    scrollTop: number;
}

export const LineNumbers: React.FC<LineNumbersProps> = ({ content, scrollTop }) => {
    const lines = useMemo(() => {
        return content.split('\n').length;
    }, [content]);

    return (
        <div
            className="line-numbers-gutter"
            style={{
                display: 'block',
                transform: `translateY(-${scrollTop}px)` // Naive sync, might need better approach if parent scrolls
            }}
        >
            {Array.from({ length: Math.max(1, lines) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
            ))}
        </div>
    );
};
