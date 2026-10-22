'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, Select, ToggleSwitch } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'
import { upsertOptionItem } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { money } from '@/app/lib/security'
import { OptionItem, OptionType } from '@/generated/prisma/browser'

export default function OptionItemCreateClient({ editMode = false, existing = null, currentType, availableTypes }: {
    editMode?: boolean,
    existing?: OptionItem | null,
    currentType: number,
    availableTypes: OptionType[]
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')

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
        if (name.trim().length < 1 || name.length > 48) {
            setNameError(true)
            return
        }
        if (!availableTypes.find(t => t.id === type)) {
            setTypeError(true)
            return
        }
        if (!money(priceChange.replace(/^-/, ''))) {
            setPriceChangeError(true)
            return
        }
        await run(async () => {
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
            return `/user/manage/storefront/option-items/${result.id}`
        })
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

        <form className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            <EditorTextField id="name" label={t('manage.storefront.optionItemD.name')} value={name}
                             onChange={setName} error={nameError ? t('manage.storefront.optionItemD.nameError') : null} disabled={loading}/>
            <div className="w-full">
                <div className="mb-2"><Label htmlFor="type" value={t('manage.storefront.optionItemD.type')}/></div>
                <Select id="type" disabled={loading} required color={typeError ? 'failure' : undefined} value={type}
                        onChange={event => setType(Number(event.currentTarget.value))}
                        helperText={typeError ? t('manage.storefront.optionItemD.typeError') : null}>
                    {availableTypes.map(optionType => <option key={optionType.id} value={optionType.id}>{optionType.name}</option>)}
                </Select>
            </div>
            <EditorTextField id="priceChange" label={t('manage.storefront.optionItemD.priceChange')} value={priceChange}
                             onChange={setPriceChange} error={priceChangeError ? t('manage.storefront.optionItemD.priceChangeError') : null} disabled={loading}/>
            <div className="w-full">
                <ToggleSwitch disabled={loading} checked={soldOut} label={t('manage.storefront.optionItemD.soldOut')}
                              onChange={setSoldOut} color="yellow"/>
            </div>
            <div className="w-full">
                <ToggleSwitch disabled={loading} checked={isDefault} label={t('manage.storefront.optionItemD.default')}
                              onChange={setDefault} color="yellow"/>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" type="submit"
                    fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
