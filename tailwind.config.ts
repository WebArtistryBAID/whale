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
                display: [ 'system-ui', '-apple-system', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif' ],
                body: [ 'system-ui', '-apple-system', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif' ],
                // Rounded cartoon face for headings, names and prices (self-hosted, OFL)
                toon: [ '"ZCOOL KuaiLe"', '"PingFang SC"', '"Microsoft YaHei"', 'sans-serif' ]
            },
            colors: {
                // Colours are CSS variables so dark mode can swap the whole palette (see globals.css)
                ink: 'rgb(var(--ink) / <alpha-value>)',
                cream: 'rgb(var(--cream) / <alpha-value>)',
                paper: 'rgb(var(--paper) / <alpha-value>)',
                butter: 'rgb(var(--butter) / <alpha-value>)',
                latte: 'rgb(var(--latte) / <alpha-value>)',
                tomato: 'rgb(var(--tomato) / <alpha-value>)',
                whale: 'rgb(var(--whale) / <alpha-value>)',
                mint: 'rgb(var(--mint) / <alpha-value>)',
                blush: 'rgb(var(--blush) / <alpha-value>)',
                'coffee-1': 'rgb(var(--cream) / <alpha-value>)',
                'coffee-2': '#d79771',
                'coffee-3': '#b05b3b',
                'coffee-4': '#753422'
            },
            borderWidth: {
                toon: '2.5px'
            },
            boxShadow: {
                toon: '4px 4px 0 0 rgb(var(--ink))',
                'toon-sm': '2px 2px 0 0 rgb(var(--ink))',
                'toon-lg': '6px 6px 0 0 rgb(var(--ink))'
            }
        }
    },
    plugins: [
        flowbite.plugin()
    ]
} satisfies Config
