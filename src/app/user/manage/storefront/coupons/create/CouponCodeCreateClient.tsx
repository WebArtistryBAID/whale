'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, TextInput } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { upsertCouponCode } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { CouponCode } from '@/generated/prisma/browser'
import { money } from '@/app/lib/security'
import { validInventory } from '@/app/lib/item-editor'
import { normalizeCouponCode } from '@/app/lib/coupon-codes'

export default function CouponCodeCreateClient({ editMode = false, existing = null }: {
    editMode?: boolean,
    existing?: CouponCode | null
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')

    const [ id, setID ] = useState(existing?.id == null ? '' : normalizeCouponCode(existing.id))
    const [ value, setValue ] = useState(existing?.value ?? '')
    const [ remainingUses, setRemainingUses ] = useState(existing?.remainingUses.toString() ?? '')
    const [ idError, setIDError ] = useState(false)
    const [ valueError, setValueError ] = useState(false)
    const [ remainingUsesError, setRemainingUsesError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setIDError(false)
        setRemainingUsesError(false)
        setValueError(false)
        if (id.length < 1 || !/^[a-zA-Z0-9]+$/.test(id)) {
            setIDError(true)
            return
        }
        if (!money(value, false)) {
            setValueError(true)
            return
        }
        if (!validInventory(remainingUses) || Number(remainingUses) < 1) {
            setRemainingUsesError(true)
            return
        }
        await run(async () => {
            const normalizedId = normalizeCouponCode(id)
            await upsertCouponCode({
                id: normalizedId,
                value: value,
                remainingUses: parseInt(remainingUses),
                allowedUses: -1
            })
            return `/user/manage/storefront/coupons/${normalizedId}`
        })
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.couponCodes')}</BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.id}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.couponD.edit') : t('manage.storefront.couponD.create')}</h1>

        <form className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="id" value={t('manage.storefront.couponD.id')}/>
                </div>
                <TextInput id="id" type="text" required placeholder={t('manage.storefront.couponD.id') + '...'}
                           color={idError ? 'failure' : undefined} disabled={editMode || loading}
                           value={id} onChange={e => setID(normalizeCouponCode(e.currentTarget.value))}
                           helperText={idError ? t('manage.storefront.couponD.idError') : null}/>
            </div>
            <EditorTextField id="value" label={t('manage.storefront.couponD.value')} value={value}
                             onChange={setValue} error={valueError ? t('manage.storefront.couponD.valueError') : null} disabled={loading}/>
            <EditorTextField id="remainingUses" label={t('manage.storefront.couponD.remainingUses')} value={remainingUses}
                             onChange={setRemainingUses} error={remainingUsesError ? t('manage.storefront.couponD.remainingUsesError') : null} disabled={loading}/>
            <Button color="warning" pill disabled={loading} className="w-full" type="submit"
                    fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
