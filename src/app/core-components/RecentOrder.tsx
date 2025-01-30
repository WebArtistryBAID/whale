'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { HydratedOrder } from '@/app/lib/ordering-actions'
import { useStoredOrder } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { Badge } from 'flowbite-react'
import { HiHashtag } from 'react-icons/hi'

export default function RecentOrder() {
    const { t } = useTranslationClient('welcome')
    const storedOrder = useStoredOrder()
    const [ order, setOrder ] = useState<HydratedOrder | null>(null)

    useEffect(() => {
        (async () => {
            setOrder(await storedOrder.getIfValid())
        })()
    }, [ storedOrder ])

    if (order == null) {
        return <></>
    }

    return <Link aria-label={t('recentOrder')} className="w-40 h-40 rounded-3xl bg-yellow-50 dark:bg-yellow-800
                    hover:bg-yellow-100 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5" href={`/order/details/${order.id}`}>
        <p className="text-3xl font-display mb-1 flex items-center font-bold">
            <Badge className="mr-3 rounded-full h-8 w-8 flex justify-center items-center" color="warning">
                <HiHashtag className="text-xl"/>
            </Badge>
            {order.id}
            <span className="sr-only">{t('orderNumber')}</span>
        </p>
        <p className="font-bold text-lg" aria-hidden>{t('recentOrder')}</p>
        <p className="secondary text-xs" aria-hidden>{t('recentOrderSub')}</p>
    </Link>
}
