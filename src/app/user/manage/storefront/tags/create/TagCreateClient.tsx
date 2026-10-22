'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useRef, useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { upsertTag } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { Tag } from '@/generated/prisma/browser'

export default function TagCreateClient({ editMode = false, existing = null }: {
    editMode?: boolean,
    existing?: Tag | null
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ color, setColor ] = useState(existing?.color ?? '#000000')
    const [ nameError, setNameError ] = useState(false)
    const [ colorError, setColorError ] = useState(false)
    const ref = useRef<HTMLInputElement>(null)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        setColorError(false)
        if (name.trim().length < 1 || name.length > 10) {
            setNameError(true)
            return
        }
        if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
            setColorError(true)
            return
        }
        await run(async () => {
            const result = await upsertTag(
                existing?.id,
                {
                    name,
                    color
                }
            )
            return `/user/manage/storefront/tags/${result.id}`
        })
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.tags')}</BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.name}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.tagD.edit') : t('manage.storefront.tagD.create')}</h1>

        <form className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            <EditorTextField id="name" label={t('manage.storefront.tagD.name')} value={name}
                             onChange={setName} error={nameError ? t('manage.storefront.tagD.nameError') : null} disabled={loading}/>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="color" value={t('manage.storefront.tagD.color')}/>
                </div>
                <div className="relative">
                    <button type="button" disabled={loading} id="color" className="rounded-full h-8 w-8" onClick={() => ref.current?.click()}
                            style={{ backgroundColor: color }}
                            aria-label={t('manage.storefront.tagD.pickColor') + ': ' + color}>
                    </button>
                    <input type="color" disabled={loading} required aria-hidden className="opacity-0 -z-10 absolute top-0 left-0" ref={ref}
                           placeholder={t('manage.storefront.tagD.color') + '...'}
                           color={colorError ? 'failure' : undefined}
                           value={color} onChange={e => setColor(e.currentTarget.value)}/>
                </div>

            </div>
            <Button color="warning" pill disabled={loading} className="w-full" type="submit"
                    fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
