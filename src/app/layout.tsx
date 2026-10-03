import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'
import Toaster from '@/app/core-components/Toaster'
import CookiesBoundary from '@/app/lib/CookiesBoundary'

export const metadata: Metadata = {
    title: 'The Whale Café',
    description: 'The ordering management platform for Whale Cafe'
}

const customTheme: CustomFlowbiteTheme = {
    button: {
        color: {
            warning: 'border border-transparent bg-caramel text-white shadow-sm focus:ring-4 focus:ring-caramel-100 enabled:hover:bg-caramel-600 dark:focus:ring-caramel-700',
            yellow: 'border border-transparent bg-espresso text-white shadow-sm focus:ring-4 focus:ring-caramel-100 enabled:hover:bg-espresso-700 dark:bg-caramel dark:enabled:hover:bg-caramel-600 dark:focus:ring-caramel-700',
            gray: 'border border-cream-200 bg-white text-espresso focus:ring-4 focus:ring-caramel-100 enabled:hover:border-caramel/40 enabled:hover:bg-caramel-50 dark:border-white/10 dark:bg-transparent dark:text-stone-300 dark:enabled:hover:bg-white/5'
        },
        disabled: 'cursor-not-allowed opacity-40'
    },
    modal: {
        content: {
            inner: 'relative flex max-h-[90dvh] flex-col rounded-3xl bg-white shadow-lift dark:bg-espresso-700'
        },
        header: {
            base: 'flex items-start justify-between rounded-t-3xl border-b border-cream-200 p-5 dark:border-white/10'
        },
        footer: {
            base: 'flex items-center space-x-2 rounded-b-3xl border-t border-cream-200 p-5 dark:border-white/10'
        }
    },
    sidebar: {
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden bg-white px-3 py-4 border-r border-cream-200 dark:border-white/5 dark:bg-espresso-700'
        },
        item: {
            base: 'flex items-center justify-center rounded-xl p-2 text-base font-normal text-espresso hover:bg-caramel-50 dark:text-white dark:hover:bg-white/5',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-caramel transition duration-75 dark:text-caramel-100'
            },
            label: 'bg-caramel text-white dark:text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-xl p-2 text-base font-normal text-espresso transition duration-75 hover:bg-caramel-50 dark:text-white dark:hover:bg-white/5',
            icon: {
                base: 'h-6 w-6 text-caramel transition duration-75 dark:text-caramel-100',
                open: {
                    on: 'text-caramel dark:text-caramel-100'
                }
            }
        }
    },
    tabs: {
        tablist: {
            tabitem: {
                base: 'flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none focus:ring-4 focus:ring-caramel-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:dark:text-gray-500',
                variant: {
                    underline: {
                        base: 'rounded-t-lg',
                        active: {
                            on: 'active rounded-t-lg border-b-2 border-caramel text-caramel dark:border-caramel-100 dark:text-caramel-100'
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
            <meta name="theme-color" content="#3d2418"/>
        </head>
        <body className="antialiased">
        <NextTopLoader showSpinner={false} color="#c06a2b"/>
        <Flowbite theme={{ theme: customTheme }}>
            {children}
        </Flowbite>
        <CookiesBoundary><Toaster/></CookiesBoundary>
        <p aria-hidden className="fixed bottom-2 right-2 secondary text-xs pointer-events-auto"><a
            href="https://beian.miit.gov.cn">{process.env.BOTTOM_TEXT}</a></p>
        </body>
        </html>
    )
}
