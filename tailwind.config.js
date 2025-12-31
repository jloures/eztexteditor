/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                bg: 'var(--bg-color)',
                text: 'var(--text-color)',
                meta: 'var(--meta-color)',
                accent: 'var(--accent-color)',
                border: 'var(--border-color)',
            },
            typography: (theme) => ({
                DEFAULT: {
                    css: {
                        '--tw-prose-body': 'var(--text-color)',
                        '--tw-prose-headings': 'var(--text-color)',
                        '--tw-prose-links': 'var(--accent-color)',
                        '--tw-prose-code': '#f472b6',
                        '--tw-prose-pre-bg': '#1e1e1e',
                        '--tw-prose-quotes': '#9ca3af',
                    },
                },
            }),
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
