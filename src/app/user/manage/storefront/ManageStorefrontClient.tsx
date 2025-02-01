'use client'

import { Ad, Category, CouponCode, OptionType, Tag } from '@prisma/client'
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
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                        <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                        <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {categories.map(category => <TableRow className="tr" key={category.id}>
                            <TableCell className="th">{category.id}</TableCell>
                            <TableCell>{category.name}</TableCell>
                            <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                               href={`/user/manage/storefront/categories/${category.id}`}>
                                {t('manage.storefront.view')}</Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                <Button color="warning" pill as={Link} href="/user/manage/storefront/categories/create"
                        className="inline-block">{t('manage.storefront.create')}</Button>
            </TabItem>
            <TabItem title={t('manage.storefront.optionTypes')} icon={HiCog}>
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                        <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                        <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {optionTypes.map(option => <TableRow className="tr" key={option.id}>
                            <TableCell className="th">{option.id}</TableCell>
                            <TableCell>{option.name}</TableCell>
                            <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                               href={`/user/manage/storefront/option-types/${option.id}`}>
                                {t('manage.storefront.view')}</Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                <Button color="warning" pill as={Link} href="/user/manage/storefront/option-types/create"
                        className="inline-block">{t('manage.storefront.create')}</Button>
            </TabItem>
            <TabItem title={t('manage.storefront.couponCodes')} icon={HiCash}>
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                        <TableHeadCell>{t('manage.storefront.value')}</TableHeadCell>
                        <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {couponCodes.map(coupon => <TableRow className="tr" key={coupon.id}>
                            <TableCell className="th">{coupon.id}</TableCell>
                            <TableCell>¥{coupon.value}</TableCell>
                            <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                               href={`/user/manage/storefront/coupons/${coupon.id}`}>
                                {t('manage.storefront.view')}</Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                <Button color="warning" pill as={Link} href="/user/manage/storefront/coupons/create"
                        className="inline-block">{t('manage.storefront.create')}</Button>
            </TabItem>
            <TabItem title={t('manage.storefront.tags')} icon={HiTag}>
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                        <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                        <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {tags.map(tag => <TableRow className="tr" key={tag.id}>
                            <TableCell className="th">{tag.id}</TableCell>
                            <TableCell>{tag.name}</TableCell>
                            <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                               href={`/user/manage/storefront/tags/${tag.id}`}>
                                {t('manage.storefront.view')}</Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                <Button color="warning" pill as={Link} href="/user/manage/storefront/tags/create"
                        className="inline-block">{t('manage.storefront.create')}</Button>
            </TabItem>
            <TabItem title={t('manage.storefront.ads')} icon={HiGift}>
                <Table className="mb-5">
                    <TableHead>
                        <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                        <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
                    </TableHead>
                    <TableBody className="divide-y mb-3">
                        {ads.map(ad => <TableRow className="tr" key={ad.id}>
                            <TableCell className="th">{ad.id}</TableCell>
                            <TableCell><Button size="xs" pill color="warning" className="inline-block" as={Link}
                                               href={`/user/manage/storefront/ads/${ad.id}`}>
                                {t('manage.storefront.view')}</Button></TableCell>
                        </TableRow>)}
                    </TableBody>
                </Table>
                <Button color="warning" pill as={Link} href="/user/manage/storefront/ads/create"
                        className="inline-block">{t('manage.storefront.create')}</Button>
            </TabItem>
        </Tabs>
    </div>
}
