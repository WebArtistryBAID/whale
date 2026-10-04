import type { Metadata } from 'next'
import '@fontsource/zcool-kuaile'
import './globals.css'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { CustomFlowbiteTheme, Flowbite, ThemeModeScript } from 'flowbite-react'
import Toaster from '@/app/core-components/Toaster'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import CartHydration from '@/app/core-components/CartHydration'

export const metadata: Metadata = {
    title: 'The Whale Café',
    description: 'The ordering management platform for Whale Cafe'
}

// Flowbite components restyled as cartoon stickers. See docs/DESIGN.md.
const press = 'shadow-toon-sm enabled:hover:-translate-y-px enabled:active:translate-x-[2px] enabled:active:translate-y-[2px] enabled:active:shadow-none'
const customTheme: CustomFlowbiteTheme = {
    button: {
        base: 'group relative flex items-stretch justify-center whitespace-nowrap p-0.5 text-center font-toon transition-[transform,box-shadow,background-color] duration-100 focus:z-10 focus:outline-none',
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
            variant: {
                underline: 'flex-wrap gap-2 pb-1'
            },
            tabitem: {
                base: 'flex items-center justify-center px-4 py-2 text-sm first:ml-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-butter/50 disabled:cursor-not-allowed disabled:opacity-50',
                variant: {
                    underline: {
                        base: 'rounded-full border-toon',
                        active: {
                            on: 'active border-ink bg-butter text-[#4a2511] shadow-toon-sm font-toon',
                            off: 'border-ink/25 bg-paper text-ink/70 hover:border-ink hover:text-ink'
                        }
                    }
                }
            }
        }
    },
    table: {
        root: {
            base: 'w-full text-left text-sm text-ink',
            shadow: 'hidden',
            wrapper: 'relative toon overflow-x-auto'
        },
        head: {
            base: 'group/head text-xs text-ink',
            cell: {
                base: 'bg-butter/50 px-5 py-3 font-toon text-sm font-normal border-b-2 border-ink whitespace-nowrap'
            }
        },
        body: {
            base: 'group/body',
            cell: {
                base: 'px-5 py-3.5'
            }
        },
        row: {
            base: 'group/row border-b-2 border-dashed border-ink/15 last:border-b-0',
            hovered: 'hover:bg-butter/20',
            striped: 'odd:bg-paper even:bg-cream/60'
        }
    },
    breadcrumb: {
        root: {
            base: '',
            list: 'flex flex-wrap items-center gap-y-1'
        },
        item: {
            base: 'group flex items-center',
            chevron: 'mx-1.5 h-3.5 w-3.5 text-ink/40 group-first:hidden',
            href: {
                off: 'flex items-center text-sm text-ink/60',
                on: 'flex items-center text-sm text-ink/60 underline decoration-butter decoration-2 underline-offset-4 hover:text-ink hover:decoration-tomato'
            },
            icon: 'mr-1.5 h-4 w-4'
        }
    },
    select: {
        field: {
            select: {
                base: 'block w-full border-toon disabled:cursor-not-allowed disabled:opacity-50',
                withAddon: {
                    off: 'rounded-xl'
                },
                colors: {
                    gray: 'border-ink/40 bg-paper text-ink focus:border-ink focus:ring-butter/50'
                }
            }
        }
    },
    textarea: {
        base: 'block w-full rounded-xl border-toon text-sm disabled:cursor-not-allowed disabled:opacity-50',
        colors: {
            gray: 'border-ink/40 bg-paper text-ink placeholder-ink/40 focus:border-ink focus:ring-butter/50',
            failure: 'border-tomato bg-paper text-ink placeholder-ink/40 focus:border-tomato focus:ring-tomato/30'
        }
    },
    checkbox: {
        root: {
            base: 'h-5 w-5 rounded-md border-2 border-ink bg-paper focus:ring-2',
            color: {
                default: 'text-butter focus:ring-butter/50'
            }
        }
    },
    label: {
        root: {
            base: 'text-sm font-toon',
            colors: {
                default: 'text-ink'
            }
        }
    },
    pagination: {
        pages: {
            base: 'mt-2 inline-flex items-center gap-1.5',
            previous: {
                base: 'h-10 rounded-full border-toon border-ink bg-paper px-4 font-toon text-ink shadow-toon-sm enabled:hover:bg-cream disabled:opacity-40 disabled:shadow-none',
                icon: 'h-5 w-5'
            },
            next: {
                base: 'h-10 rounded-full border-toon border-ink bg-paper px-4 font-toon text-ink shadow-toon-sm enabled:hover:bg-cream disabled:opacity-40 disabled:shadow-none',
                icon: 'h-5 w-5'
            },
            selector: {
                base: 'h-10 w-10 rounded-full border-2 border-ink/25 bg-paper text-ink enabled:hover:border-ink',
                active: 'border-toon border-ink bg-butter text-[#4a2511] font-bold',
                disabled: 'cursor-not-allowed opacity-50'
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
        <CartHydration/>
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
