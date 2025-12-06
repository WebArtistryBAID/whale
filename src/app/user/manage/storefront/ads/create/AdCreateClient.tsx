'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, TextInput } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertAd } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { Ad } from '@/generated/prisma/browser'
import UploadAreaClient from '@/app/user/manage/storefront/upload/UploadAreaClient'

export default function AdCreateClient({ editMode, existing, uploadPrefix }: {
    editMode: boolean,
    existing: Ad | null,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ image, setImage ] = useState(existing?.image ?? '')
    const [ url, setURL ] = useState(existing?.url ?? '')
    const [ nameError, setNameError ] = useState(false)
    const [ imageError, setImageError ] = useState(false)
    const [ urlError, setURLError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        setImageError(false)
        setURLError(false)
        if (name.length < 1 || name.length > 256) {
            setNameError(true)
            return
        }
        try {
            new URL(url)
        } catch {
            setURLError(true)
            return
        }
        if (image === '') {
            setImageError(true)
            return
        }

        setLoading(true)
        const result = await upsertAd(
            existing?.id,
            {
                name,
                image,
                url
            }
        )
        router.push(`/user/manage/storefront/ads/${result.id}`)
        setLoading(false)
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.ads')}</BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.id}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.adD.edit') : t('manage.storefront.adD.create')}</h1>

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="name" value={t('manage.storefront.adD.name')}/>
                </div>
                <TextInput id="name" type="text" required placeholder={t('manage.storefront.adD.name') + '...'}
                           color={nameError ? 'failure' : undefined}
                           value={name} onChange={e => setName(e.currentTarget.value)}
                           helperText={nameError ? t('manage.storefront.adD.nameError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="url" value={t('manage.storefront.adD.url')}/>
                </div>
                <TextInput id="url" type="text" required placeholder={t('manage.storefront.adD.url') + '...'}
                           color={urlError ? 'failure' : undefined}
                           value={url} onChange={e => setURL(e.currentTarget.value)}
                           helperText={urlError ? t('manage.storefront.adD.urlError') : null}/>
            </div>
            <div className="w-full" aria-label={t('manage.storefront.adD.image')}>
                <UploadAreaClient uploadPrefix={uploadPrefix} onDone={path => setImage(path)}/>
                <If condition={imageError}>
                    <p className="text-red-500 mt-2 text-sm">{t('manage.storefront.adD.imageError')}</p>
                </If>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

AdCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
