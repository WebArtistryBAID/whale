'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem, Button, Label, Select, ToggleSwitch } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useRef, useState } from 'react'
import { upsertItemType } from '@/app/lib/ui-manage-actions'
import type { Category, Tag } from '@/generated/prisma/browser'
import type { HydratedItemType, HydratedOptionType } from '@/app/lib/ui-data-actions'
import { validateItem, type ItemEditorValues, type ItemEditorErrors } from '@/app/lib/item-editor'
import UploadAreaClient from '@/app/user/manage/storefront/upload/UploadAreaClient'
import { EditorChoices, EditorTextField } from '@/app/user/manage/storefront/editor/EditorFields'
import { useStorefrontMutation } from '@/app/user/manage/storefront/editor/useStorefrontMutation'

export default function ItemCreateClient({ existing = null, availableCategories, currentCategory, availableTags, availableOptions, uploadPrefix }: {
    existing?: HydratedItemType | null
    availableCategories: Category[]
    currentCategory: number
    availableTags: Tag[]
    availableOptions: HydratedOptionType[]
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const { loading, run } = useStorefrontMutation('save')
    const formRef = useRef<HTMLFormElement>(null)
    const uploading = useRef(false)
    const [uploadBusy, setUploadBusy] = useState(false)
    const [errors, setErrors] = useState<ItemEditorErrors>({})
    const [values, setValues] = useState<ItemEditorValues>(() => ({
        name: existing?.name ?? '', categoryId: existing?.categoryId ?? currentCategory,
        image: existing?.image ?? '', description: existing?.description ?? '', shortDescription: existing?.shortDescription ?? '',
        basePrice: existing?.basePrice ?? '', salePercent: existing?.salePercent ?? '1',
        countsTowardLimit: existing?.countsTowardLimit ?? true, inventoryTrackingEnabled: existing?.inventoryTrackingEnabled ?? false,
        remainingItems: String(existing?.remainingItems ?? 0), soldOut: existing?.soldOut ?? false,
        tagIds: existing?.tags.map(tag => tag.id) ?? [], optionTypeIds: existing?.options.map(option => option.id) ?? []
    }))
    const category = availableCategories.find(category => category.id === (existing?.categoryId ?? currentCategory))
    const editMode = existing != null
    const disabled = loading || uploadBusy

    function setField<K extends keyof ItemEditorValues>(key: K, value: ItemEditorValues[K]) {
        setValues(current => ({ ...current, [key]: value }))
        setErrors(current => ({ ...current, [key]: false }))
    }

    async function submit() {
        if (loading || uploading.current) return
        const submittedValues = values.inventoryTrackingEnabled ? values : { ...values, remainingItems: String(existing?.remainingItems ?? 0) }
        const nextErrors = validateItem(submittedValues)
        if (!availableCategories.some(category => category.id === values.categoryId)) nextErrors.categoryId = true
        if (values.tagIds.some(id => !availableTags.some(tag => tag.id === id))) nextErrors.tagIds = true
        if (values.optionTypeIds.some(id => !availableOptions.some(option => option.id === id))) nextErrors.optionTypeIds = true
        setErrors(nextErrors)
        const firstError = Object.keys(nextErrors)[0]
        if (firstError) {
            const controlId = firstError === 'categoryId' ? 'category' : firstError
            requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`#${controlId}`)?.focus())
            return
        }
        await run(async () => {
            const result = await upsertItemType(existing?.id, {
                ...submittedValues, name: values.name.trim(), remainingItems: Number(submittedValues.remainingItems),
                initialRemainingItems: existing?.remainingItems
            })
            return `/user/manage/storefront/items/${result.id}`
        })
    }

    function textField(key: 'name' | 'shortDescription' | 'description' | 'basePrice' | 'salePercent' | 'remainingItems', multiline = false) {
        return <EditorTextField key={key} id={key} label={t(`manage.storefront.itemD.${key}`)} value={values[key]}
                                onChange={value => setField(key, value)} disabled={loading} multiline={multiline}
                                type={key === 'remainingItems' ? 'number' : 'text'} min={key === 'remainingItems' ? 0 : undefined}
                                error={errors[key] ? t(`manage.storefront.itemD.${key}Error`) : null}/>
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.categoriesO')}</BreadcrumbItem>
            <BreadcrumbItem href={`/user/manage/storefront/categories/${category?.id ?? currentCategory}`}>{category?.name}</BreadcrumbItem>
            <BreadcrumbItem>{existing?.name ?? t('manage.storefront.create')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.itemD.edit') : t('manage.storefront.itemD.create')}</h1>
        <form ref={formRef} className="2xl:w-1/2 flex flex-col gap-4" noValidate onSubmit={event => { event.preventDefault(); void submit() }}>
            {textField('name')}
            <div className="w-full">
                <div className="mb-2"><Label htmlFor="category" value={t('manage.storefront.itemD.category')}/></div>
                <Select id="category" required color={errors.categoryId ? 'failure' : undefined} disabled={loading}
                        value={values.categoryId} onChange={event => setField('categoryId', Number(event.currentTarget.value))}
                        aria-invalid={!!errors.categoryId} helperText={errors.categoryId ? t('manage.storefront.itemD.categoryError') : null}>
                    {availableCategories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </Select>
            </div>
            <div className="w-full" id="image" tabIndex={-1} aria-label={t('manage.storefront.itemD.image')}>
                <UploadAreaClient uploadPrefix={uploadPrefix} initialPath={values.image} disabled={loading}
                                  onBusyChange={busy => { uploading.current = busy; setUploadBusy(busy) }}
                                  onDone={path => setField('image', path)}/>
                {errors.image && <p className="text-red-500 mt-2 text-sm">{t('manage.storefront.itemD.imageError')}</p>}
            </div>
            {textField('shortDescription')}
            {textField('description', true)}
            {textField('basePrice')}
            {textField('salePercent')}
            <div className="w-full"><ToggleSwitch checked={values.countsTowardLimit} disabled={loading}
                label={t('manage.storefront.itemD.countsTowardLimit')} onChange={value => setField('countsTowardLimit', value)} color="yellow"/></div>
            <div className="w-full"><ToggleSwitch checked={values.inventoryTrackingEnabled} disabled={loading}
                label={t('manage.storefront.itemD.inventoryTrackingEnabled')} onChange={value => setField('inventoryTrackingEnabled', value)} color="yellow"/></div>
            {values.inventoryTrackingEnabled ? textField('remainingItems') : <div className="w-full">
                <ToggleSwitch checked={values.soldOut} disabled={loading} label={t('manage.storefront.itemD.soldOut')}
                              onChange={value => setField('soldOut', value)} color="yellow"/>
            </div>}
            <EditorChoices id="tag" label={t('manage.storefront.itemD.tags')} choices={availableTags}
                           selected={values.tagIds} onChange={value => setField('tagIds', value)} disabled={loading}/>
            <EditorChoices id="option" label={t('manage.storefront.itemD.options')} choices={availableOptions}
                           selected={values.optionTypeIds} onChange={value => setField('optionTypeIds', value)} disabled={loading}/>
            <Button type="submit" color="warning" pill disabled={disabled} className="w-full" fullSized>{t('confirm')}</Button>
        </form>
    </div>
}
