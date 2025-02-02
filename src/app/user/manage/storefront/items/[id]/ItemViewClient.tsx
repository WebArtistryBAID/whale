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
import { deleteItemType } from '@/app/lib/ui-manage-actions'
import { HydratedItemType } from '@/app/lib/ui-data-actions'
import Image from 'next/image'
import If from '@/app/lib/If'

export default function ItemViewClient({ object, categoryName, uploadPrefix }: {
    object: HydratedItemType,
    categoryName: string,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const [ deleteModal, setDeleteModal ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    return <>
        <Modal show={deleteModal} onClose={() => setDeleteModal(false)}>
            <ModalHeader>{t('manage.storefront.deleteModal.title')}</ModalHeader>
            <ModalBody>
                <p>{t('manage.storefront.deleteModal.message')}</p>
            </ModalBody>
            <ModalFooter>
                <Button pill color="failure"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true)
                            await deleteItemType(object.id)
                            setLoading(false)
                            setDeleteModal(false)
                            router.push(`/user/manage/storefront/categories/${object.categoryId}`)
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setDeleteModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="container">
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
                <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.categoriesO')}</BreadcrumbItem>
                <BreadcrumbItem
                    href={`/user/manage/storefront/categories/${object.categoryId}`}>{categoryName}</BreadcrumbItem>
                <BreadcrumbItem>{object.name}</BreadcrumbItem>
            </Breadcrumb>
            <h1 className="mb-5">{object.name}</h1>
            <div className="2xl:w-1/2 mb-5">
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 mb-3"
                     aria-label={t('manage.storefront.data')}>
                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.id')}</p>
                    <p className="text-xl mb-3">{object.id}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.name')}</p>
                    <p className="text-xl mb-3">{object.name}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.category')}</p>
                    <p className="text-xl mb-3">{categoryName}</p>

                    <p className="secondary text-sm font-display mb-1">{t('manage.storefront.itemD.image')}</p>
                    <Image src={uploadPrefix + object.image} width={500} height={500}
                           alt={t('manage.storefront.itemD.alt')}
                           className="w-full lg:max-w-sm object-cover mb-3 rounded-xl"/>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.description')}</p>
                    <p className="mb-3">{object.description}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.shortDescription')}</p>
                    <p className="text-xl mb-3">{object.shortDescription}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.basePrice')}</p>
                    <p className="text-xl mb-3">{object.basePrice}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.salePercent')}</p>
                    <p className="text-xl mb-3">{object.salePercent}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.itemD.soldOut')}</p>
                    <p className="text-xl">{object.soldOut ? t('yes') : t('no')}</p>
                </div>
            </div>

            <If condition={object.tags.length > 0}>
                <div aria-label={t('manage.storefront.itemD.tags')} className="mb-5">
                    <p aria-hidden
                       className="secondary text-sm font-display mb-3">{t('manage.storefront.itemD.tags')}</p>
                    <Table>
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {object.tags.map(item => <TableRow className="tr" key={item.id}>
                                <TableCell className="th">{item.id}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                                   href={`/user/manage/storefront/tags/${item.id}`}>
                                    {t('manage.storefront.view')}</Button></TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </If>

            <If condition={object.options.length > 0}>
                <div aria-label={t('manage.storefront.itemD.options')} className="mb-5">
                    <p aria-hidden
                       className="secondary text-sm font-display mb-3">{t('manage.storefront.itemD.options')}</p>
                    <Table>
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {object.options.map(item => <TableRow className="tr" key={item.id}>
                                <TableCell className="th">{item.id}</TableCell>
                                <TableCell>{item.name}</TableCell>
                                <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                                   href={`/user/manage/storefront/option-types/${item.id}`}>
                                    {t('manage.storefront.view')}</Button></TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </div>
            </If>

            <div aria-label={t('manage.storefront.actions')} className="flex gap-3">
                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/categories/${object.categoryId}`}
                        className="inline-block">
                    {t('manage.storefront.itemD.back')}
                </Button>

                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/items/create?id=${object.id}&category=${object.categoryId}`}
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
