'use client'

import { NotificationType, User } from '@prisma/client'
import { Breadcrumb, BreadcrumbItem, Button, Checkbox } from 'flowbite-react'
import { HiUser } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { toggleInboxNotification, toggleSMSNotification } from '@/app/login/login-actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCookies } from 'react-cookie'

export default function UserDashboardClient({ user }: { user: User }) {
    const { t } = useTranslationClient('user')
    const router = useRouter()
    const [ loading, setLoading ] = useState(false)
    const removeCookie = useCookies()[2]

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiUser}>{t('breadcrumb.user')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('dashboard.title')}</h1>
        <div className="flex w-full items-center gap-4 mb-5">
            <div className="bg-yellow-300 dark:bg-yellow-500 rounded-full h-16 w-16 flex justify-center items-center">
                <HiUser className="text-white text-3xl"/>
            </div>
            <div className="font-display">
                <h2>{user.name}</h2>
                <p>{user.pinyin}</p>
            </div>
        </div>

        <div className="2xl:w-1/2">
            <div className="mb-8" aria-label={t('dashboard.profile.title')}>
                <h2 aria-hidden className="text-sm font-normal mb-3">{t('dashboard.profile.title')}</h2>
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5">
                    <p className="secondary text-sm font-display">{t('dashboard.profile.name')}</p>
                    <p className="text-xl mb-3">{user.name}</p>

                    <p className="secondary text-sm font-display">{t('dashboard.profile.pinyin')}</p>
                    <p className="text-xl mb-3">{user.pinyin}</p>

                    <If condition={user.phone != null}>
                        <p className="secondary text-sm font-display">{t('dashboard.profile.phone')}</p>
                        <p className="text-xl mb-3">{user.phone}</p>
                    </If>

                    <p className="text-sm secondary">{t('dashboard.profile.updateInfo')}</p>
                </div>
            </div>

            <div className="mb-8" aria-label={t('dashboard.balance.title')}>
                <h2 aria-hidden className="text-sm font-normal mb-3">{t('dashboard.balance.title')}</h2>
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5">
                    <p className="text-xl mb-3">¥{user.balance}</p>
                    <Button color="warning" pill className="mb-3" onClick={() => {
                        // TODO Implement balance recharge
                    }}>{t('dashboard.balance.recharge')}</Button>
                    <p className="text-sm secondary">{t('dashboard.balance.balanceInfo')}</p>
                </div>
            </div>

            <div className="mb-8" aria-label={t('dashboard.points.title')}>
                <h2 aria-hidden className="text-sm font-normal mb-3">{t('dashboard.points.title')}</h2>
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5">
                    <p className="text-xl mb-3">{user.points}</p>
                    <p className="text-sm secondary">{t('dashboard.points.pointsInfo')}</p>
                </div>
            </div>

            <div className="mb-8" aria-label={t('dashboard.notifications.title')}>
                <h2 aria-hidden className="text-sm font-normal mb-3">{t('dashboard.notifications.title')}</h2>
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5">
                    <table className="w-full mb-5">
                        <thead>
                        <tr>
                            <th className="sr-only">{t('dashboard.notifications.type')}</th>
                            <th className="font-normal font-display">{t('dashboard.notifications.inbox')}</th>
                            <th className="font-normal font-display">{t('dashboard.notifications.sms')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.values(NotificationType).map((type) => (
                            <tr key={type} className="border-b-transparent border-b-8">
                                <th className="text-left font-normal w-1/2">{t(`dashboard.notifications.types.${type}`)}</th>
                                <td className="w-1/4">
                                    <div className="w-full flex justify-center">
                                        <Checkbox color="yellow"
                                                  aria-label={`${t(`dashboard.notifications.types.${type}`)}: ${t('dashboard.notifications.inbox')}`}
                                                  checked={user.inboxNotifications.includes(type)}
                                                  onChange={async () => {
                                                      await toggleInboxNotification(type)
                                                      router.refresh()
                                                  }}/>
                                    </div>
                                </td>
                                <td className="w-1/4">
                                    <div className="w-full flex justify-center">
                                        <Checkbox color="yellow"
                                                  aria-label={`${t(`dashboard.notifications.types.${type}`)}: ${t('dashboard.notifications.sms')}`}
                                                  checked={user.smsNotifications.includes(type)}
                                                  onChange={async () => {
                                                      if (loading) {
                                                          return
                                                      }
                                                      setLoading(true)
                                                      await toggleSMSNotification(type)
                                                      router.refresh()
                                                      setLoading(false)
                                                  }}/>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <p className="text-sm secondary">{t('dashboard.notifications.smsInfo')}</p>
                </div>
            </div>

            <div aria-label={t('dashboard.others.title')} className="mb-8">
                <h2 aria-hidden className="text-sm font-normal mb-3">{t('dashboard.others.title')}</h2>
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5">
                    <Button pill color="warning" className="mb-3" onClick={() => {
                        removeCookie('access_token', { path: '/' })
                        router.push('/')
                    }}>{t('dashboard.others.logOut')}</Button>
                    <p className="text-sm secondary">{t('dashboard.others.credits')}</p>
                </div>
            </div>
        </div>
    </div>
}
