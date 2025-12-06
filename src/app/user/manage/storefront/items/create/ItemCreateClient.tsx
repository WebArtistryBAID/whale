'use client'

import { useTranslationClient } from '@/app/i18n/client'
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Checkbox,
    Label,
    Select,
    Textarea,
    TextInput,
    ToggleSwitch
} from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upsertItemType } from '@/app/lib/ui-manage-actions'
import If from '@/app/lib/If'
import { Category, Tag } from '@/generated/prisma/browser'
import { HydratedItemType, HydratedOptionType } from '@/app/lib/ui-data-actions'
import UploadAreaClient from '@/app/user/manage/storefront/upload/UploadAreaClient'

export default function ItemCreateClient({
                                             editMode,
                                             existing,
                                             availableCategories,
                                             currentCategory,
                                             availableTags,
                                             availableOptions,
                                             uploadPrefix
                                         }: {
    editMode: boolean,
    existing: HydratedItemType | null,
    availableCategories: Category[],
    currentCategory: number,
    availableTags: Tag[],
    availableOptions: HydratedOptionType[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const [ loading, setLoading ] = useState(false)
    const router = useRouter()

    const [ name, setName ] = useState(existing?.name ?? '')
    const [ category, setCategory ] = useState(existing?.categoryId ?? currentCategory)
    const [ image, setImage ] = useState(existing?.image ?? '')
    const [ description, setDescription ] = useState(existing?.description ?? '')
    const [ shortDescription, setShortDescription ] = useState(existing?.shortDescription ?? '')
    const [ basePrice, setBasePrice ] = useState(existing?.basePrice ?? '')
    const [ salePercent, setSalePercent ] = useState(existing?.salePercent ?? '')
    const [ soldOut, setSoldOut ] = useState(existing?.soldOut ?? false)
    const [ tags, setTags ] = useState(existing?.tags.map(t => t.id) ?? [])
    const [ options, setOptions ] = useState(existing?.options.map(o => o.id) ?? [])

    const [ nameError, setNameError ] = useState(false)
    const [ categoryError, setCategoryError ] = useState(false)
    const [ imageError, setImageError ] = useState(false)
    const [ descriptionError, setDescriptionError ] = useState(false)
    const [ shortDescriptionError, setShortDescriptionError ] = useState(false)
    const [ basePriceError, setBasePriceError ] = useState(false)
    const [ salePercentError, setSalePercentError ] = useState(false)

    async function submit() {
        if (loading) {
            return
        }
        setNameError(false)
        setImageError(false)
        setDescriptionError(false)
        setShortDescriptionError(false)
        setBasePriceError(false)
        setSalePercentError(false)
        if (name.length < 1 || name.length > 16) {
            setNameError(true)
            return
        }
        if (!availableCategories.find(c => c.id === category)) {
            setCategoryError(true)
            return
        }
        if (image === '') {
            setImageError(true)
            return
        }
        if (description.length < 1 || description.length > 384) {
            setDescriptionError(true)
            return
        }
        if (shortDescription.length < 1 || shortDescription.length > 32) {
            setShortDescriptionError(true)
            return
        }
        if (basePrice === '' || isNaN(parseFloat(basePrice))) {
            setBasePriceError(true)
            return
        }
        if (salePercent === '' || isNaN(parseFloat(salePercent))) {
            setSalePercentError(true)
            return
        }

        setLoading(true)
        const result = await upsertItemType(existing?.id, {
            id: -1,
            createdAt: new Date(),
            categoryId: category,
            name,
            image,
            description,
            shortDescription,
            basePrice: basePrice,
            salePercent: salePercent,
            soldOut,
            tags: tags.map(t => availableTags.find(tag => tag.id === t)!),
            options: options.map(o => availableOptions.find(option => option.id === o)!)
        })
        router.push(`/user/manage/storefront/items/${result.id}`)
        setLoading(false)
    }

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.title')}</BreadcrumbItem>
            <BreadcrumbItem href="/user/manage/storefront">{t('manage.storefront.categoriesO')}</BreadcrumbItem>
            <BreadcrumbItem
                href={`/user/manage/storefront/categories/${existing?.categoryId ?? currentCategory}`}>
                {availableCategories.find(s => s.id === (existing?.categoryId ?? currentCategory))!.name}
            </BreadcrumbItem>
            <If condition={editMode}>
                <BreadcrumbItem>{existing?.name}</BreadcrumbItem>
            </If>
            <If condition={!editMode}>
                <BreadcrumbItem>{t('manage.storefront.create')}</BreadcrumbItem>
            </If>
        </Breadcrumb>
        <h1 className="mb-5">{editMode ? t('manage.storefront.itemD.edit') : t('manage.storefront.itemD.create')}</h1>

        <div className="2xl:w-1/2 flex flex-col gap-4">
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="name" value={t('manage.storefront.itemD.name')}/>
                </div>
                <TextInput id="name" type="text" required placeholder={t('manage.storefront.itemD.name') + '...'}
                           color={nameError ? 'failure' : undefined}
                           value={name} onChange={e => setName(e.currentTarget.value)}
                           helperText={nameError ? t('manage.storefront.itemD.nameError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="category" value={t('manage.storefront.itemD.category')}/>
                </div>
                <Select id="category" required color={categoryError ? 'failure' : undefined}
                        value={category} onChange={e => setCategory(parseInt(e.currentTarget.value))}
                        helperText={categoryError ? t('manage.storefront.itemD.categoryError') : null}>
                    {availableCategories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </Select>
            </div>
            <div className="w-full" aria-label={t('manage.storefront.itemD.image')}>
                <UploadAreaClient uploadPrefix={uploadPrefix} onDone={path => setImage(path)}/>
                <If condition={imageError}>
                    <p className="text-red-500 mt-2 text-sm">{t('manage.storefront.itemD.imageError')}</p>
                </If>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="shortDescription" value={t('manage.storefront.itemD.shortDescription')}/>
                </div>
                <TextInput id="shortDescription" type="text" required
                           placeholder={t('manage.storefront.itemD.shortDescription') + '...'}
                           color={shortDescriptionError ? 'failure' : undefined}
                           value={shortDescription} onChange={e => setShortDescription(e.currentTarget.value)}
                           helperText={shortDescriptionError ? t('manage.storefront.itemD.shortDescriptionError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="description" value={t('manage.storefront.itemD.description')}/>
                </div>
                <Textarea id="description" required
                          placeholder={t('manage.storefront.itemD.description') + '...'}
                          color={descriptionError ? 'failure' : undefined}
                          value={description} onChange={e => setDescription(e.currentTarget.value)}
                          helperText={descriptionError ? t('manage.storefront.itemD.descriptionError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="basePrice" value={t('manage.storefront.itemD.basePrice')}/>
                </div>
                <TextInput id="basePrice" type="text" required
                           placeholder={t('manage.storefront.itemD.basePrice') + '...'}
                           color={basePriceError ? 'failure' : undefined}
                           value={basePrice} onChange={e => setBasePrice(e.currentTarget.value)}
                           helperText={basePriceError ? t('manage.storefront.itemD.basePriceError') : null}/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label htmlFor="salePercent" value={t('manage.storefront.itemD.salePercent')}/>
                </div>
                <TextInput id="salePercent" type="text" required
                           placeholder={t('manage.storefront.itemD.salePercent') + '...'}
                           color={salePercentError ? 'failure' : undefined}
                           value={salePercent} onChange={e => setSalePercent(e.currentTarget.value)}
                           helperText={salePercentError ? t('manage.storefront.itemD.salePercentError') : null}/>
            </div>
            <div className="w-full">
                <ToggleSwitch checked={soldOut} label={t('manage.storefront.itemD.soldOut')}
                              onChange={setSoldOut} color="yellow"/>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label value={t('manage.storefront.itemD.tags')}/>
                </div>
                <div className="flex flex-col gap-1">
                    {availableTags.map(tag => <div key={tag.id} className="flex items-center gap-2">
                        <Checkbox id={`tag-${tag.id}`} color="warning" checked={tags.includes(tag.id)} onChange={e => {
                            if (e.currentTarget.checked) {
                                setTags([ ...tags, tag.id ])
                            } else {
                                setTags(tags.filter(t => t !== tag.id))
                            }
                        }}/>
                        <Label htmlFor={`tag-${tag.id}`} value={tag.name}/>
                    </div>)}
                </div>
            </div>
            <div className="w-full">
                <div className="mb-2">
                    <Label value={t('manage.storefront.itemD.options')}/>
                </div>
                <div className="flex flex-col gap-1">
                    {availableOptions.map(option => <div key={option.id} className="flex items-center gap-2">
                        <Checkbox id={`option-${option.id}`} color="warning" checked={options.includes(option.id)}
                                  onChange={e => {
                                      if (e.currentTarget.checked) {
                                          setOptions([ ...options, option.id ])
                                      } else {
                                          setOptions(options.filter(o => o !== option.id))
                                      }
                                  }}/>
                        <Label htmlFor={`option-${option.id}`} value={option.name}/>
                    </div>)}
                </div>
            </div>
            <Button color="warning" pill disabled={loading} className="w-full" onClick={submit}
                    fullSized>{t('confirm')}</Button>
        </div>
    </div>
}

ItemCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
