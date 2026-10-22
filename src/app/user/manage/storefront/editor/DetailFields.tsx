'use client'

import { Fragment, type ReactNode } from 'react'
import { Button, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow } from 'flowbite-react'
import Link from 'next/link'
import { useTranslationClient } from '@/app/i18n/client'

export function DetailFields({ fields }: { fields: { key: string, label: string, value: ReactNode, labelClass?: string, valueClass?: string }[] }) {
    return fields.map(field => <Fragment key={field.key}>
        <p className={field.labelClass ?? 'secondary text-sm font-display'}>{field.label}</p>
        <p className={field.valueClass ?? 'text-xl mb-3'}>{field.value}</p>
    </Fragment>)
}

export function RelatedRecordsTable({ label, records, section }: {
    label: string
    records: { id: number, name: string }[]
    section: 'tags' | 'option-types'
}) {
    const { t } = useTranslationClient('user')
    if (records.length === 0) return null
    return <div aria-label={label} className="mb-5">
        <p className="secondary text-sm font-display mb-3">{label}</p>
        <Table>
            <TableHead>
                <TableHeadCell>{t('manage.storefront.id')}</TableHeadCell>
                <TableHeadCell>{t('manage.storefront.name')}</TableHeadCell>
                <TableHeadCell><span className="sr-only">{t('manage.storefront.actions')}</span></TableHeadCell>
            </TableHead>
            <TableBody className="divide-y mb-3">
                {records.map(record => <TableRow className="tr" key={record.id}>
                    <TableCell className="th">{record.id}</TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>
                        <Link href={`/user/manage/storefront/${section}/${record.id}`}>
                            <Button size="xs" pill color="warning" className="inline-block">{t('manage.storefront.view')}</Button>
                        </Link>
                    </TableCell>
                </TableRow>)}
            </TableBody>
        </Table>
    </div>
}
