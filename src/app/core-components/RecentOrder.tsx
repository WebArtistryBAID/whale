'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { HydratedOrder } from '@/app/lib/ordering-actions'
import { useStoredOrder } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { HiArrowRight, HiReceiptTax } from 'react-icons/hi'

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
                 className="group card p-6 lg:p-8 flex flex-col justify-between min-h-40 lg:min-h-48
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift">
        <div className="h-12 w-12 rounded-2xl flex items-center justify-center bg-caramel-50 dark:bg-white/5">
            <HiReceiptTax className="text-2xl text-caramel dark:text-caramel-100"/>
        </div>
        <div className="flex items-end gap-3 mt-6">
            <div className="mr-auto">
                <p className="font-bold text-xl lg:text-2xl tabular-nums">
                    #{order.id}
                    <span className="sr-only">{t('orderNumber')}</span>
                </p>
                <p className="text-sm secondary" aria-hidden>{t('recentOrder')} · {t('recentOrderSub')}</p>
            </div>
            <HiArrowRight className="text-xl text-caramel transition-transform duration-200 group-hover:translate-x-1"/>
        </div>
    </Link>
}
