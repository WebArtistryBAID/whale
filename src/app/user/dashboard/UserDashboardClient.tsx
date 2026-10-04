'use client'

import { logout } from '@/app/login/login-actions'
import { NotificationType, User } from '@/generated/prisma/browser'
import { Button, Checkbox, Modal, ModalBody, ModalFooter, ModalHeader, TextInput } from 'flowbite-react'
import { HiBell, HiCash, HiClipboardList, HiIdentification, HiLogout, HiPuzzle, HiShoppingBag, HiStar } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getConfigValue } from '@/app/lib/settings-actions'
import Decimal from 'decimal.js'
import { beginTransaction } from '@/app/lib/balance-actions'
import { toggleInboxNotification, toggleSMSNotification } from '@/app/lib/notification-actions'
import Beluga from '@/app/core-components/Beluga'
import Panel from '@/app/user/components/Panel'
import StatTile from '@/app/user/components/StatTile'
import Link from 'next/link'
import { getOrderingAvailability } from '@/app/lib/ordering-actions'
import { getWaitingOrders } from '@/app/lib/order-manage-actions'
import { OrderingAvailabilityResponse } from '@/app/lib/ordering-schedule'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { getStoreHour } from '@/app/lib/format-date'

function StoreOverview() {
    const { t } = useTranslationClient('user')
    const router = useRouter()
    const shoppingCart = useShoppingCart()
    const [ availability, setAvailability ] = useState<OrderingAvailabilityResponse | null>(null)
    const [ waiting, setWaiting ] = useState<{ orders: number, cups: number } | null>(null)

    useEffect(() => {
        const load = async () => {
            setAvailability(await getOrderingAvailability())
            const orders = Object.values(await getWaitingOrders())
            setWaiting({
                orders: orders.length,
                cups: orders.reduce((acc, order) => acc + order.items.reduce((a, item) => a + item.amount, 0), 0)
            })
        }
        void load()
        const id = setInterval(load, 15000)
        return () => clearInterval(id)
    }, [])

    const status = availability == null
        ? '...'
        : availability.phase === 'preorder'
            ? (availability.canOrderNow ? t('today.storeStatusPreOrder') : t('today.storeStatusPreOrderFull'))
            : availability.phase === 'live'
                ? (availability.canOrderNow ? t('today.storeStatusOpen') : t('today.storeStatusAtCapacity'))
                : t('today.storeStatusClosed')
    const open = availability?.phase != null && availability.phase !== 'closed'

    return <Panel title={t('dashboard.store.title')} icon={HiShoppingBag}
                  action={<span className={`text-xs font-bold px-3 py-1 rounded-full border-2 border-ink ${open ? 'bg-mint' : 'bg-blush'}`}>
                      {status}
                  </span>}>
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-4">
            <StatTile tone="butter" label={t('dashboard.store.waitingOrders')} value={waiting?.orders ?? '...'}
                      hint={t('dashboard.store.waitingCups', { count: waiting?.cups ?? 0 })}/>
            <StatTile tone="whale" label={t('dashboard.store.remaining')}
                      value={availability?.currentDay.remainingLiveCups ?? '...'}
                      hint={availability == null ? '' : t('today.officialLimit', { count: availability.currentDay.officialLimit })}/>
            <StatTile tone="mint" className="col-span-2 xl:col-span-1" label={t('dashboard.store.hours')}
                      value={availability == null ? '...' : `${availability.openTime}–${availability.closeTime}`}
                      hint={availability == null ? '' : t('today.limitDate', { date: availability.currentDay.dateKey })}/>
        </div>
        <div className="flex flex-wrap gap-3">
            <Link href="/today" className="toon-btn h-11 text-base"><HiClipboardList/>{t('dashboard.store.queue')}</Link>
            <button className="toon-btn-ghost h-11 text-base" onClick={() => {
                shoppingCart.setOnSiteOrderMode(true)
                router.push('/order')
            }}>{t('orders.onSite')}</button>
            <Link href="/user/manage/break" className="toon-btn-ghost h-11 text-base bg-whale/50"><HiPuzzle/>{t('nav.break')}</Link>
        </div>
    </Panel>
}

