'use client'

import { getOrder, HydratedOrder } from '@/app/lib/ordering-actions'
import { useEffect, useState } from 'react'
import OrderWithData from '@/app/user/manage/orders/[id]/OrderWithData'

export default function ManageOrderClient({ init }: { init: HydratedOrder }) {
    const [ order, setOrder ] = useState(init)

    useEffect(() => {
        setInterval(async () => {
            const o = await getOrder(order.id)
            if (o == null) {
                location.href = '/'
                return
            }
            setOrder(o)
        }, 10000)
    }, [ order.id ])

    return <OrderWithData order={order} forceUpdate={async () => {
        const o = await getOrder(order.id)
        if (o == null) {
            location.href = '/'
            return
        }
        setOrder(o)
    }}/>
}
