'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useRef, useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { upsertAd } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { Ad } from '@/generated/prisma/browser'
import UploadAreaClient from '@/app/user/manage/storefront/upload/UploadAreaClient'

export default function AdCreateClient({ editMode = false, existing = null, uploadPrefix }: {
    editMode?: boolean,
    existing?: Ad | null,
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ image, setImage ] = useState(existing?.image ?? '')
    const [uploadBusy, setUploadBusy] = useState(false)
    const uploading = useRef(false)
    const [ url, setURL ] = useState(existing?.url ?? '')
    const [ nameError, setNameError ] = useState(false)
    const [ imageError, setImageError ] = useState(false)
    const [ urlError, setURLError ] = useState(false)

    async function submit() {
        if (loading || uploading.current) {
            return
        }
        setNameError(false)
        setImageError(false)
        setURLError(false)
        if (name.trim().length < 1 || name.length > 256) {
            setNameError(true)
            return
        }
        try {
            if (!['http:', 'https:'].includes(new URL(url).protocol)) throw new Error('Invalid link')
        } catch {
            setURLError(true)
            return
        }
        if (image === '') {
            setImageError(true)
            return
        }

        await run(async () => {
            const result = await upsertAd(
                existing?.id,
                {
                    name,
                    image,
                    url
                }
            )
            return `/user/manage/storefront/ads/${result.id}`
        })
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

        <form className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            <EditorTextField id="name" label={t('manage.storefront.adD.name')} value={name}
                             onChange={setName} error={nameError ? t('manage.storefront.adD.nameError') : null} disabled={loading}/>
            <EditorTextField id="url" label={t('manage.storefront.adD.url')} value={url}
                             onChange={setURL} error={urlError ? t('manage.storefront.adD.urlError') : null} disabled={loading}/>
            <div className="w-full" aria-label={t('manage.storefront.adD.image')}>
                <UploadAreaClient uploadPrefix={uploadPrefix} initialPath={image} disabled={loading}
                                  onBusyChange={busy => { uploading.current = busy; setUploadBusy(busy) }} onDone={path => setImage(path)}/>
                <If condition={imageError}>
                    <p className="text-red-500 mt-2 text-sm">{t('manage.storefront.adD.imageError')}</p>
                </If>
            </div>
            <Button color="warning" pill disabled={loading || uploadBusy} className="w-full" type="submit"
                    fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
