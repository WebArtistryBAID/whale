'use client'

import { Order, User } from '@/generated/prisma/browser'
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    TextInput,
    ToggleSwitch
} from 'flowbite-react'
import { HiCollection, HiPencil, HiShieldCheck } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyUser, setUserBlocked, toggleUserPermission } from '@/app/login/login-actions'
import Paginated from '@/app/lib/Paginated'
import Link from 'next/link'
import Decimal from 'decimal.js'
import { getUserOrders, setUserPoints } from '@/app/lib/order-manage-actions'
import { formatDateTime } from '@/app/lib/format-date'
import OrderStatusChips from '@/app/user/components/OrderStatusChips'
import Panel from '@/app/user/components/Panel'
import StatTile from '@/app/user/components/StatTile'

export default function ManageUserClient({ user, init }: { user: User, init: Paginated<Order> }) {
    const { t } = useTranslationClient('user')
    const [ myUser, setMyUser ] = useState<User>()
    const [ loading, setLoading ] = useState(false)
    const [ pointsModal, setPointsModal ] = useState(false)
    const [ points, setPoints ] = useState(user.points)
    const router = useRouter()

    const [ page, setPage ] = useState<Paginated<Order>>(init)
    const [ currentPage, setCurrentPage ] = useState(0)

    useEffect(() => {
        (async () => {
            if (page.page !== currentPage) {
                setPage(await getUserOrders(currentPage, user.id))
            }
        })()
    }, [ currentPage, page.page, user.id ])

    useEffect(() => {
        (async () => {
            setMyUser((await getMyUser())!)
        })()
    }, [])

    return <>
        <Modal show={pointsModal} onClose={() => setPointsModal(false)}>
            <ModalHeader>{t('manage.users.pointsModal.title')}</ModalHeader>
            <ModalBody>
                <p className="mb-5">{t('manage.users.pointsModal.message')}</p>
                <TextInput className="w-full" type="number" value={points}
                           placeholder={t('manage.users.pointsModal.placeholder')}
                           onChange={e => setPoints(e.currentTarget.value)}
                           aria-valuemin={0}/>
                <If condition={points !== '' && Decimal(points).lt(0)}>
                    <p className="text-red-500 mt-3">{t('manage.users.pointsModal.minimum')}</p>
                </If>
            </ModalBody>
            <ModalFooter>
                <Button pill color="warning"
                        disabled={points === '' || loading || Decimal(points).lt(0) || points === user.points.toString()}
                        onClick={async () => {
                            setLoading(true)
                            await setUserPoints(user.id, points)
                            setLoading(false)
                            setPointsModal(false)
                            router.refresh()
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setPointsModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="container">
            <header className="mb-6">
                <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-2">
                    <BreadcrumbItem href="/user" icon={HiCollection}>{t('breadcrumb.manage')}</BreadcrumbItem>
                    <BreadcrumbItem href="/user/manage/users">{t('manage.users.title')}</BreadcrumbItem>
                    <BreadcrumbItem>{user.name}</BreadcrumbItem>
                </Breadcrumb>
                <h1>{user.name}</h1>
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6 mb-8 items-start xl:max-w-5xl">
                <div className="toon p-5 flex items-center gap-4" aria-label={t('manage.users.profile')}>
                    <span className={`h-16 w-16 shrink-0 rounded-full border-toon border-ink font-toon text-3xl flex items-center justify-center
                    ${user.blocked ? 'bg-blush' : 'bg-whale'}`}>{user.name.at(0)}</span>
                    <dl className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 min-w-0">
                        <dt className="secondary text-sm">{t('manage.users.pinyin')}</dt>
                        <dd className="truncate">{user.pinyin}</dd>
                        <dt className="secondary text-sm">{t('manage.users.phone')}</dt>
                        <dd className="truncate">{user.phone ?? t('manage.users.none')}</dd>
                        <dt className="secondary text-sm">{t('manage.users.type')}</dt>
                        <dd>{t(`manage.users.${user.type}`)}</dd>
                    </dl>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <StatTile tone="butter" label={t('manage.users.balance')} value={`¥${user.balance}`}/>
                    <StatTile tone="blush" label={t('manage.users.points')} value={user.points}
                              action={<button className="toon-btn-ghost h-9 text-sm px-4" onClick={() => setPointsModal(true)}>
                                  <HiPencil/>{t('edit')}
                              </button>}/>
                </div>

                <Panel title={t('manage.users.permissions')} icon={HiShieldCheck} className="xl:col-span-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <ToggleSwitch disabled={user.id === myUser?.id || loading}
                                          color="yellow"
                                          checked={user.permissions.includes('admin.manage')} label={t('manage.users.admin')}
                                          onChange={async () => {
                                              setLoading(true)
                                              await toggleUserPermission(user.id, 'admin.manage')
                                              setLoading(false)
                                              router.refresh()
                                          }}/>
                            <p className="secondary text-sm mt-1">{t('manage.users.adminHint')}</p>
                        </div>
                        <div>
                            <ToggleSwitch disabled={user.id === myUser?.id || loading}
                                          color="red"
                                          checked={user.blocked} label={t('manage.users.blocked')}
                                          onChange={async () => {
                                              setLoading(true)
                                              await setUserBlocked(user.id, !user.blocked)
                                              setLoading(false)
                                              router.refresh()
                                          }}/>
                            <p className="secondary text-sm mt-1">{t('manage.users.blockedHint')}</p>
                        </div>
                    </div>
                    <If condition={user.id === myUser?.id}>
                        <p className="text-sm mt-4 bg-butter/30 border-2 border-dashed border-ink/30 rounded-xl px-3 py-2">{t('manage.users.permissionsOwn')}</p>
                    </If>
                </Panel>
            </div>

            <If condition={page.pages >= 1}>
                <div aria-label={t('manage.users.orders')} className="mb-8">
                    <h2 className="mb-3">{t('manage.users.orders')}</h2>
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
                                        <span className="font-toon text-lg">#{order.id}</span>
                                    </TableCell>
                                    <TableCell>
                                        <OrderStatusChips order={order}/>
                                    </TableCell>
                                    <TableCell>
                                        ¥{order.totalPrice}
                                    </TableCell>
                                    <TableCell>
                                        {formatDateTime(order.createdAt)}
                                    </TableCell>
                                    <TableCell>
                                        <Link href={`/user/manage/orders/${order.id}`}>
                                            <Button pill color="warning" size="xs">{t('orders.view')}</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="flex overflow-x-auto sm:justify-center">
                        <If condition={page.pages > 0}>
                            <Pagination previousLabel={t('pagination.previous')} nextLabel={t('pagination.next')} currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                                        totalPages={page.pages}/>
                        </If>
                    </div>
                </div>
            </If>
        </div>
    </>
}
