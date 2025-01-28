import type {Config} from 'tailwindcss'
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
                display: ['Noto Serif', 'system-ui', 'sans-serif'],
                body: ['Noto Sans', 'system-ui', 'sans-serif']
            }
        }
    },
    plugins: [
        flowbite.plugin()
    ]
} satisfies Config
