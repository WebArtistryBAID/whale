'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useStoredOrder } from '@/app/lib/shopping-cart'
import Link from 'next/link'
import { useEffect } from 'react'
import { Button } from 'flowbite-react'

export default function CurrentOrderBubble() {
    const { t } = useTranslationClient('order')
    const storedOrder = useStoredOrder()

    useEffect(() => {
        (async () => {
            await storedOrder.getIfValid()
        })()
    }, [ storedOrder ])

    if (storedOrder.order == null) {
        return <></>
    }

    return <>
        <Button as={Link} color="yellow" href={`/order/details/${storedOrder.order}`}
                className="fixed top-20 lg:top-24 right-5 shadow-lg" style={{ zIndex: '5' }}>
            <div className="text-left">
                <p className="text-xs lg:text-sm">{t('bubble.title')}</p>
                <p className="font-bold text-lg lg:text-2xl">{storedOrder.order}</p>
            </div>
        </Button>
    </>
}
