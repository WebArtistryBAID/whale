'use client'

import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader
} from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { deleteItemType } from '@/app/lib/ui-manage-actions'
import { HydratedItemType } from '@/app/lib/ui-data-actions'
import { DetailFields, RelatedRecordsTable } from '@/app/user/manage/storefront/editor/DetailFields'

export default function ItemViewClient({ object, categoryName, uploadPrefix }: {
    object: HydratedItemType,
    categoryName: string,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const [ deleteModal, setDeleteModal ] = useState(false)
    const { loading, run } = useStorefrontMutation('delete')

    return <>
        <Modal show={deleteModal} onClose={() => { if (!loading) setDeleteModal(false) }}>
            <ModalHeader>{t('manage.storefront.deleteModal.title')}</ModalHeader>
            <ModalBody>
                <p>{t('manage.storefront.deleteModal.message')}</p>
            </ModalBody>
            <ModalFooter>
                <Button pill color="failure"
                        disabled={loading}
                        onClick={async () => {
                            await run(async () => {
                                await deleteItemType(object.id)
                                setDeleteModal(false)
                                return `/user/manage/storefront/categories/${object.categoryId}`
                            })
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" disabled={loading} onClick={() => setDeleteModal(false)}>{t('cancel')}</Button>
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
                    <DetailFields fields={[
                        { key: 'id', label: t('manage.storefront.itemD.id'), value: object.id },
                        { key: 'name', label: t('manage.storefront.itemD.name'), value: object.name },
                        { key: 'category', label: t('manage.storefront.itemD.category'), value: categoryName }
                    ]}/>

                    <p className="secondary text-sm font-display mb-1">{t('manage.storefront.itemD.image')}</p>
                    <img src={uploadPrefix + object.image} width={500} height={500}
                         alt={t('manage.storefront.itemD.alt')}
                         className="w-full lg:max-w-sm object-cover mb-3 rounded-xl"/>

                    <DetailFields fields={[
                        { key: 'description', label: t('manage.storefront.itemD.description'), value: object.description, valueClass: 'mb-3' },
                        ...(['shortDescription', 'basePrice', 'salePercent'] as const).map(key => ({ key, label: t(`manage.storefront.itemD.${key}`), value: object[key] })),
                        ...(['countsTowardLimit', 'inventoryTrackingEnabled'] as const).map(key => ({ key, label: t(`manage.storefront.itemD.${key}`), value: object[key] ? t('yes') : t('no') })),
                        object.inventoryTrackingEnabled
                            ? { key: 'remainingItems', label: t('manage.storefront.itemD.remainingItems'), value: object.remainingItems, valueClass: 'text-xl' }
                            : { key: 'soldOut', label: t('manage.storefront.itemD.soldOut'), value: object.soldOut ? t('yes') : t('no'), valueClass: 'text-xl' }
                    ]}/>
                </div>
            </div>

            <RelatedRecordsTable label={t('manage.storefront.itemD.tags')} records={object.tags} section="tags"/>
            <RelatedRecordsTable label={t('manage.storefront.itemD.options')} records={object.options} section="option-types"/>

            <div aria-label={t('manage.storefront.actions')} className="flex gap-3">
                <Link href={`/user/manage/storefront/categories/${object.categoryId}`}>
                    <Button pill color="warning"
                            className="inline-block">
                        {t('manage.storefront.itemD.back')}
                    </Button>
                </Link>

                <Link replace href={`/user/manage/storefront/items/create?id=${object.id}&category=${object.categoryId}`}>
                    <Button pill color="warning"
                            className="inline-block">
                        {t('manage.storefront.edit')}
                    </Button>
                </Link>

                <Button pill color="failure" onClick={() => setDeleteModal(true)} className="inline-block">
                    {t('manage.storefront.delete')}
                </Button>
            </div>
        </div>
    </>
}
