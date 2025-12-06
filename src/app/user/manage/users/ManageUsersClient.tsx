'use client'

import { User } from '@/generated/prisma/browser'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getUsers } from '@/app/login/login-actions'
import {
    Breadcrumb,
    BreadcrumbItem,
    Button,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableRow,
    TextInput
} from 'flowbite-react'
import { HiCollection, HiSearch } from 'react-icons/hi'
import Link from 'next/link'
import If from '@/app/lib/If'
import Paginated from '@/app/lib/Paginated'

export default function ManageUsersClient({ users }: { users: Paginated<User> }) {
    const { t } = useTranslationClient('user')
    const [ currentPage, setCurrentPage ] = useState(0)
    const [ keyword, setKeyword ] = useState<string>('')
    const [ page, setPage ] = useState<Paginated<User>>(users)

    useEffect(() => {
        (async () => {
            setPage(await getUsers(currentPage, keyword))
        })()
    }, [ currentPage, keyword ])

    return <div className="container">
        <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-3">
            <BreadcrumbItem href="/user" icon={HiCollection}>{t('breadcrumb.manage')}</BreadcrumbItem>
            <BreadcrumbItem>{t('manage.users.title')}</BreadcrumbItem>
        </Breadcrumb>
        <h1 className="mb-5">{t('manage.users.title')}</h1>
        <div className="mb-5 max-w-md">
            <TextInput type="name" icon={HiSearch} value={keyword} onChange={e => setKeyword(e.currentTarget.value)}
                       placeholder={t('manage.users.search')}/>
        </div>
        <p className="sr-only">{t('a11y.page', { page: page.page + 1, pages: page.pages })}</p>
        <Table className="mb-8">
            <TableBody className="divide-y">
                {page.items.map(user => <TableRow className="tr" key={user.id}>
                    <TableCell className="th w-4/5">{user.name}</TableCell>
                    <TableCell className="w-1/5">
                        <Link href={`/user/manage/users/${user.id}`}>
                            <Button className="inline-block" color="warning"
                                    pill
                                    size="xs">{t('manage.users.view')}</Button>
                        </Link>
                    </TableCell>
                </TableRow>)}
            </TableBody>
        </Table>

        <div className="flex overflow-x-auto sm:justify-center">
            <If condition={page.pages > 0}>
                <Pagination currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                            totalPages={page.pages}/>
            </If>
        </div>
    </div>
}
