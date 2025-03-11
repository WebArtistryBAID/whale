'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow
} from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteCategory } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { HydratedCategory } from '@/app/lib/ui-data-actions'
import { Trans } from 'react-i18next/TransWithoutContext'

export default function CategoryViewClient({ object }: { object: HydratedCategory }) {
    const { t } = useTranslationClient('user')
    const [ deleteModal, setDeleteModal ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    return <>
        <Modal show={deleteModal} onClose={() => setDeleteModal(false)}>
            <ModalHeader>{t('manage.storefront.deleteModal.title')}</ModalHeader>
            <ModalBody>
                <p>
                    <Trans t={t} i18nKey="manage.storefront.categoryD.deleteMessage"
                           components={{ 1: <span className="font-bold" id="bold"/> }}/>
                </p>
            </ModalBody>
            <ModalFooter>
                <Button pill color="failure"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true)
                            await deleteCategory(object.id)
                            setLoading(false)
                            setDeleteModal(false)
                            router.push('/user/manage/storefront')
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setDeleteModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="container">
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
                <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.categoriesO')}</BreadcrumbItem>
                <BreadcrumbItem>{object.name}</BreadcrumbItem>
            </Breadcrumb>
            <h1 className="mb-5">{object.name}</h1>
            <div className="2xl:w-1/2 mb-5">
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 mb-3"
                     aria-label={t('manage.storefront.data')}>
                    <p className="secondary text-sm font-display">{t('manage.storefront.tagD.id')}</p>
                    <p className="text-xl mb-3">{object.id}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.tagD.name')}</p>
                    <p className="text-xl">{object.name}</p>
                </div>
            </div>

            <If condition={object.items.length > 0}>
                <div aria-label={t('manage.storefront.categoryD.items')} className="mb-5">
                    <p className="secondary text-sm font-display mb-3">{t('manage.storefront.categoryD.items')}</p>
                    <Table>
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {object.items.map(item => <TableRow className="tr" key={item.id}>
                                <TableCell className="th">{item.id}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                                   href={`/user/manage/storefront/items/${item.id}`}>
                                    {t('manage.storefront.view')}</Button></TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </If>

            <div aria-label={t('manage.storefront.actions')} className="flex gap-3">
                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/items/create?category=${object.id}`}
                        className="inline-block">
                    {t('manage.storefront.categoryD.createItem')}
                </Button>

                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/categories/create?id=${object.id}`}
                        className="inline-block">
                    {t('manage.storefront.edit')}
                </Button>

                <Button pill color="failure" onClick={() => setDeleteModal(true)} className="inline-block">
                    {t('manage.storefront.delete')}
                </Button>
            </div>
        </div>
    </>
}
