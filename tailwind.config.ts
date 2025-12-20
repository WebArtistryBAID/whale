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
                serif: [ 'Playfair Display', 'serif' ],
                display: [ 'system-ui', 'sans-serif' ],
                body: [ 'system-ui', 'sans-serif' ]
            },
            colors: {
                'coffee-1': '#ffebc9',
                'coffee-2': '#d79771',
                'coffee-3': '#b05b3b',
                'coffee-4': '#753422'
            }
        }
    },
    plugins: [
        flowbite.plugin()
    ]
} satisfies Config
