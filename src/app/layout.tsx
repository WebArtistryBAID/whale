import type { Metadata } from 'next'
import './globals.css'
import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'


const notoSerif = Noto_Serif_SC({
    subsets: [ 'latin', 'latin-ext' ],
    variable: '--font-noto-serif-sc'
})

const notoSans = Noto_Sans_SC({
    subsets: [ 'latin', 'latin-ext' ],
    variable: '--font-noto-sans-sc'
})

export const metadata: Metadata = {
    title: 'Whale Cafe',
    description: 'The ordering management platform for Whale Cafe'
}

const customTheme: CustomFlowbiteTheme = {
    sidebar: {
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden rounded bg-yellow-100 px-3 py-4 dark:bg-yellow-800'
        },
        item: {
            base: 'flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-yellow-200 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-yellow-500 transition duration-75 dark:text-yellow-400'
            },
            label: 'bg-yellow-400 dark:bg-yellow-500 dark:text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-lg p-2 text-base font-normal text-gray-900 transition duration-75 hover:bg-yellow-200 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 text-yellow-500 transition duration-75 dark:text-yellow-400',
                open: {
                    on: 'text-yellow-900'
                }
            }
        }
    }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            <ThemeModeScript mode="auto"/>
        </head>
        <body
            className={`${notoSerif.variable} ${notoSans.variable} antialiased`}
        >
        <NextTopLoader showSpinner={false} color="#ff6900"/>
        <Flowbite theme={{ theme: customTheme }}>
            {children}
        </Flowbite>
        <p aria-hidden className="fixed bottom-2 right-2 secondary text-xs"><a
            href="https://beian.miit.gov.cn">{process.env.BOTTOM_TEXT}</a></p>
        </body>
        </html>
    )
}
