import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'
import Toaster from '@/app/core-components/Toaster'


export const metadata: Metadata = {
    title: 'Whale Cafe',
    description: 'The ordering management platform for Whale Cafe'
}

const customTheme: CustomFlowbiteTheme = {
    sidebar: {
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden rounded bg-yellow-50 px-3 py-4 dark:bg-yellow-800'
        },
        item: {
            base: 'flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-yellow-100 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-yellow-300 transition duration-75 dark:text-yellow-400'
            },
            label: 'bg-yellow-300 dark:bg-yellow-500 text-white dark:text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-lg p-2 text-base font-normal text-gray-900 transition duration-75 hover:bg-yellow-200 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 text-yellow-300 transition duration-75 dark:text-yellow-400',
                open: {
                    on: 'text-yellow-300 dark:text-yellow-400'
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
        <body className="antialiased">
        <NextTopLoader showSpinner={false} color="#ff6900"/>
        <Flowbite theme={{ theme: customTheme }}>
            {children}
        </Flowbite>
        <Toaster/>
        <p aria-hidden className="fixed bottom-2 right-2 secondary text-xs"><a
            href="https://beian.miit.gov.cn">{process.env.BOTTOM_TEXT}</a></p>
        </body>
        </html>
    )
}
