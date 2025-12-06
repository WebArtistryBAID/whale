'use client'

import { Ad, Category, CouponCode, OptionType, Tag } from '@/generated/prisma/browser'
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    TabItem,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeadCell,
    TableRow,
    Tabs
} from 'flowbite-react'
import { HiCash, HiCog, HiCollection, HiGift, HiTag } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Link from 'next/link'
import If from '@/app/lib/If'

export default function ManageStorefrontClient({ categories, optionTypes, couponCodes, tags, ads }: {
    categories: Category[],
    optionTypes: OptionType[],
    couponCodes: CouponCode[],
    tags: Tag[],
    ads: Ad[]
}) {
    const { t } = useTranslationClient('user')

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('manage.storefront.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('manage.storefront.title')}</h1>

        <Tabs aria-label={t('manage.storefront.tabs')} className="mb-5" variant="underline">
            <TabItem title={t('manage.storefront.categories')} color="warning" className="inline-block"
                     icon={HiCollection}>
                <If condition={categories.length > 0}>
                    <Link href="/user/manage/storefront/categories/create">
                        <Button color="warning" pill
                                className="inline-block mb-8">{t('manage.storefront.create')}</Button>
                    </Link>
                    <Table className="mb-5">
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {categories.map(category => <TableRow className="tr" key={category.id}>
                                <TableCell className="th">{category.id}</TableCell>
                                <TableCell>{category.name}</TableCell>
                                <TableCell>
                                    <Link href={`/user/manage/storefront/categories/${category.id}`}>
                                        <Button size="xs" pill color="warning" className="inline-block">
                                            {t('manage.storefront.view')}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </If>
                <If condition={categories.length < 1}>
                    <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                        <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                             className="dark:hidden w-72" alt=""/>
                        <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                             className="hidden dark:block w-72" alt=""/>
                        <p className="mb-3">{t('manage.storefront.empty')}</p>
                        <Link href="/user/manage/storefront/categories/create">
                            <Button color="warning" pill
                                    className="inline-block">{t('manage.storefront.create')}</Button>
                        </Link>
                    </div>
                </If>

            </TabItem>
            <TabItem title={t('manage.storefront.optionTypes')} icon={HiCog}>
                <If condition={optionTypes.length > 0}>
                    <Link href="/user/manage/storefront/option-types/create">
                        <Button color="warning" pill
                                className="inline-block mb-8">{t('manage.storefront.create')}</Button>
                    </Link>
                    <Table className="mb-5">
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {optionTypes.map(option => <TableRow className="tr" key={option.id}>
                                <TableCell className="th">{option.id}</TableCell>
                                <TableCell>{option.name}</TableCell>
                                <TableCell>
                                    <Link href={`/user/manage/storefront/option-types/${option.id}`}>
                                        <Button size="xs" pill color="warning" className="inline-block">
                                            {t('manage.storefront.view')}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </If>

                <If condition={optionTypes.length < 1}>
                    <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                        <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                             className="dark:hidden w-72" alt=""/>
                        <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                             className="hidden dark:block w-72" alt=""/>
                        <p className="mb-3">{t('manage.storefront.empty')}</p>
                        <Link href="/user/manage/storefront/option-types/create">
                            <Button color="warning" pill
                                    className="inline-block">{t('manage.storefront.create')}</Button>
                        </Link>
                    </div>
                </If>
            </TabItem>
            <TabItem title={t('manage.storefront.couponCodes')} icon={HiCash}>
                <If condition={couponCodes.length > 0}>
                    <Link href="/user/manage/storefront/coupons/create">
                        <Button color="warning" pill
                                className="inline-block mb-8">{t('manage.storefront.create')}</Button>
                    </Link>
                    <Table className="mb-5">
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.value')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {couponCodes.map(coupon => <TableRow className="tr" key={coupon.id}>
                                <TableCell className="th">{coupon.id}</TableCell>
                                <TableCell>¥{coupon.value}</TableCell>
                                <TableCell>
                                    <Link href={`/user/manage/storefront/coupons/${coupon.id}`}>
                                        <Button size="xs" pill color="warning" className="inline-block">
                                            {t('manage.storefront.view')}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </If>

                <If condition={couponCodes.length < 1}>
                    <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                        <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                             className="dark:hidden w-72" alt=""/>
                        <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                             className="hidden dark:block w-72" alt=""/>
                        <p className="mb-3">{t('manage.storefront.empty')}</p>
                        <Link href="/user/manage/storefront/coupons/create">
                            <Button color="warning" pill
                                    className="inline-block">{t('manage.storefront.create')}</Button>
                        </Link>
                    </div>
                </If>
            </TabItem>
            <TabItem title={t('manage.storefront.tags')} icon={HiTag}>
                <If condition={tags.length > 0}>
                    <Link href="/user/manage/storefront/tags/create">
                        <Button color="warning" pill
                                className="inline-block mb-8">{t('manage.storefront.create')}</Button>
                    </Link>
                    <Table className="mb-5">
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {tags.map(tag => <TableRow className="tr" key={tag.id}>
                                <TableCell className="th">{tag.id}</TableCell>
                                <TableCell>{tag.name}</TableCell>
                                <TableCell>
                                    <Link href={`/user/manage/storefront/tags/${tag.id}`}>
                                        <Button size="xs" pill color="warning" className="inline-block">
                                            {t('manage.storefront.view')}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </If>

                <If condition={tags.length < 1}>
                    <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                        <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                             className="dark:hidden w-72" alt=""/>
                        <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                             className="hidden dark:block w-72" alt=""/>
                        <p className="mb-3">{t('manage.storefront.empty')}</p>
                        <Link href="/user/manage/storefront/tags/create">
                            <Button color="warning" pill
                                    className="inline-block">{t('manage.storefront.create')}</Button>
                        </Link>
                    </div>
                </If>
            </TabItem>
            <TabItem title={t('manage.storefront.ads')} icon={HiGift}>
                <If condition={ads.length > 0}>
                    <Link href="/user/manage/storefront/ads/create">
                        <Button color="warning" pill
                                className="inline-block mb-8">{t('manage.storefront.create')}</Button>
                    </Link>
                    <Table className="mb-5">
                        <TableHead>
                            <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                            <TableHeadCell><span
                                className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                        </TableHead>
                        <TableBody className="divide-y mb-3">
                            {ads.map(ad => <TableRow className="tr" key={ad.id}>
                                <TableCell className="th">{ad.id}</TableCell>
                                <TableCell>
                                    <Link href={`/user/manage/storefront/ads/${ad.id}`}>
                                        <Button size="xs" pill color="warning" className="inline-block">
                                            {t('manage.storefront.view')}
                                        </Button>
                                    </Link>
                                </TableCell>
                            </TableRow>)}
                        </TableBody>
                    </Table>
                </If>

                <If condition={ads.length < 1}>
                    <div className="w-full h-[60dvh] flex flex-col justify-center items-center text-center">
                        <img width={400} height={322} src="/assets/illustrations/unboxing-light.png"
                             className="dark:hidden w-72" alt=""/>
                        <img width={400} height={322} src="/assets/illustrations/unboxing-dark.png"
                             className="hidden dark:block w-72" alt=""/>
                        <p className="mb-3">{t('manage.storefront.empty')}</p>
                        <Link href="/user/manage/storefront/ads/create">
                            <Button color="warning" pill
                                    className="inline-block">{t('manage.storefront.create')}</Button>
                        </Link>
                    </div>
                </If>
            </TabItem>
        </Tabs>
    </div>
}
