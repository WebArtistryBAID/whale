'use client'

import { Ad, Category, CouponCode, OptionType, Tag } from '@/generated/prisma/browser'
import { Breadcrumb, BreadcrumbItem, TabItem, Tabs } from 'flowbite-react'
import { HiCash, HiChevronRight, HiCog, HiCollection, HiGift, HiPlus, HiTag } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import { ReactNode } from 'react'
import ReorderableTable from '@/app/user/manage/storefront/ReorderableTable'
import { reorderCategories } from '@/app/lib/ui-manage-actions'
import Beluga from '@/app/core-components/Beluga'

function Section({ hint, createHref, createLabel, empty, emptyLabel, children }: {
    hint: string,
    createHref: string,
    createLabel: string,
    empty: boolean,
    emptyLabel: string,
    children: ReactNode
}) {
    if (empty) {
        return <div className="toon p-8 flex flex-col items-center text-center gap-3 max-w-xl mx-auto mt-4">
            <Beluga mood="sleepy" className="w-40"/>
            <p className="font-toon text-xl">{emptyLabel}</p>
            <p className="secondary text-sm">{hint}</p>
            <Link href={createHref} className="toon-btn h-11 text-base mt-2"><HiPlus/>{createLabel}</Link>
        </div>
    }
    return <div>
        <div className="flex flex-wrap items-center gap-3 mb-5">
            <p className="secondary text-sm flex-grow">{hint}</p>
            <Link href={createHref} className="toon-btn h-11 text-base"><HiPlus/>{createLabel}</Link>
        </div>
        {children}
    </div>
}

function Tab({ label, count }: { label: string, count: number }) {
    return <span className="flex items-center gap-2">
        {label}
        <span className="min-w-5 h-5 px-1 rounded-full bg-paper border-2 border-ink/40 text-[11px] font-bold flex items-center justify-center">{count}</span>
    </span>
}

