import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'
import Toaster from '@/app/core-components/Toaster'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import { Libre_Baskerville } from 'next/font/google'


export const metadata: Metadata = {
    title: 'The Whale Café',
    description: 'The ordering management platform for Whale Cafe'
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const font = Libre_Baskerville({ weight: [ '400', '700' ], subsets: [ 'latin' ] })

const customTheme: CustomFlowbiteTheme = {
    sidebar: {
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden rounded bg-yellow-50 px-3 py-4 dark:bg-yellow-800'
        },
        item: {
            base: 'flex items-center justify-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-yellow-100 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-yellow-400 transition duration-75 dark:text-yellow-300'
            },
            label: 'bg-yellow-300 dark:bg-yellow-500 text-white dark:text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-lg p-2 text-base font-normal text-gray-900 transition duration-75 hover:bg-yellow-100 dark:text-white dark:hover:bg-yellow-700',
            icon: {
                base: 'h-6 w-6 text-yellow-400 transition duration-75 dark:text-yellow-300',
                open: {
                    on: 'text-yellow-400 dark:text-yellow-300'
                }
            }
        }
    },
    tabs: {
        tablist: {
            tabitem: {
                base: 'flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:ring-4 focus:ring-yellow-200 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500',
                variant: {
                    underline: {
                        base: 'rounded-t-lg',
                        active: {
                            on: 'active rounded-t-lg border-b-2 border-yellow-500 text-yellow-500 dark:border-yellow-400 dark:text-yellow-400'
                        }
                    }
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
            <link rel="icon" href="/assets/logo.png" sizes="any"/>
        </head>
        <body className="antialiased">
        <NextTopLoader showSpinner={false} color="#ff6900"/>
        <Flowbite theme={{ theme: customTheme }}>
            {children}
        </Flowbite>
        <CookiesBoundary><Toaster/></CookiesBoundary>
        <p aria-hidden className="fixed bottom-2 right-2 secondary text-xs"><a
            href="https://beian.miit.gov.cn">{process.env.BOTTOM_TEXT}</a></p>
        </body>
        </html>
    )
}
