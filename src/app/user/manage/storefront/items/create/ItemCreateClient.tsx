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
import Decimal from 'decimal.js'
import { calculateUnitPrice, isValidBasePrice, isValidSalePercent } from '@/app/lib/pricing'

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
    const [ countsTowardLimit, setCountsTowardLimit ] = useState(existing?.countsTowardLimit ?? true)
    const [ inventoryTrackingEnabled, setInventoryTrackingEnabled ] = useState(existing?.inventoryTrackingEnabled ?? false)
    const [ remainingItems, setRemainingItems ] = useState(existing?.remainingItems?.toString() ?? '0')
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
    const [ remainingItemsError, setRemainingItemsError ] = useState(false)

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
        setRemainingItemsError(false)
        if (name.length < 1) {
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
        if (!isValidBasePrice(basePrice)) {
            setBasePriceError(true)
            return
        }
        if (!isValidSalePercent(salePercent)) {
            setSalePercentError(true)
            return
        }
        if (inventoryTrackingEnabled) {
            const parsedRemainingItems = parseInt(remainingItems, 10)
            if (!Number.isInteger(parsedRemainingItems) || parsedRemainingItems < 0) {
                setRemainingItemsError(true)
                return
            }
        }

        setLoading(true)
        const result = await upsertItemType(existing?.id, {
            id: -1,
            createdAt: new Date(),
            displayOrder: existing?.displayOrder ?? -1,
            categoryId: category,
            name,
            image,
            description,
            shortDescription,
            basePrice: basePrice,
            salePercent: salePercent,
            countsTowardLimit,
            inventoryTrackingEnabled,
            remainingItems: inventoryTrackingEnabled ? parseInt(remainingItems, 10) : 0,
            soldOut,
            tags: tags.map(t => availableTags.find(tag => tag.id === t)!),
            options: options.map(o => availableOptions.find(option => option.id === o)!)
        })
        router.push(`/user/manage/storefront/items/${result.id}`)
        setLoading(false)
    }

    const pricesValid = isValidBasePrice(basePrice) && isValidSalePercent(salePercent)
    const previewPrice = pricesValid ? calculateUnitPrice(basePrice, salePercent, []).toString() : null
    const previewSale = pricesValid && !Decimal(salePercent).eq(1)
        ? Decimal(1).minus(salePercent).mul(100).toDecimalPlaces(0).toString()
        : null
    const previewSoldOut = inventoryTrackingEnabled ? parseInt(remainingItems, 10) < 1 : soldOut

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
        <h1 className="mb-6">{editMode ? t('manage.storefront.itemD.edit') : t('manage.storefront.itemD.create')}</h1>

        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_380px] gap-6 items-start">
        <div className="toon p-5 flex flex-col gap-4 order-2 xl:order-1">
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
                <ToggleSwitch checked={countsTowardLimit} label={t('manage.storefront.itemD.countsTowardLimit')}
                              onChange={setCountsTowardLimit} color="yellow"/>
            </div>
            <div className="w-full">
                <ToggleSwitch checked={inventoryTrackingEnabled}
                              label={t('manage.storefront.itemD.inventoryTrackingEnabled')}
                              onChange={setInventoryTrackingEnabled} color="yellow"/>
            </div>
            <If condition={inventoryTrackingEnabled}>
                <div className="w-full">
                    <div className="mb-2">
                        <Label htmlFor="remainingItems" value={t('manage.storefront.itemD.remainingItems')}/>
                    </div>
                    <TextInput id="remainingItems" type="number" min={0} required
                               placeholder={t('manage.storefront.itemD.remainingItems') + '...'}
                               color={remainingItemsError ? 'failure' : undefined}
                               value={remainingItems} onChange={e => setRemainingItems(e.currentTarget.value)}
                               helperText={remainingItemsError ? t('manage.storefront.itemD.remainingItemsError') : null}/>
                </div>
            </If>
            <If condition={!inventoryTrackingEnabled}>
                <div className="w-full">
                <ToggleSwitch checked={soldOut} label={t('manage.storefront.itemD.soldOut')}
                              onChange={setSoldOut} color="yellow"/>
                </div>
            </If>
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

        {/* Live preview of the menu card */}
        <aside className="order-1 xl:order-2 xl:sticky xl:top-6" aria-label={t('manage.storefront.itemD.preview')}>
            <p className="font-toon mb-2">{t('manage.storefront.itemD.preview')}</p>
            <div className="dots rounded-[1.6rem] border-2 border-dashed border-ink/30 p-4">
                <div className="toon flex items-center gap-4 p-4">
                    <div className="relative flex-shrink-0">
                        {image !== ''
                            ? <img src={uploadPrefix + image} alt="" width={512} height={512}
                                   className={`w-24 h-24 object-cover rounded-full border-toon border-ink bg-latte ${previewSoldOut ? 'grayscale' : ''}`}/>
                            : <span className="w-24 h-24 rounded-full border-toon border-dashed border-ink/50 bg-latte/40 flex items-center justify-center text-xs secondary">
                                {t('manage.storefront.itemD.image')}
                            </span>}
                        <If condition={previewSale != null && !previewSoldOut}>
                            <span aria-hidden className="absolute -top-2 -left-2 rotate-[-12deg] rounded-full border-2 border-ink
                            bg-tomato text-white font-toon text-sm px-2 leading-6">-{previewSale}%</span>
                        </If>
                    </div>
                    <div className="flex-grow min-w-0">
                        <p className="font-toon text-xl leading-tight mb-1 break-words">{name || t('manage.storefront.itemD.name')}</p>
                        <p className="text-sm secondary mb-3 line-clamp-2">{shortDescription || t('manage.storefront.itemD.shortDescription')}</p>
                        <div className="flex flex-wrap gap-2 items-baseline">
                            {previewSoldOut
                                ? <span className="font-toon secondary">{t('manage.storefront.itemD.soldOut')}</span>
                                : <>
                                    <span className="price-tag text-lg">¥{previewPrice ?? '?'}</span>
                                    <If condition={previewSale != null}>
                                        <span className="line-through text-sm secondary">¥{basePrice}</span>
                                    </If>
                                </>}
                        </div>
                    </div>
                </div>
                <If condition={tags.length > 0}>
                    <div className="flex flex-wrap gap-2 mt-3">
                        {availableTags.filter(tag => tags.includes(tag.id)).map(tag =>
                            <span key={tag.id} className="h-6 px-2.5 rounded-full border-2 border-ink text-xs font-bold flex items-center text-white"
                                  style={{ backgroundColor: tag.color }}>{tag.name}</span>)}
                    </div>
                </If>
            </div>
            <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                <dt className="secondary">{t('manage.storefront.itemD.basePrice')}</dt>
                <dd>{isValidBasePrice(basePrice) ? `¥${basePrice}` : '—'}</dd>
                <dt className="secondary">{t('manage.storefront.itemD.salePercent')}</dt>
                <dd>{isValidSalePercent(salePercent) ? (previewSale != null ? t('manage.storefront.itemD.previewOff', { percent: previewSale }) : t('manage.storefront.itemD.previewNoSale')) : '—'}</dd>
                <dt className="secondary">{t('manage.storefront.itemD.previewCustomerPays')}</dt>
                <dd className="font-toon">{previewPrice != null ? `¥${previewPrice}` : '—'}</dd>
            </dl>
        </aside>
        </div>
    </div>
}

ItemCreateClient.defaultProps = {
    editMode: false,
    existing: null
}
