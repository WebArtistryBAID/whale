'use client'

import { HydratedOrder, isStoreOpen } from '@/app/lib/ordering-actions'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getWaitingOrders } from '@/app/lib/order-manage-actions'
import { Button } from 'flowbite-react'
import Link from 'next/link'
import { OrderType } from '@/generated/prisma/browser'
import If from '@/app/lib/If'
import OrderWithData from '@/app/user/manage/orders/[id]/OrderWithData'
import { setConfigValue } from '@/app/lib/settings-actions'

export default function WaitingOrdersClient({ init }: { init: { [id: number]: HydratedOrder } }) {
    const { t } = useTranslationClient('user')
    const [ orders, setOrders ] = useState(init)
    const [ selected, setSelected ] = useState(Object.keys(init).length < 1 ? -1 : parseInt(Object.keys(init)[0]))
    const [ isOpen, setOpen ] = useState(false)

    useEffect(() => {
        (async () => {
            setOpen(await isStoreOpen())
        })()
        setInterval(async () => {
            const newOrders = await getWaitingOrders()
            if (!(selected in newOrders)) {
                setSelected(-1)
            }
            setOrders(newOrders)
            setOpen(await isStoreOpen())
        }, 10000)
    }, [])

    if (Object.keys(orders).length < 1) {
        return <div className="w-screen h-screen flex flex-col justify-center items-center text-center">
            <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                 className="dark:hidden w-72" alt=""/>
            <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                 className="hidden dark:block w-72" alt=""/>
            <p className="mb-3">{t('today.empty')}</p>
            <Link href="/user/manage/orders" className="mb-3">
                <Button color="warning">{t('today.return')}</Button>
            </Link>

            <Button color="yellow" onClick={async () => {
                const date = new Date()
                await setConfigValue('availability-override-date', `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
                await setConfigValue('availability-override-value', isOpen ? 'false' : 'true')
                setOpen(!isOpen)
            }}>{isOpen ? t('today.closeAction') : t('today.openAction')}</Button>
        </div>
    }

    return <div className="flex h-[93vh] w-screen">
        <div className="w-1/5 h-full flex flex-col p-5" aria-label={t('today.ordersPane')}>
            <div className="override-y-auto flex flex-col gap-3 flex-grow">
                {Object.keys(orders).map(id =>
                    <Button key={id} onClick={() => setSelected(parseInt(id))} className="w-full"
                            color={selected === parseInt(id) ? 'warning' : (orders[parseInt(id)].type === OrderType.pickUp ? 'gray' : 'green')}>
                        {id}
                        <If condition={orders[parseInt(id)].type === OrderType.delivery}>
                            <span className="ml-1">{t('today.delivery')}</span>
                        </If>
                        <If condition={selected === parseInt(id)}>
                            <span className="sr-only">{t('selected')}</span>
                        </If>
                    </Button>
                )}
            </div>
            <div className="flex-shrink flex flex-col gap-3">
                <Link href="/user/manage/orders">
                    <Button color="yellow">{t('today.return')}</Button>
                </Link>
                <div className="flex items-center gap-2">
                    <p className="mr-auto">{isOpen ? t('today.storeStatusOpen') : t('today.storeStatusClosed')}</p>
                    <Button color="yellow" onClick={async () => {
                        const date = new Date()
                        await setConfigValue('availability-override-date', `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`)
                        await setConfigValue('availability-override-value', isOpen ? 'false' : 'true')
                        setOpen(!isOpen)
                    }}>{isOpen ? t('today.closeAction') : t('today.openAction')}</Button>
                </div>
            </div>
        </div>
        <div className="w-4/5 p-8 h-full overflow-y-auto" aria-label={t('today.detailsPane')}>
            {selected !== -1 ?
                <OrderWithData order={orders[selected]} close={() => setSelected(-1)} forceUpdate={async () => {
                setOrders(await getWaitingOrders())
                }}/> : null}
        </div>
    </div>
}
