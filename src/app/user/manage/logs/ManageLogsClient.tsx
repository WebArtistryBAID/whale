'use client'

import { useEffect, useState } from 'react'
import Paginated from '@/app/lib/Paginated'
import { HydratedUserAuditLog } from '@/app/lib/user-actions'
import { useTranslationClient } from '@/app/i18n/client'
import {
    Breadcrumb,
    BreadcrumbItem,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow
} from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import If from '@/app/lib/If'
import Image from 'next/image'
import { UserAuditLogType } from '@prisma/client'
import getAuditLogs from '@/app/lib/manage-actions'
import Link from 'next/link'

export default function ManageLogsClient({ init }: { init: Paginated<HydratedUserAuditLog> }) {
    const { t } = useTranslationClient('user')
    const [ page, setPage ] = useState<Paginated<HydratedUserAuditLog>>(init)
    const [ currentPage, setCurrentPage ] = useState(0)

    useEffect(() => {
        (async () => {
            if (page.page !== currentPage) {
                setPage(await getAuditLogs(currentPage))
            }
        })()
    }, [ currentPage, page.page ])

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('logs.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('logs.title')}</h1>
        <If condition={page.pages < 1}>
            <div className="w-full h-[60dvh] flex flex-col justify-center items-center">
                <Image width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                       className="dark:hidden w-72" alt=""/>
                <Image width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                       className="hidden dark:block w-72" alt=""/>
                <p>{t('logs.empty')}</p>
            </div>
        </If>
        <If condition={page.pages >= 1}>
            <p className="sr-only">{t('a11y.page', { page: page.page + 1, pages: page.pages })}</p>
            <div className="w-full overflow-x-auto">
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('logs.id')}</TableHeadCell>
                        <TableHeadCell>{t('logs.user')}</TableHeadCell>
                        <TableHeadCell>{t('logs.order')}</TableHeadCell>
                        <TableHeadCell>{t('logs.time')}</TableHeadCell>
                        <TableHeadCell>{t('logs.message')}</TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {page.items.map(log => {
                            const messageData: { [key: string]: string } = Object()
                            if (log.userId != null) {
                                messageData.user = log.user!.name
                            }
                            if (log.orderId != null) {
                                messageData.order = log.orderId.toString()
                            }
                            if (([
                                UserAuditLogType.blocked,
                                UserAuditLogType.unblocked,
                                UserAuditLogType.permissionsUpdated,
                                UserAuditLogType.balanceTransaction,
                                UserAuditLogType.balanceUsed,
                                UserAuditLogType.orderSetStatus,
                                UserAuditLogType.orderPaymentSuccess,
                                UserAuditLogType.orderPaymentFailed,
                                UserAuditLogType.orderRefunded
                            ] as UserAuditLogType[]).includes(log.type)) {
                                messageData.v0 = log.values[0]
                            }
                            if (([
                                UserAuditLogType.balanceTransaction,
                                UserAuditLogType.balanceUsed,
                                UserAuditLogType.pointsUpdated,
                                UserAuditLogType.orderPaymentSuccess,
                                UserAuditLogType.orderPaymentFailed
                            ] as UserAuditLogType[]).includes(log.type)) {
                                messageData.v1 = log.values[1]
                            }
                            return <TableRow className="tr" key={log.id}>
                                <TableCell className="flex items-center th">
                                    {log.id}
                                </TableCell>
                                <TableCell>
                                    <If condition={log.userId == null}>
                                        N/A
                                    </If>
                                    <If condition={log.userId != null}>
                                        <Link href={`/manage/users/${log.userId}`}
                                              className="inline">{log.user?.name}</Link>
                                    </If>
                                </TableCell>

                                <TableCell>
                                    <If condition={log.orderId == null}>
                                        N/A
                                    </If>
                                    <If condition={log.orderId != null}>
                                        <Link href={`/order/details/${log.orderId}`}
                                              className="inline">{log.orderId}</Link>
                                    </If>
                                </TableCell>
                                <TableCell>
                                    {log.time.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {t(`logs.types.${log.type}`, messageData)}
                                </TableCell>
                            </TableRow>
                        })}
                    </TableBody>
                </Table>
            </div>
            <div className="flex overflow-x-auto sm:justify-center">
                <If condition={page.pages > 0}>
                    <Pagination currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                                totalPages={page.pages}/>
                </If>
            </div>
        </If>
    </div>
}
