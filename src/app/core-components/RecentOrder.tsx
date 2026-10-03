'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { HydratedOrder } from '@/app/lib/ordering-actions'
import { useStoredOrder } from '@/app/lib/shopping-cart'
import Link from 'next/link'

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

    return <Link aria-label={t('recentOrder')} href={`/order/details/${order.id}`}
                 className="group flex items-center gap-4 py-4 border-y border-cream-200 dark:border-white/10 max-w-md">
        <span className="font-serif text-3xl font-semibold tabular-nums">
            No.{order.id}
            <span className="sr-only">{t('orderNumber')}</span>
        </span>
        <span className="flex-1">
            <span className="block font-semibold">{t('recentOrder')}</span>
            <span className="block text-sm secondary">{t('recentOrderSub')}</span>
        </span>
        <span aria-hidden className="text-caramel transition-transform group-hover:translate-x-1">→</span>
    </Link>
}
