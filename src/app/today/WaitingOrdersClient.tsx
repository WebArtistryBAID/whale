'use client'

import { HydratedOrder } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders } from '@/app/lib/order-manage-actions'
import ManageOrderClient from '@/app/user/manage/orders/[id]/ManageOrderClient'
import Image from 'next/image'
import { Button } from 'flowbite-react'
import Link from 'next/link'
import { OrderType } from '@prisma/client'
import If from '@/app/lib/If'

export default function WaitingOrdersClient({ init }: { init: { [id: number]: HydratedOrder } }) {
    const { t } = useTranslationClient('user')
    const [ orders, setOrders ] = useState(init)
    const [ selected, setSelected ] = useState(Object.keys(init).length < 1 ? -1 : parseInt(Object.keys(init)[0]))

    useEffect(() => {
        setInterval(async () => {
            setOrders(await getWaitingOrders())
        }, 10000)
    }, [])

    if (Object.keys(orders).length < 1) {
        return <div className="w-screen h-screen flex flex-col justify-center items-center">
            <Image width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                   className="dark:hidden w-72" alt=""/>
            <Image width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                   className="hidden dark:block w-72" alt=""/>
            <p className="mb-3">{t('today.empty')}</p>
            <Button color="warning" as={Link} href="/user/manage/orders">{t('today.return')}</Button>
        </div>
    }

    return <div className="flex h-[93vh] w-screen">
        <div className="w-1/5 flex flex-col gap-3 h-full overflow-y-auto p-5" aria-label={t('today.ordersPane')}>
            {Object.keys(orders).map(id =>
                <Button key={id} onClick={() => setSelected(parseInt(id))} className="w-full"
                        color={selected === parseInt(id) ? 'warning' : (orders[parseInt(id)].type === OrderType.pickUp ? 'gray' : 'yellow')}>
                    {id}
                    <If condition={selected === parseInt(id)}>
                        <span className="sr-only">{t('selected')}</span>
                    </If>
                </Button>
            )}
            <Button color="yellow" as={Link} href="/user/manage/orders">{t('today.return')}</Button>
        </div>
        <div className="w-4/5 p-8 h-full overflow-y-auto" aria-label={t('today.detailsPane')}>
            <ManageOrderClient init={orders[selected]}/>
        </div>
    </div>
}