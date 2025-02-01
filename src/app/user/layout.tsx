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
import { getMyNotificationsCount } from '@/app/lib/notification-actions'

export default function UserLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslationClient('user')
    const [ myUser, setMyUser ] = useState<User>()
    const deleteCookie = useCookies()[2]
    const router = useRouter()
    const [ drawerOpen, setDrawerOpen ] = useState(false)
    const [ notifications, setNotifications ] = useState(0)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        (async () => {
            setMyUser((await getMyUser())!)
        })()

        setInterval(async () => {
            setNotifications(await getMyNotificationsCount())
        }, 10000)
    }, [])

    const sidebar = <Sidebar className="h-screen w-full lg:w-64 relative">
        <SidebarLogo href="/" img="/assets/logo.png"><span
            className="font-display">{t('brand')}</span></SidebarLogo>
        <SidebarItems color="yellow">
            <SidebarItemGroup>
                <SidebarItem as={Link} href="/user" icon={HiChartPie} onClick={() => setDrawerOpen(false)}>
                    {t('nav.dashboard')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/orders" icon={HiCake} onClick={() => setDrawerOpen(false)}>
                    {t('nav.orders')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/logs" icon={HiCash} onClick={() => setDrawerOpen(false)}>
                    {t('nav.auditLogs')}
                </SidebarItem>
                <SidebarItem as={Link} href="/user/inbox" icon={HiInbox} onClick={() => setDrawerOpen(false)}
                             label={notifications > 0 ? notifications.toString() : undefined}>
                    {t('nav.inbox')}
                </SidebarItem>
                <If condition={myUser?.permissions.includes('admin.manage')}>
                    <SidebarCollapse label={t('nav.manageCategory')} icon={HiCollection}>
                        <SidebarItem as={Link} href="/user/manage/storefront" icon={HiShoppingCart}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageStore')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/logs" icon={HiCash}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageAuditLogs')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/stats" icon={HiChartPie}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageStats')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/orders" icon={HiCake}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageOrders')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/users" icon={HiUsers}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageUsers')}
                        </SidebarItem>
                        <SidebarItem as={Link} href="/user/manage/settings" icon={HiCog}
                                     onClick={() => setDrawerOpen(false)}>
                            {t('nav.manageSettings')}
                        </SidebarItem>
                    </SidebarCollapse>
                </If>
            </SidebarItemGroup>
        </SidebarItems>
        <div className="mr-3 mb-3 absolute bottom-0 hidden lg:block">
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

        <div className="h-screen flex overflow-y-hidden">
            <div className="h-screen hidden lg:block">
                {sidebar}
            </div>
            <div className="flex-grow h-screen max-h-screen overflow-y-auto" aria-label={t('a11y.mainContent')}
                 style={{ overflowY: 'auto' }}>
                {children}
            </div>
        </div>
    </>
}
