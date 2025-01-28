import type { Metadata } from 'next'
import './globals.css'
import {Noto_Sans_SC, Noto_Serif_SC} from 'next/font/google'
import { ReactNode } from 'react'
import NextTopLoader from 'nextjs-toploader'
import { ThemeModeScript } from 'flowbite-react'


const notoSerif = Noto_Serif_SC({
    subsets: [ 'latin', 'latin-ext' ],
    variable: '--font-noto-serif-sc'
})

const notoSans = Noto_Sans_SC({
    subsets: [ 'latin', 'latin-ext' ],
    variable: '--font-noto-sans-sc'
})

export const metadata: Metadata = {
    title: 'Whale',
    description: 'The ordering management platform for Whale Cafe'
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
        <NextTopLoader showSpinner={false} color="#3b82f6"/>
        {children}
        <p className="fixed bottom-2 right-2 secondary text-xs"><a
            href="https://beian.miit.gov.cn">{process.env.BOTTOM_TEXT}</a></p>
        </body>
        </html>
    )
}
