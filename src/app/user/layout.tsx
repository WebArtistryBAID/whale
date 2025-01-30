'use client'

import { ReactNode, useEffect, useRef, useState } from 'react'
import {
    Badge,
    Button,
    Drawer,
    DrawerItems,
    Sidebar,
    SidebarCollapse,
    SidebarCTA,
    SidebarItem,
    SidebarItemGroup,
    SidebarItems,
    SidebarLogo
} from 'flowbite-react'
import {
    HiCake,
    HiCash,
    HiChartPie,
    HiCog,
    HiCollection,
    HiInbox,
    HiMenu,
    HiShoppingCart,
    HiUser,
    HiUsers
} from 'react-icons/hi'
import Link from 'next/link'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { User } from '@prisma/client'
import { getMyUser } from '@/app/login/login-actions'
import { useCookies } from 'react-cookie'
import { useRouter } from 'next/navigation'

export default function UserLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslationClient('user')
    const [ myUser, setMyUser ] = useState<User>()
    const deleteCookie = useCookies()[2]
    const router = useRouter()
    const [ drawerOpen, setDrawerOpen ] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        (async () => {
            setMyUser((await getMyUser())!)
        })()
    }, [])

    const sidebar = <Sidebar className="h-screen w-full lg:w-64 relative">
        <SidebarLogo href="/" img="/assets/logo.png"><span
            className="font-display">{t('brand')}</span></SidebarLogo>
        <SidebarItems color="yellow">
            <SidebarItemGroup>
                <SidebarItem as={Link} href="/user" icon={HiChartPie}>
                    {t('nav.dashboard')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/orders" icon={HiCake}>
                    {t('nav.orders')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/logs" icon={HiCash}>
                    {t('nav.auditLogs')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/inbox" icon={HiInbox}
                             label="1">
                    {t('nav.inbox')}
                </SidebarItem>
                <If condition={myUser?.permissions.includes('admin.manage')}>
                    <SidebarCollapse label={t('nav.manageCategory')} icon={HiCollection}>
                        <SidebarItem as={Link} href="/user/manage/store" icon={HiShoppingCart}>
                            {t('nav.manageStore')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/logs" icon={HiCash}>
                            {t('nav.manageAuditLogs')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/stats" icon={HiChartPie}>
                            {t('nav.manageStats')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/users" icon={HiUsers}>
                            {t('nav.manageUsers')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/settings" icon={HiCog}>
                            {t('nav.manageSettings')}
                        </SidebarItem>
                    </SidebarCollapse>
                </If>
            </SidebarItemGroup>
        </SidebarItems>
        <div className="mr-3 mb-3 absolute bottom-0">
            <button onClick={() => {
                deleteCookie('access_token', { path: '/' })
                router.push('/')
            }}
                    className="flex items-center gap-3 w-full rounded-full p-3 hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors duration-100">
                <Badge color="yellow" icon={HiUser}/>
                <div className="text-left">
                    <p className="font-bold font-display text-sm">{myUser?.name ?? '...'}</p>
                    <p className="text-xs secondary">{t('nav.logOut')}</p>
                </div>
            </button>
            <SidebarCTA color="yellow">
                <Badge color="warning" className="inline-block mb-3">{t('nav.beta')}</Badge>
                <p className="secondary text-sm">
                    {t('nav.betaDetails')}
                </p>
            </SidebarCTA>
        </div>
    </Sidebar>

    return <>
        <Drawer open={drawerOpen} className="p-0" onClose={() => setDrawerOpen(false)}>
            <DrawerItems ref={ref}>
                {sidebar}
            </DrawerItems>
        </Drawer>

        <div className="fixed top-3 left-3 lg:hidden" style={{ zIndex: '5' }}>
            <Button aria-hidden pill aria-label={t('nav.sidebar')} color="warning"
                    onClick={() => {
                        setDrawerOpen(true)
                        ref.current?.focus()
                    }}>
                <HiMenu/>
            </Button>
        </div>

        <div className="h-screen flex">
            <div className="h-screen hidden lg:block">
                {sidebar}
            </div>
            <div className="flex-grow h-screen max-h-screen overflow-y-auto" style={{ overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    </>
}
