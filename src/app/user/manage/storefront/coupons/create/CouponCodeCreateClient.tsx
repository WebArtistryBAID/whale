'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, TextInput } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertCouponCode } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { CouponCode } from '@/generated/prisma/browser'

export default function CouponCodeCreateClient({ editMode, existing }: {
    editMode: boolean,
    existing: CouponCode | null
}) {
    const { t } = useTranslationClient('user')
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    const [ id, setID ] = useState(existing?.id ?? '')
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
        if (isNaN(parseFloat(value)) || parseFloat(value) < 0.01) {
            setValueError(true)
            return
        }
        if (isNaN(parseInt(remainingUses)) || parseInt(remainingUses) < 1) {
            setRemainingUsesError(true)
            return
        }
        setLoading(true)
        await upsertCouponCode({
            id,
            value: value,
            remainingUses: parseInt(remainingUses),
            allowedUses: -1
        })
        router.push(`/user/manage/storefront/coupons/${id}`)
        setLoading(false)
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

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="id" value={t('manage.storefront.couponD.id')}/>
                </div>
                <TextInput id="id" type="text" required placeholder={t('manage.storefront.couponD.id') + '...'}
                           color={idError ? 'failure' : undefined} disabled={editMode}
                           value={id} onChange={e => setID(e.currentTarget.value)}
                           helperText={idError ? t('manage.storefront.couponD.idError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="value" value={t('manage.storefront.couponD.value')}/>
                </div>
                <TextInput id="value" type="text" required placeholder={t('manage.storefront.couponD.value') + '...'}
                           color={valueError ? 'failure' : undefined}
                           value={value} onChange={e => setValue(e.currentTarget.value)}
                           helperText={valueError ? t('manage.storefront.couponD.valueError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="remainingUses" value={t('manage.storefront.couponD.remainingUses')}/>
                </div>
                <TextInput id="remainingUses" type="text" required
                           placeholder={t('manage.storefront.couponD.remainingUses') + '...'}
                           color={remainingUsesError ? 'failure' : undefined}
                           value={remainingUses} onChange={e => setRemainingUses(e.currentTarget.value)}
                           helperText={remainingUsesError ? t('manage.storefront.couponD.remainingUsesError') : null}/>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

CouponCodeCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
