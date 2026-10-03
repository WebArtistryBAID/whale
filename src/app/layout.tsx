import type { Metadata } from 'next'
import './globals.css'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'
import Toaster from '@/app/core-components/Toaster'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import localFont from 'next/font/local'

const newsreader = localFont({
    src: './fonts/newsreader-latin.woff2',
    variable: '--font-newsreader',
    display: 'swap'
})

export const metadata: Metadata = {
    title: 'The Whale Café',
    description: 'The ordering management platform for Whale Cafe'
}

const customTheme: CustomFlowbiteTheme = {
    button: {
        base: 'group relative flex items-stretch justify-center p-0.5 text-center font-medium transition-colors focus:z-10 focus:outline-none',
        color: {
            warning: 'border border-transparent bg-caramel text-white focus:ring-2 focus:ring-caramel/30 enabled:hover:bg-caramel-600',
            yellow: 'border border-transparent bg-espresso text-cream focus:ring-2 focus:ring-espresso/30 enabled:hover:bg-black dark:bg-cream dark:text-espresso dark:enabled:hover:bg-white',
            gray: 'border border-cream-300 bg-transparent text-espresso focus:ring-2 focus:ring-espresso/10 enabled:hover:border-espresso enabled:hover:bg-cream-100 dark:border-white/20 dark:text-stone-200 dark:enabled:hover:bg-white/5'
        },
        pill: {
            off: 'rounded-md',
            on: 'rounded-md'
        },
        disabled: 'cursor-not-allowed opacity-40'
    },
    badge: {
        root: {
            color: {
                warning: 'bg-caramel-50 text-caramel-700 group-hover:bg-caramel-50 dark:bg-caramel/20 dark:text-caramel-100',
                yellow: 'bg-cream-100 text-espresso group-hover:bg-cream-200 dark:bg-white/10 dark:text-stone-200'
            }
        }
    },
    textInput: {
        field: {
            input: {
                colors: {
                    gray: 'border-cream-300 bg-[#fffdf9] text-espresso placeholder-espresso-500/60 focus:border-espresso focus:ring-espresso/20 dark:border-white/20 dark:bg-espresso-700 dark:text-white dark:focus:border-stone-300'
                },
                withAddon: {
                    off: 'rounded-md'
                }
            }
        }
    },
    modal: {
        content: {
            inner: 'relative flex max-h-[90dvh] flex-col rounded-lg bg-[#fffdf9] border border-cream-200 shadow-lift dark:bg-espresso-700 dark:border-white/10'
        },
        header: {
            base: 'flex items-start justify-between rounded-t-lg border-b border-cream-200 p-5 dark:border-white/10'
        },
        footer: {
            base: 'flex items-center space-x-2 rounded-b-lg border-t border-cream-200 p-5 dark:border-white/10'
        }
    },
    sidebar: {
        cta: {
            base: 'relative mt-6 rounded-lg border border-cream-200 bg-[#fffdf9] p-4 dark:border-white/10 dark:bg-espresso-700',
            color: {
                yellow: 'bg-[#fffdf9] dark:bg-espresso-700'
            }
        },
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden bg-cream px-3 py-4 border-r border-cream-200 dark:border-white/10 dark:bg-espresso-900'
        },
        item: {
            base: 'flex items-center justify-center rounded-md p-2 text-base font-normal text-espresso hover:bg-cream-100 dark:text-white dark:hover:bg-white/5',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-caramel transition duration-75 dark:text-caramel-100'
            },
            label: 'bg-caramel text-white dark:text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-md p-2 text-base font-normal text-espresso transition duration-75 hover:bg-cream-100 dark:text-white dark:hover:bg-white/5',
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
        <html lang="en" suppressHydrationWarning className={newsreader.variable}>
        <head>
            <ThemeModeScript mode="auto"/>
            <link rel="icon" href="/assets/logo.png" sizes="any"/>
            <meta name="theme-color" content="#f6f1e9"/>
        </head>
        <body className="antialiased">
        <NextTopLoader showSpinner={false} color="#a63a1d"/>
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
