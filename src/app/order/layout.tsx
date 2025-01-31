import { ReactNode } from 'react'
import SimpleNav from '@/app/core-components/SimpleNav'


export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <SimpleNav/>
            {children}
        </>
    )
}