export default function ManageStorefrontClient({ categories, optionTypes, couponCodes, tags, ads, uploadPrefix }: {
    categories: Category[],
    optionTypes: OptionType[],
    couponCodes: CouponCode[],
    tags: Tag[],
    ads: Ad[],
    uploadPrefix: string
}) {
    const { t } = useTranslationClient('user')
    const empty = t('manage.storefront.empty')

    return <div className="container">
        <header className="mb-6">
            <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-2">
                <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
                <BreadcrumbItem>{t('manage.storefront.title')}</BreadcrumbItem>
            </Breadcrumb>
            <h1>{t('manage.storefront.title')}</h1>
        </header>

        <Tabs aria-label={t('manage.storefront.tabs')} variant="underline">
            <TabItem title={<Tab label={t('manage.storefront.categories')} count={categories.length}/>} icon={HiCollection}>
                <Section hint={t('manage.storefront.hints.categories')} createHref="/user/manage/storefront/categories/create"
                         createLabel={t('manage.storefront.createCategory')} empty={categories.length < 1} emptyLabel={empty}>
                    <ReorderableTable
                        actionsLabel={t('manage.storefront.actions')}
                        handleLabel={t('manage.storefront.dragHandle')}
                        idLabel={t('manage.storefront.id')}
                        items={categories}
                        nameLabel={t('manage.storefront.name')}
                        onReorder={async nextCategories => reorderCategories(nextCategories.map(category => category.id))}
                        saveErrorMessage={t('manage.storefront.saveOrderError')}
                        viewLabel={t('manage.storefront.view')}
                        viewPath={category => `/user/manage/storefront/categories/${category.id}`}
                    />
                </Section>
            </TabItem>

            <TabItem title={<Tab label={t('manage.storefront.optionTypes')} count={optionTypes.length}/>} icon={HiCog}>
                <Section hint={t('manage.storefront.hints.optionTypes')} createHref="/user/manage/storefront/option-types/create"
                         createLabel={t('manage.storefront.create')} empty={optionTypes.length < 1} emptyLabel={empty}>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {optionTypes.map(option => <li key={option.id}>
                            <Link href={`/user/manage/storefront/option-types/${option.id}`}
                                  className="toon toon-press p-4 flex items-center gap-3">
                                <span className="h-10 w-10 rounded-full border-2 border-ink bg-whale/60 flex items-center justify-center shrink-0">
                                    <HiCog/>
                                </span>
                                <span className="flex-grow min-w-0">
                                    <span className="block font-toon text-lg truncate">{option.name}</span>
                                    <span className="block text-xs secondary">ID {option.id}</span>
                                </span>
                                <HiChevronRight className="shrink-0"/>
                            </Link>
                        </li>)}
                    </ul>
                </Section>
            </TabItem>

            <TabItem title={<Tab label={t('manage.storefront.couponCodes')} count={couponCodes.length}/>} icon={HiCash}>
                <Section hint={t('manage.storefront.hints.couponCodes')} createHref="/user/manage/storefront/coupons/create"
                         createLabel={t('manage.storefront.create')} empty={couponCodes.length < 1} emptyLabel={empty}>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {couponCodes.map(coupon => <li key={coupon.id}>
                            {/* Drawn like a paper ticket with a perforated stub */}
                            <Link href={`/user/manage/storefront/coupons/${coupon.id}`}
                                  className={`toon toon-press flex items-stretch overflow-hidden ${coupon.remainingUses < 1 ? 'opacity-60' : ''}`}>
                                <span className="bg-butter px-4 flex flex-col items-center justify-center border-r-2 border-dashed border-ink">
                                    <span className="font-toon text-3xl">¥{coupon.value}</span>
                                </span>
                                <span className="p-4 min-w-0 flex-grow">
                                    <span className="block font-toon text-lg tracking-wider truncate">{coupon.id}</span>
                                    <span className="block text-xs secondary">
                                        {coupon.remainingUses > 0
                                            ? t('manage.storefront.couponUses', { count: coupon.remainingUses })
                                            : t('manage.storefront.couponUsedUp')}
                                    </span>
                                </span>
                            </Link>
                        </li>)}
                    </ul>
                </Section>
            </TabItem>

            <TabItem title={<Tab label={t('manage.storefront.tags')} count={tags.length}/>} icon={HiTag}>
                <Section hint={t('manage.storefront.hints.tags')} createHref="/user/manage/storefront/tags/create"
                         createLabel={t('manage.storefront.create')} empty={tags.length < 1} emptyLabel={empty}>
                    <ul className="flex flex-wrap gap-3">
                        {tags.map(tag => <li key={tag.id}>
                            <Link href={`/user/manage/storefront/tags/${tag.id}`}
                                  className="toon toon-press rounded-full pl-2 pr-4 py-2 flex items-center gap-2">
                                <span className="h-6 w-6 rounded-full border-2 border-ink" style={{ backgroundColor: tag.color }}/>
                                <span className="font-toon">{tag.name}</span>
                            </Link>
                        </li>)}
                    </ul>
                </Section>
            </TabItem>

            <TabItem title={<Tab label={t('manage.storefront.ads')} count={ads.length}/>} icon={HiGift}>
                <Section hint={t('manage.storefront.hints.ads')} createHref="/user/manage/storefront/ads/create"
                         createLabel={t('manage.storefront.create')} empty={ads.length < 1} emptyLabel={empty}>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {ads.map(ad => <li key={ad.id}>
                            <Link href={`/user/manage/storefront/ads/${ad.id}`} className="toon toon-press block overflow-hidden">
                                <span className="block aspect-[3/1] bg-latte/50 border-b-toon border-ink overflow-hidden">
                                    {ad.image != null &&
                                        <img src={uploadPrefix + ad.image} alt="" className="w-full h-full object-cover"/>}
                                </span>
                                <span className="block p-3">
                                    <span className="block font-toon truncate">{ad.name}</span>
                                    <span className="block text-xs secondary truncate">{ad.url}</span>
                                </span>
                            </Link>
                        </li>)}
                    </ul>
                </Section>
            </TabItem>
        </Tabs>
    </div>
}
