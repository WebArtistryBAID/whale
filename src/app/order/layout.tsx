import { ReactNode } from 'react'
import SimpleNav from '@/app/core-components/SimpleNav'
import OrderNags from '@/app/order/OrderNags'


export default async function RootLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <SimpleNav/>
            <OrderNags/>
            {children}
        </>
    )
}
