'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, Select, TextInput, ToggleSwitch } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertOptionItem } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { OptionItem, OptionType } from '@/generated/prisma/browser'

export default function OptionItemCreateClient({ editMode, existing, currentType, availableTypes }: {
    editMode: boolean,
    existing: OptionItem | null,
    currentType: number,
    availableTypes: OptionType[]
}) {
    const { t } = useTranslationClient('user')
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ type, setType ] = useState(existing?.typeId ?? currentType)
    const [ priceChange, setPriceChange ] = useState(existing?.priceChange ?? '0')
    const [ soldOut, setSoldOut ] = useState(existing?.soldOut ?? false)
    const [ isDefault, setDefault ] = useState(existing?.default ?? false)
    const [ nameError, setNameError ] = useState(false)
    const [ typeError, setTypeError ] = useState(false)
    const [ priceChangeError, setPriceChangeError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        setPriceChangeError(false)
        setTypeError(false)
        if (name.length < 1 || name.length > 48) {
            setNameError(true)
            return
        }
        if (!availableTypes.find(t => t.id === type)) {
            setTypeError(true)
            return
        }
        if (isNaN(parseFloat(priceChange))) {
            setPriceChangeError(true)
            return
        }
        setLoading(true)
        const result = await upsertOptionItem(existing?.id,
            {
                name,
                type: {
                    connect: {
                        id: type
                    }
                },
                priceChange: priceChange,
                soldOut,
                default: isDefault
            })
        router.push(`/user/manage/storefront/option-items/${result.id}`)
        setLoading(false)
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.optionTypes')}</BreadcrumbItem>
            <BreadcrumbItem
                href={`/user/manage/storefront/option-types/${existing?.typeId ?? currentType}`}>
                {availableTypes.find(s => s.id === (existing?.typeId ?? currentType))!.name}
            </BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.name}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.optionItemD.edit') : t('manage.storefront.optionItemD.create')}</h1>

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="name" value={t('manage.storefront.optionItemD.name')}/>
                </div>
                <TextInput id="name" type="text" required placeholder={t('manage.storefront.optionItemD.name') + '...'}
                           color={nameError ? 'failure' : undefined}
                           value={name} onChange={e => setName(e.currentTarget.value)}
                           helperText={nameError ? t('manage.storefront.optionItemD.nameError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="type" value={t('manage.storefront.optionItemD.type')}/>
                </div>
                <Select id="type" required color={typeError ? 'failure' : undefined}
                        value={type} onChange={e => setType(parseInt(e.currentTarget.value))}
                        helperText={typeError ? t('manage.storefront.optionItemD.typeError') : null}>
                    {availableTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="priceChange" value={t('manage.storefront.optionItemD.priceChange')}/>
                </div>
                <TextInput id="priceChange" type="text" required
                           placeholder={t('manage.storefront.optionItemD.priceChange') + '...'}
                           color={priceChangeError ? 'failure' : undefined}
                           value={priceChange} onChange={e => setPriceChange(e.currentTarget.value)}
                           helperText={priceChangeError ? t('manage.storefront.optionItemD.priceChangeError') : null}/>
            </div>
            <div className="w-full">
                <ToggleSwitch checked={soldOut} label={t('manage.storefront.optionItemD.soldOut')}
                              onChange={setSoldOut} color="yellow"/>
            </div>
            <div className="w-full">
                <ToggleSwitch checked={isDefault} label={t('manage.storefront.optionItemD.default')}
                              onChange={setDefault} color="yellow"/>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

OptionItemCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
