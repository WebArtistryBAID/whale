'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import If from '@/app/lib/If'
import { Alert, Breadcrumb, BreadcrumbItem, Pagination } from 'flowbite-react'
import { HiInformationCircle, HiUser } from 'react-icons/hi'
import { Notification } from '@/generated/prisma/browser'
import { Trans } from 'react-i18next/TransWithoutContext'
import Link from 'next/link'
import Paginated from '@/app/lib/Paginated'
import { dismissNotification, getMyNotifications } from '@/app/lib/notification-actions'
import { getNotificationMessageParams } from '@/app/lib/notification-utils'

export default function UserInboxClient({ notifications }: { notifications: Paginated<Notification> }) {
    const { t } = useTranslationClient('user')
    const [ currentPage, setCurrentPage ] = useState(0)
    const [ page, setPage ] = useState<Paginated<Notification>>(notifications)
    const [ loading, setLoading ] = useState(false)

    useEffect(() => {
        (async () => {
            if (page.page !== currentPage) {
                setPage(await getMyNotifications(currentPage))
            }
        })()
    }, [ currentPage, page.page ])

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem href="/user" icon={HiUser}>{t('breadcrumb.user')}</BreadcrumbItem>
            <BreadcrumbItem>{t('inbox.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('inbox.title')}</h1>
        <If condition={page.pages < 1}>
            <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                     className="dark:hidden w-72" alt=""/>
                <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                     className="hidden dark:block w-72" alt=""/>
                <p className="mb-3">{t('inbox.empty')}</p>
            </div>
        </If>
        <If condition={page.pages > 0}>
            <p className="sr-only">{t('a11y.page', { page: page.page + 1, pages: page.pages })}</p>
            {page.items.map(notification => {
                return <Alert key={notification.id} color="gray" icon={HiInformationCircle} className="mb-3" rounded
                              onDismiss={async () => {
                                  if (loading) {
                                      return
                                  }
                                  setLoading(true)
                                  await dismissNotification(notification.id)
                                  setLoading(false)
                                  setPage(await getMyNotifications(currentPage))
                              }}>
                    <Trans t={t} i18nKey={`inbox.types.${notification.type}`}
                           values={getNotificationMessageParams(notification)}
                           components={{ 1: <span key={581} className="font-bold"/> }}/>
                    <If condition={notification.orderId != null}>
                        <Link href={`/order/details/${notification.orderId}`}
                              className="inline ml-2">{t('inbox.view')}</Link>
                    </If>
                </Alert>
            })}

            <div className="flex overflow-x-auto sm:justify-center">
                <If condition={page.pages > 0}>
                    <Pagination currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                                totalPages={page.pages}/>
                </If>
            </div>
        </If>
    </div>
}
