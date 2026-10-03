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
                display: [ 'system-ui', 'sans-serif' ],
                body: [ 'system-ui', 'sans-serif' ]
            },
            colors: {
                'coffee-1': '#fbf6ef',
                'coffee-2': '#d79771',
                'coffee-3': '#b05b3b',
                'coffee-4': '#3d2418',
                cream: {
                    DEFAULT: '#fbf6ef',
                    100: '#f6ede1',
                    200: '#efe0cc'
                },
                espresso: {
                    DEFAULT: '#3d2418',
                    700: '#2c1911',
                    900: '#1c110c'
                },
                caramel: {
                    DEFAULT: '#c06a2b',
                    50: '#fdf4ec',
                    100: '#fae4d1',
                    500: '#c06a2b',
                    600: '#a85a22',
                    700: '#8c4a1c'
                }
            },
            boxShadow: {
                card: '0 1px 2px rgba(61, 36, 24, 0.04), 0 4px 16px rgba(61, 36, 24, 0.06)',
                lift: '0 2px 4px rgba(61, 36, 24, 0.06), 0 12px 32px rgba(61, 36, 24, 0.12)'
            }
        }
    },
    plugins: [
        flowbite.plugin()
    ]
} satisfies Config
