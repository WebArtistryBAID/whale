'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, TextInput } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCategory } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { Category } from '@/generated/prisma/browser'

export default function CategoryCreateClient({ editMode, existing }: {
    editMode: boolean,
    existing: Category | null
}) {
    const { t } = useTranslationClient('user')
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ nameError, setNameError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        if (name.length < 1 || name.length > 48) {
            setNameError(true)
            return
        }
        setLoading(true)
        const result = await upsertCategory(
            existing?.id,
            {
                name
            }
        )
        router.push(`/user/manage/storefront/categories/${result.id}`)
        setLoading(false)
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

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="name" value={t('manage.storefront.categoryD.name')}/>
                </div>
                <TextInput id="name" type="text" required placeholder={t('manage.storefront.categoryD.name') + '...'}
                           color={nameError ? 'failure' : undefined}
                           value={name} onChange={e => setName(e.currentTarget.value)}
                           helperText={nameError ? t('manage.storefront.categoryD.nameError') : null}/>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

CategoryCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