export default function UserDashboardClient({ user }: { user: User }) {
    const { t } = useTranslationClient('user')
    const router = useRouter()
    const [ loading, setLoading ] = useState(false)
    const [ balanceMax, setBalanceMax ] = useState(Decimal(-1))
    const [ rechargeMin, setRechargeMin ] = useState(Decimal(-1))
    const [ rechargeModal, setRechargeModal ] = useState(false)
    const [ toRecharge, setToRecharge ] = useState('')
    const isAdmin = user.permissions.includes('admin.manage')

    useEffect(() => {
        (async () => {
            setBalanceMax(Decimal((await getConfigValue('maximum-balance'))!))
            setRechargeMin(Decimal((await getConfigValue('balance-recharge-minimum'))!))
        })()
    }, [])

    const hour = getStoreHour(new Date())
    const greeting = hour < 11 ? t('dashboard.greeting.morning') : hour < 17 ? t('dashboard.greeting.afternoon') : t('dashboard.greeting.evening')
    const rechargeInvalid = toRecharge === '' || isNaN(Number(toRecharge))

    return <>
        <Modal show={rechargeModal} onClose={() => setRechargeModal(false)}>
            <ModalHeader>{t('dashboard.rechargeModal.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-5">{t('dashboard.rechargeModal.message')}</p>
                <TextInput className="w-full" type="number" value={toRecharge}
                           placeholder={t('dashboard.rechargeModal.placeholder')}
                           onChange={e => setToRecharge(e.currentTarget.value)}
                           aria-valuemin={rechargeMin.toNumber()}
                           aria-valuemax={balanceMax.minus(user.balance).toNumber()}/>
                <If condition={!rechargeInvalid && Decimal(toRecharge || 0).lt(rechargeMin)}>
                    <p className="text-tomato mt-3">{t('dashboard.rechargeModal.minimum', { value: rechargeMin })}</p>
                </If>
                <If condition={!rechargeInvalid && Decimal(toRecharge || 0).gt(balanceMax.minus(user.balance))}>
                    <p className="text-tomato mt-1">{t('dashboard.rechargeModal.maximum', { value: balanceMax.minus(user.balance).toString() })}</p>
                </If>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning"
                        disabled={rechargeInvalid || loading || Decimal(toRecharge).lt(rechargeMin) || Decimal(toRecharge).gt(balanceMax.minus(user.balance))}
                        onClick={async () => {
                            setLoading(true)
                            const trans = await beginTransaction(toRecharge)
                            setLoading(false)
                            if (trans == null) {
                                return
                            }
                            router.push(`/order/checkout?recharge=${trans.id}`)
                        }}>{t('dashboard.rechargeModal.cta')}</Button>
                <Button pill color="gray" onClick={() => setRechargeModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="container">
            <header className="mb-6">
                <h1>{t('dashboard.title')}</h1>
            </header>

            {/* Greeting from the mascot */}
            <div className="toon p-5 mb-6 flex items-center gap-4 sm:gap-6 bg-whale/30 overflow-hidden">
                <Beluga mood={isAdmin ? 'cheer' : 'happy'} withCup className="w-28 sm:w-40 shrink-0 bob"/>
                <div className="min-w-0">
                    <p className="font-toon text-2xl sm:text-3xl">{greeting}{user.name}!</p>
                    <p className="secondary mt-1">{isAdmin ? t('dashboard.greeting.staff') : t('dashboard.greeting.customer')}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 xl:max-w-4xl">
                <StatTile tone="butter" icon={HiCash} label={t('dashboard.balance.title')} value={`¥${user.balance}`}
                          hint={t('dashboard.balance.balanceInfo', { max: balanceMax.toString() })}
                          action={Decimal(user.balance).lte(balanceMax.minus(rechargeMin))
                              ? <button className="toon-btn h-10 text-base px-5"
                                        onClick={() => setRechargeModal(true)}>{t('dashboard.balance.recharge')}</button>
                              : undefined}/>
                <StatTile tone="blush" icon={HiStar} label={t('dashboard.points.title')} value={user.points}
                          hint={t('dashboard.points.pointsInfo')}/>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                {isAdmin && <div className="xl:col-span-2 xl:max-w-4xl"><StoreOverview/></div>}

                <Panel title={t('dashboard.profile.title')} icon={HiIdentification}>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 mb-4">
                        <dt className="secondary text-sm">{t('dashboard.profile.name')}</dt>
                        <dd className="font-toon text-lg">{user.name}</dd>
                        <dt className="secondary text-sm">{t('dashboard.profile.pinyin')}</dt>
                        <dd>{user.pinyin}</dd>
                        <If condition={user.phone != null}>
                            <dt className="secondary text-sm">{t('dashboard.profile.phone')}</dt>
                            <dd>{user.phone}</dd>
                        </If>
                    </dl>
                    <p className="text-xs secondary">{t('dashboard.profile.updateInfo')}</p>
                </Panel>

                <Panel title={t('dashboard.notifications.title')} icon={HiBell}>
                    <table className="w-full mb-4">
                        <thead>
                        <tr className="text-sm">
                            <th className="sr-only">{t('dashboard.notifications.type')}</th>
                            <th className="font-toon font-normal pb-2">{t('dashboard.notifications.inbox')}</th>
                            <th className="font-toon font-normal pb-2">{t('dashboard.notifications.sms')}</th>
                        </tr>
                        </thead>
                        <tbody>
                        {Object.values(NotificationType).map((type) => (
                            <tr key={type} className="border-t-2 border-dashed border-ink/10">
                                <th className="text-left font-normal py-2 w-1/2">{t(`dashboard.notifications.types.${type}`)}</th>
                                <td className="w-1/4 text-center">
                                    <Checkbox aria-label={`${t(`dashboard.notifications.types.${type}`)}: ${t('dashboard.notifications.inbox')}`}
                                              checked={user.inboxNotifications.includes(type)}
                                              onChange={async () => {
                                                  await toggleInboxNotification(type)
                                                  router.refresh()
                                              }}/>
                                </td>
                                <td className="w-1/4 text-center">
                                    <Checkbox aria-label={`${t(`dashboard.notifications.types.${type}`)}: ${t('dashboard.notifications.sms')}`}
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
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                    <p className="text-xs secondary">{t('dashboard.notifications.smsInfo')}</p>
                </Panel>

                <div className="xl:col-span-2 flex flex-wrap items-center gap-4 pb-6">
                    <button className="toon-btn-ghost h-11 text-base" onClick={() => {
                        void logout().then(() => router.replace('/'))
                    }}><HiLogout/>{t('dashboard.others.logOut')}</button>
                    <p className="text-xs secondary max-w-md">{t('dashboard.others.credits')}</p>
                </div>
            </div>
        </div>
    </>
}
