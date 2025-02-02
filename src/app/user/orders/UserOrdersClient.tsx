'use client'

import { useEffect, useState } from 'react'
import { Order } from '@prisma/client'
import Paginated from '@/app/lib/Paginated'
import { getMyOrders } from '@/app/lib/user-actions'
import { useTranslationClient } from '@/app/i18n/client'
import {
    Badge,
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow
} from 'flowbite-react'
import { HiHashtag, HiUser } from 'react-icons/hi'
import If from '@/app/lib/If'
import Link from 'next/link'

export default function UserOrdersClient({ init }: { init: Paginated<Order> }) {
    const { t } = useTranslationClient('user')
    const [ page, setPage ] = useState<Paginated<Order>>(init)
    const [ currentPage, setCurrentPage ] = useState(0)

    useEffect(() => {
        (async () => {
            if (page.page !== currentPage) {
                setPage(await getMyOrders(currentPage))
            }
        })()
    }, [ currentPage, page.page ])

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiUser} href="/user">{t('breadcrumb.user')}</BreadcrumbItem>
            <BreadcrumbItem>{t('orders.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('orders.title')}</h1>
        <If condition={page.pages < 1}>
            <div className="w-full h-[60dvh] flex flex-col justify-center items-center">
                <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                     className="dark:hidden w-72" alt=""/>
                <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                     className="hidden dark:block w-72" alt=""/>
                <p className="mb-3">{t('orders.empty')}</p>
                <Button color="warning" as={Link} href="/order">{t('orders.cta')}</Button>
            </div>
        </If>
        <If condition={page.pages >= 1}>
            <p className="sr-only">{t('a11y.page', { page: page.page + 1, pages: page.pages })}</p>
            <Table className="mb-5">
                <TableHead>
                    <TableHeadCell>{t('orders.id')}</TableHeadCell>
                    <TableHeadCell>{t('orders.status')}</TableHeadCell>
                    <TableHeadCell>{t('orders.totalPrice')}</TableHeadCell>
                    <TableHeadCell>{t('orders.createdAt')}</TableHeadCell>
                    <TableHeadCell><span className="sr-only">{t('orders.action')}</span> </TableHeadCell>
                </TableHead>
                <TableBody className="divide-y mb-3">
                    {page.items.map(order =>
                        <TableRow className="tr" key={order.id}>
                            <TableCell className="flex items-center th">
                                <Badge className="mr-3" icon={HiHashtag} color="warning"/>
                                {order.id}
                            </TableCell>
                            <TableCell>
                                {t(`orders.${order.status}`)}
                            </TableCell>
                            <TableCell>
                                ¥{order.totalPrice}
                            </TableCell>
                            <TableCell>
                                {order.createdAt.toLocaleString()}
                            </TableCell>
                            <TableCell>
                                <Button pill color="warning" size="xs" as={Link}
                                        href={`/order/details/${order.id}`}>{t('orders.view')}</Button>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <div className="flex overflow-x-auto sm:justify-center">
                <If condition={page.pages > 0}>
                    <Pagination currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                                totalPages={page.pages}/>
                </If>
            </div>
        </If>
    </div>
}
