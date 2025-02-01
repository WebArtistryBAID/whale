'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { Breadcrumb, BreadcrumbItem } from 'flowbite-react'
import { HiCollection } from 'react-icons/hi'

export default function ManageStatsClient() {
    const { t } = useTranslationClient('user')

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem icon={HiCollection} href="/user">{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('manage.stats.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('manage.stats.title')}</h1>
    </div>
}
