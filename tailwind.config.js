import typography from '@tailwindcss/typography';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'ez-bg': 'var(--bg-color)',
                'ez-text': 'var(--text-color)',
                'ez-meta': 'var(--meta-color)',
                'ez-accent': 'var(--accent-color)',
                'ez-border': 'var(--border-color)',
            },
        },
    },
    darkMode: ['class', '[data-theme="dark"]'],
    plugins: [
        typography,
    ],
}
