'use client'

import { Order } from '@/generated/prisma/browser'
import { useTranslationClient } from '@/app/i18n/client'

const statusTone: { [key: string]: string } = {
    waiting: 'bg-butter',
    done: 'bg-mint'
}

const paymentTone: { [key: string]: string } = {
    notPaid: 'bg-paper border-dashed',
    paid: 'bg-whale/70',
    refunded: 'bg-blush'
}

const chip = 'inline-flex items-center h-6 px-2.5 rounded-full border-2 border-ink text-xs font-bold whitespace-nowrap'

/** Order status and payment status as two small sticker chips. */
export default function OrderStatusChips({ order }: { order: Pick<Order, 'status' | 'paymentStatus'> }) {
    const { t } = useTranslationClient('user')
    return <span className="inline-flex flex-wrap gap-1.5">
        <span className={`${chip} ${statusTone[order.status] ?? 'bg-paper'}`}>{t(`orders.${order.status}`)}</span>
        <span className={`${chip} ${paymentTone[order.paymentStatus] ?? 'bg-paper'}`}>{t(`today.${order.paymentStatus}`)}</span>
    </span>
}
