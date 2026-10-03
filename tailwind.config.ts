import type { Config } from 'tailwindcss'
import * as flowbite from 'flowbite-react/tailwind'

export default {
    darkMode: 'media',
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        flowbite.content()
    ],
    theme: {
        extend: {
            fontFamily: {
                display: [ 'system-ui', '-apple-system', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif' ],
                body: [ 'system-ui', '-apple-system', '"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'sans-serif' ],
                // Latin serif for numbers, prices and the wordmark; CJK falls back to the system serif
                serif: [ 'var(--font-newsreader)', '"Songti SC"', '"STSong"', '"Noto Serif CJK SC"', '"Source Han Serif SC"', 'serif' ]
            },
            colors: {
                'coffee-1': '#f6f1e9',
                'coffee-2': '#d79771',
                'coffee-3': '#b05b3b',
                'coffee-4': '#241a14',
                // Paper
                cream: {
                    DEFAULT: '#f6f1e9',
                    100: '#eee6d8',
                    200: '#e0d5c3',
                    300: '#cbbca5'
                },
                // Ink
                espresso: {
                    DEFAULT: '#241a14',
                    500: '#6e6056',
                    700: '#211914',
                    900: '#16100c'
                },
                // Brick red from the logo's latte art
                caramel: {
                    DEFAULT: '#a63a1d',
                    50: '#f7e9e2',
                    100: '#eaa58a',
                    500: '#a63a1d',
                    600: '#8c3017',
                    700: '#6f2512'
                },
                leaf: '#3d6b4f'
            },
            borderRadius: {
                DEFAULT: '0.375rem'
            },
            boxShadow: {
                card: 'none',
                lift: '0 12px 32px -12px rgba(36, 26, 20, 0.25)'
            }
        }
    },
    plugins: [
        flowbite.plugin()
    ]
} satisfies Config
