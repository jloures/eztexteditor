import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';

interface PreviewPaneProps {
    content: string;
}

export const PreviewPane: React.FC<PreviewPaneProps> = ({ content }) => {
    return (
        <div className="prose lg:prose-xl max-w-none">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeKatex]}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
};
