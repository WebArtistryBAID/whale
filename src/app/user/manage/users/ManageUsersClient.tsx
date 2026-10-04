'use client'

import { User } from '@/generated/prisma/browser'
import { useTranslationClient } from '@/app/i18n/client'
import { useEffect, useState } from 'react'
import { getUsers } from '@/app/login/login-actions'
import {
    Breadcrumb,
    BreadcrumbItem,
    Pagination,
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
        <header className="mb-6 flex flex-wrap items-end gap-4">
            <div className="flex-grow">
                <Breadcrumb aria-label={t('breadcrumb.bc')} className="mb-2">
                    <BreadcrumbItem href="/user" icon={HiCollection}>{t('breadcrumb.manage')}</BreadcrumbItem>
                    <BreadcrumbItem>{t('manage.users.title')}</BreadcrumbItem>
                </Breadcrumb>
                <h1>{t('manage.users.title')}</h1>
            </div>
            <div className="w-full sm:w-80">
                <TextInput type="search" icon={HiSearch} value={keyword} onChange={e => {
                    setKeyword(e.currentTarget.value)
                    setCurrentPage(0)
                }} placeholder={t('manage.users.search')} aria-label={t('manage.users.search')}/>
            </div>
        </header>
        <p className="sr-only">{t('a11y.page', { page: page.page + 1, pages: page.pages })}</p>
        <If condition={page.items.length < 1}>
            <div className="toon p-8 text-center secondary">{t('manage.users.noResults')}</div>
        </If>
        <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
            {page.items.map(user => <li key={user.id}>
                <Link href={`/user/manage/users/${user.id}`}
                      className="toon toon-press p-4 flex items-center gap-4 h-full">
                    <span className={`h-12 w-12 shrink-0 rounded-full border-toon border-ink font-toon text-xl flex items-center justify-center
                    ${user.blocked ? 'bg-blush' : user.permissions.includes('admin.manage') ? 'bg-butter' : 'bg-whale'}`}>
                        {user.name.at(0)}
                    </span>
                    <span className="min-w-0 flex-grow">
                        <span className="block font-toon text-lg truncate">{user.name}</span>
                        <span className="block text-sm secondary truncate">{user.pinyin}</span>
                        <span className="flex flex-wrap gap-1.5 mt-1.5">
                            <If condition={user.permissions.includes('admin.manage')}>
                                <span className="h-5 px-2 rounded-full border-2 border-ink bg-butter text-[11px] font-bold flex items-center">{t('manage.users.admin')}</span>
                            </If>
                            <If condition={user.blocked}>
                                <span className="h-5 px-2 rounded-full border-2 border-ink bg-tomato text-white text-[11px] font-bold flex items-center">{t('manage.users.blockedChip')}</span>
                            </If>
                        </span>
                    </span>
                    <span className="text-right shrink-0">
                        <span className="block text-xs secondary">{t('manage.users.balance')}</span>
                        <span className="block font-toon">¥{user.balance}</span>
                    </span>
                </Link>
            </li>)}
        </ul>

        <div className="flex overflow-x-auto sm:justify-center">
            <If condition={page.pages > 0}>
                <Pagination previousLabel={t('pagination.previous')} nextLabel={t('pagination.next')} currentPage={currentPage + 1} onPageChange={p => setCurrentPage(p - 1)}
                            totalPages={page.pages}/>
            </If>
        </div>
    </div>
}
