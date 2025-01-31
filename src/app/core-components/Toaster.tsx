'use client'

import { Slide, toast, ToastContainer } from 'react-toastify'
import { useEffect } from 'react'
import { getUntoastedNotifications } from '@/app/lib/notification-actions'
import { getNotificationMessageParams } from '@/app/lib/notification-utils'
import { useTranslationClient } from '@/app/i18n/client'

export default function Toaster() {
    const { t } = useTranslationClient('user')

    useEffect(() => {
        setInterval(() => {
            (async () => {
                const notifications = await getUntoastedNotifications()
                for (const notification of notifications) {
                    toast(t(`inbox.types.${notification.type}`, getNotificationMessageParams(notification)))
                }
            })()
        }, 10000, 0)
    }, [ t ])
    return <ToastContainer transition={Slide} hideProgressBar/>
}
