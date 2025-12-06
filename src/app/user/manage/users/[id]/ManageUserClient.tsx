'use client'

import { Order, User } from '@/generated/prisma/browser'
import {
    Badge,
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
import { HiCollection, HiHashtag, HiPencil } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getMyUser, toggleUserPermission } from '@/app/login/login-actions'
import Paginated from '@/app/lib/Paginated'
import { getMyOrders } from '@/app/lib/user-actions'
import Link from 'next/link'
import Decimal from 'decimal.js'
import { setUserPoints } from '@/app/lib/order-manage-actions'

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
                setPage(await getMyOrders(currentPage))
            }
        })()
    }, [ currentPage, page.page ])

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
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
                <BreadcrumbItem href="/user" icon={HiCollection}>{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/users">{t('manage.users.title')}</BreadcrumbItem>
                <BreadcrumbItem>{user.name}</BreadcrumbItem>
            </Breadcrumb>
            <h1 className="mb-5">{user.name}</h1>

            <div className="2xl:w-1/2 mb-8">
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5" aria-label={t('manage.users.profile')}>
                    <p className="secondary text-sm font-display">{t('manage.users.name')}</p>
                    <p className="text-xl mb-3">{user.name}</p>

                    <p className="secondary text-sm font-display">{t('manage.users.pinyin')}</p>
                    <p className="text-xl mb-3">{user.pinyin}</p>

                    <p className="secondary text-sm font-display">{t('manage.users.phone')}</p>
                    <p className="text-xl mb-3">{user.phone ?? t('manage.users.none')}</p>

                    <p className="secondary text-sm font-display">{t('manage.users.type')}</p>
                    <p className="text-xl mb-3">{t(`manage.users.${user.type}`)}</p>

                    <p className="secondary text-sm font-display">{t('manage.users.points')}</p>
                    <p className="text-xl mb-3 flex items-center gap-3">
                        {user.points}
                        <button className="btn-icon-only h-6 w-6" onClick={() => setPointsModal(true)}
                                aria-label={t('edit')}><HiPencil
                            className="text-lg"/></button>
                    </p>

                    <p className="secondary text-sm font-display">{t('manage.users.balance')}</p>
                    <p className="text-xl mb-3">¥{user.balance}</p>

                    <p className="secondary text-sm font-display mb-1">{t('manage.users.permissions')}</p>
                    <ToggleSwitch className="mb-3" disabled={user.id === myUser?.id || loading}
                                  color="yellow"
                                  checked={user.permissions.includes('admin.manage')} label={t('manage.users.admin')}
                                  onChange={async () => {
                                      setLoading(true)
                                      await toggleUserPermission(user.id, 'admin.manage')
                                      setLoading(false)
                                      router.refresh()
                                  }}/>
                    <If condition={user.id === myUser?.id}>
                        <p className="secondary text-sm">{t('manage.users.permissionsOwn')}</p>
                    </If>
                </div>
            </div>

            <If condition={page.pages >= 1}>
                <div aria-label={t('manage.users.orders')} className="mb-8">
                    <p className="secondary text-sm font-display mb-3">{t('manage.users.orders')}</p>
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
                            <Pagination currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                                        totalPages={page.pages}/>
                        </If>
                    </div>
                </div>
            </If>
        </div>
    </>
}
