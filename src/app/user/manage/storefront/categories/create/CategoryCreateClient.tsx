'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { upsertCategory } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { Category } from '@/generated/prisma/browser'

export default function CategoryCreateClient({ editMode = false, existing = null }: {
    editMode?: boolean,
    existing?: Category | null
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ nameError, setNameError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        if (name.trim().length < 1 || name.length > 48) {
            setNameError(true)
            return
        }
        await run(async () => {
            const result = await upsertCategory(
                existing?.id,
                {
                    name
                }
            )
            return `/user/manage/storefront/categories/${result.id}`
        })
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.categoriesO')}</BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.name}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.categoryD.edit') : t('manage.storefront.categoryD.create')}</h1>

        <form className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            <EditorTextField id="name" label={t('manage.storefront.categoryD.name')} value={name}
                             onChange={setName} error={nameError ? t('manage.storefront.categoryD.nameError') : null} disabled={loading}/>
            <Button color="warning" pill disabled={loading} className="w-full" type="submit"
                    fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
