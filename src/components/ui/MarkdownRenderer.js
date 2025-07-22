import React from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * A component to render Markdown text into styled HTML.
 * It can apply different style presets for various contexts.
 * @param {object} props - { content: string, preset?: 'story' | 'chat' }
 */
export const MarkdownRenderer = ({ content, preset = 'story' }) => {
    if (!content) return null;

    // Define style presets
    const presets = {
        story: {
            p: "text-lg leading-9 text-[var(--text-primary)] whitespace-pre-wrap font-serif my-4",
            h1: "text-3xl font-bold font-serif mt-6 mb-3 border-b border-[var(--border-primary)] pb-2",
            h2: "text-2xl font-bold font-serif mt-5 mb-2",
            h3: "text-xl font-bold font-serif mt-4 mb-1",
            strong: "font-bold",
            em: "italic",
            ul: "list-disc list-inside my-4 pl-4 font-serif text-lg",
            ol: "list-decimal list-inside my-4 pl-4 font-serif text-lg",
            li: "mb-2",
            blockquote: "border-l-4 border-[var(--accent-primary)] pl-4 my-4 text-[var(--text-secondary)] italic",
        },
        chat: {
            p: "m-0 whitespace-pre-wrap",
            strong: "font-bold",
            em: "italic",
            ul: "list-disc list-inside my-2 pl-2",
            ol: "list-decimal list-inside my-2 pl-2",
            li: "mb-1",
            blockquote: "border-l-2 border-[var(--accent-primary)]/50 pl-2 my-1 text-[var(--text-secondary)] italic",
        }
    };

    const selectedPreset = presets[preset] || presets.story;

    // Dynamically create component mapping from the selected preset
    const components = Object.keys(selectedPreset).reduce((acc, key) => {
        acc[key] = ({ node, ...props }) => React.createElement(key, { className: selectedPreset[key], ...props });
        return acc;
    }, {});

    return (
        <ReactMarkdown components={components}>
            {content}
        </ReactMarkdown>
    );
};