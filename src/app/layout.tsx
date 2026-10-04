import type { Metadata } from 'next'
import '@fontsource/zcool-kuaile'
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

// Flowbite components restyled as cartoon stickers. See docs/DESIGN.md.
const press = 'shadow-toon-sm enabled:hover:-translate-y-px enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none'
const customTheme: CustomFlowbiteTheme = {
    button: {
        base: 'group relative flex items-stretch justify-center p-0.5 text-center font-toon transition-[transform,box-shadow,background-color] duration-100 focus:z-10 focus:outline-none',
        color: {
            warning: `border-toon border-ink bg-butter text-[#4a2511] focus:ring-4 focus:ring-butter/40 enabled:hover:bg-[#ffd36b] ${press}`,
            yellow: `border-toon border-ink bg-paper text-ink focus:ring-4 focus:ring-butter/40 enabled:hover:bg-cream ${press}`,
            gray: `border-toon border-ink/30 bg-paper text-ink focus:ring-4 focus:ring-butter/40 enabled:hover:border-ink enabled:hover:bg-cream`,
            failure: `border-toon border-ink bg-tomato text-white focus:ring-4 focus:ring-tomato/30 ${press}`,
            success: `border-toon border-ink bg-mint text-[#1f3d2a] focus:ring-4 focus:ring-mint/30 ${press}`
        },
        disabled: 'cursor-not-allowed opacity-45'
    },
    badge: {
        root: {
            base: 'flex h-fit items-center gap-1 font-semibold border-2 border-ink',
            color: {
                warning: 'bg-butter text-[#4a2511]',
                yellow: 'bg-paper text-ink',
                success: 'bg-mint text-[#1f3d2a]',
                failure: 'bg-tomato text-white',
                info: 'bg-whale text-[#163746]',
                gray: 'bg-cream text-ink'
            }
        }
    },
    textInput: {
        field: {
            input: {
                base: 'block w-full border-toon disabled:cursor-not-allowed disabled:opacity-50',
                colors: {
                    gray: 'border-ink/40 bg-paper text-ink placeholder-ink/40 focus:border-ink focus:ring-butter/50',
                    failure: 'border-tomato bg-paper text-ink placeholder-ink/40 focus:border-tomato focus:ring-tomato/30',
                    success: 'border-mint bg-paper text-ink placeholder-ink/40 focus:border-mint focus:ring-mint/30'
                },
                withAddon: {
                    off: 'rounded-xl'
                }
            }
        }
    },
    toggleSwitch: {
        toggle: {
            checked: {
                color: {
                    yellow: 'border-ink bg-butter',
                    red: 'border-ink bg-tomato'
                }
            }
        }
    },
    modal: {
        content: {
            inner: 'relative flex max-h-[90dvh] flex-col toon rounded-[1.6rem] pop-in'
        },
        header: {
            base: 'flex items-start justify-between rounded-t-[1.6rem] border-b-2 border-dashed border-ink/25 p-5',
            title: 'font-toon text-xl text-ink'
        },
        footer: {
            base: 'flex items-center space-x-3 rounded-b-[1.6rem] border-t-2 border-dashed border-ink/25 p-5'
        }
    },
    alert: {
        base: 'flex flex-col gap-2 p-4 text-sm border-toon border-ink',
        color: {
            green: 'bg-mint/40 text-ink',
            yellow: 'bg-butter/40 text-ink',
            warning: 'bg-butter/40 text-ink',
            failure: 'bg-tomato/25 text-ink'
        }
    },
    sidebar: {
        root: {
            inner: 'h-full overflow-y-auto overflow-x-hidden bg-paper px-3 py-4 border-r-toon border-ink'
        },
        item: {
            base: 'flex items-center justify-center rounded-xl p-2 text-base font-normal text-ink hover:bg-butter/40',
            icon: {
                base: 'h-6 w-6 flex-shrink-0 text-ink transition duration-75'
            },
            label: 'bg-tomato text-white'
        },
        collapse: {
            button: 'group flex w-full items-center rounded-xl p-2 text-base font-normal text-ink transition duration-75 hover:bg-butter/40',
            icon: {
                base: 'h-6 w-6 text-ink transition duration-75',
                open: {
                    on: 'text-ink'
                }
            }
        },
        cta: {
            base: 'relative mt-6 rounded-2xl border-toon border-ink bg-butter/30 p-4',
            color: {
                yellow: 'bg-butter/30'
            }
        }
    },
    tabs: {
        tablist: {
            tabitem: {
                base: 'flex items-center justify-center rounded-t-lg p-4 text-sm font-medium first:ml-0 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50',
                variant: {
                    underline: {
                        base: 'rounded-t-lg',
                        active: {
                            on: 'active rounded-t-lg border-b-[3px] border-ink text-ink',
                            off: 'border-b-[3px] border-transparent text-ink/60 hover:border-ink/30 hover:text-ink'
                        }
                    }
                }
            }
        }
    },
    pagination: {
        pages: {
            selector: {
                active: 'bg-butter text-[#4a2511] font-bold'
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
        <NextTopLoader showSpinner={false} color="#e8603c"/>
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
