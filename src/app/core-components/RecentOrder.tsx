'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { HydratedOrder } from '@/app/lib/ordering-actions'
import { useStoredOrder } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { HiArrowRight } from 'react-icons/hi'

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
                 className="toon toon-press inline-flex items-center gap-4 pl-3 pr-6 py-3 bg-whale/40">
        <span className="h-14 min-w-14 px-2 rounded-2xl border-toon border-ink bg-paper font-toon text-2xl
        flex items-center justify-center">
            #{order.id}
            <span className="sr-only">{t('orderNumber')}</span>
        </span>
        <span>
            <span className="block font-toon text-lg">{t('recentOrder')}</span>
            <span className="block text-sm secondary">{t('recentOrderSub')}</span>
        </span>
        <HiArrowRight className="text-xl"/>
    </Link>
}
