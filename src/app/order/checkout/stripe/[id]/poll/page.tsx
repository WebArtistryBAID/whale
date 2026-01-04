'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getOrder } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { Spinner } from 'flowbite-react'
import { getOrderPaymentStatus } from '@/app/lib/wx-pay-actions'
import { PaymentStatus } from '@/generated/prisma/enums'

export default function StripePollPage() {
    const { t } = useTranslationClient('order')
    const { id } = useParams<{ id: string }>()
    const router = useRouter()

    useEffect(() => {
        (async () => {
            const order = await getOrder(parseInt(id))
            if (order == null) {
                router.replace('/')
            }
        })()
    }, [ id, router ])

    useEffect(() => {
        void pollPaymentStatus()
        setInterval(() => {
            void pollPaymentStatus()
        }, 3000)
    }, [])

    async function pollPaymentStatus() {
        if (await getOrderPaymentStatus(parseInt(id)) === PaymentStatus.paid) {
            location.href = `/order/details/${id}`
        }
    }

    return <div className="p-5 flex flex-col justify-center items-center w-screen h-screen">
        <Spinner className="mb-3" size="xl" color="warning"/>
        <p className="text-sm text-center mb-3">{t('checkout.stripePollText')}</p>
    </div>
}
