'use client'

import { Breadcrumb, BreadcrumbItem, Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteAd } from '@/app/lib/ui-manage-actions'
import { Trans } from 'react-i18next/TransWithoutContext'
import { Ad } from '@/generated/prisma/browser'

export default function AdViewClient({ object, uploadPrefix }: { object: Ad, uploadPrefix: string }) {
    const { t } = useTranslationClient('user')
    const [ deleteModal, setDeleteModal ] = useState(false)
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    return <>
        <Modal show={deleteModal} onClose={() => setDeleteModal(false)}>
            <ModalHeader>{t('manage.storefront.deleteModal.title')}</ModalHeader>
            <ModalBody>
                <p>
                    <Trans t={t} i18nKey="manage.storefront.deleteModal.message"
                           components={{ 1: <span className="font-bold" id="bold"/> }}/>
                </p>
            </ModalBody>
            <ModalFooter>
                <Button pill color="failure"
                        disabled={loading}
                        onClick={async () => {
                            setLoading(true)
                            await deleteAd(object.id)
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
                <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.ads')}</BreadcrumbItem>
                <BreadcrumbItem>{object.id}</BreadcrumbItem>
            </Breadcrumb>
            <h1 className="mb-5">{object.id}</h1>
            <div className="2xl:w-1/2 mb-5">
                <div className="bg-amber-50 dark:bg-amber-900 rounded-3xl p-5 mb-3"
                     aria-label={t('manage.storefront.data')}>
                    <p className="secondary text-sm font-display">{t('manage.storefront.adD.id')}</p>
                    <p className="text-xl mb-3">{object.id}</p>

                    <p className="secondary text-sm font-display">{t('manage.storefront.adD.name')}</p>
                    <p className="mb-3">{object.name}</p>

                    <p className="secondary text-sm font-display mb-1">{t('manage.storefront.adD.image')}</p>
                    <img src={uploadPrefix + object.image} width={500} height={500}
                         alt={t('manage.storefront.adD.alt')}
                         className="w-full lg:max-w-sm object-cover mb-3 rounded-xl"/>

                    <p className="secondary text-sm font-display">{t('manage.storefront.adD.url')}</p>
                    <p className="text-xl"><a href={object.url}
                                              className="inline">{t('manage.storefront.adD.redirect')}</a></p>
                </div>
            </div>

            <div aria-label={t('manage.storefront.actions')} className="flex gap-3">
                <Link href={`/user/manage/storefront/ads/create?id=${object.id}`}>
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
