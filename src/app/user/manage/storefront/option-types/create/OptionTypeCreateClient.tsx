'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, TextInput } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertOptionType } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { OptionType } from '@/generated/prisma/browser'

export default function OptionTypeCreateClient({ editMode, existing }: {
    editMode: boolean,
    existing: OptionType | null
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
        const result = await upsertOptionType(
            existing?.id,
            {
                name
            }
        )
        router.push(`/user/manage/storefront/option-types/${result.id}`)
        setLoading(false)
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.optionTypes')}</BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.name}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.optionTypeD.edit') : t('manage.storefront.optionTypeD.create')}</h1>

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="name" value={t('manage.storefront.optionTypeD.name')}/>
                </div>
                <TextInput id="name" type="text" required placeholder={t('manage.storefront.optionTypeD.name') + '...'}
                           color={nameError ? 'failure' : undefined}
                           value={name} onChange={e => setName(e.currentTarget.value)}
                           helperText={nameError ? t('manage.storefront.optionTypeD.nameError') : null}/>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

OptionTypeCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
