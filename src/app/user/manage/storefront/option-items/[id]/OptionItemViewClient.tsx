'use client'

import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteOptionItem } from '@/app/lib/ui-manage-actions'
import { OptionItem } from '@/generated/prisma/browser'

export default function OptionItemViewClient({ object, typeName }: { object: OptionItem, typeName: string }) {
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
                            await deleteOptionItem(object.id)
                            setLoading(false)
                            setDeleteModal(false)
                            router.push(`/user/manage/storefront/option-types/${object.typeId}`)
                        }}>{t('confirm')}</Button>
                <Button pill color="gray" onClick={() => setDeleteModal(false)}>{t('cancel')}</Button>
            </ModalFooter>
        </Modal>

        <div className="container">
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
                <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.optionTypes')}</BreadcrumbItem>
                <BreadcrumbItem
                    href={`/user/manage/storefront/option-types/${object.typeId}`}>{typeName}</BreadcrumbItem>
                <BreadcrumbItem>{object.name}</BreadcrumbItem>
            </Breadcrumb>
            <h1 className="mb-5">{object.name}</h1>
            <div className="2xl:w-1/2 mb-5">
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 mb-3"
                     aria-label={t('manage.storefront.data')}>
                    <p className="secondary text-sm font-display">{t('manage.storefront.optionItemD.id')}</p>
                    <p className="text-xl mb-3">{object.id}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.optionItemD.name')}</p>
                    <p className="text-xl mb-3">{object.name}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.optionItemD.priceChange')}</p>
                    <p className="text-xl mb-3">{object.priceChange}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.optionItemD.soldOut')}</p>
                    <p className="text-xl mb-3">{object.soldOut ? t('yes') : t('no')}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.optionItemD.default')}</p>
                    <p className="text-xl">{object.default ? t('yes') : t('no')}</p>
                </div>
            </div>

            <div aria-label={t('manage.storefront.actions')} className="flex gap-3">
                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/option-types/${object.typeId}`}
                        className="inline-block">
                    {t('manage.storefront.optionItemD.back')}
                </Button>

                <Button pill color="warning" as={Link}
                        href={`/user/manage/storefront/option-items/create?id=${object.id}&type=${object.typeId}`}
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
