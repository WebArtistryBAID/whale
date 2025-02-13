import { ReactNode } from 'react'
import SimpleNav from '@/app/core-components/SimpleNav'


export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <div className="bg-coffee-1 dark:bg-coffee-4">
            <SimpleNav/>
            {children}
        </div>
    )
}
