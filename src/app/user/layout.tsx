'use client'

import { ReactNode, useEffect, useState } from 'react'
import { IconType } from 'react-icons'
import {
    HiCake,
    HiCash,
    HiChartPie,
    HiClipboardList,
    HiCog,
    HiHome,
    HiInbox,
    HiLogout,
    HiMenu,
    HiPuzzle,
    HiShoppingBag,
    HiUsers,
    HiX
} from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import { User } from '@/generated/prisma/browser'
import { getMyUser, logout } from '@/app/login/login-actions'
import { usePathname, useRouter } from 'next/navigation'
import { getMyNotificationsCount } from '@/app/lib/notification-actions'
import CookiesBoundary from '@/app/lib/CookiesBoundary'
import Link from 'next/link'

export default function WrappedUserLayout({ children }: { children: ReactNode }) {
    return <CookiesBoundary><UserLayout>{children}</UserLayout></CookiesBoundary>
}

interface NavEntry {
    href: string
    label: string
    icon: IconType
    badge?: number
    exact?: boolean
}

function NavLink({ entry, active, onNavigate }: { entry: NavEntry, active: boolean, onNavigate: () => void }) {
    const Icon = entry.icon
    return <Link href={entry.href} onClick={onNavigate} aria-current={active ? 'page' : undefined}
                 className={`flex items-center gap-3 rounded-full pl-1 pr-3 py-1 border-toon transition-[transform,background-color] duration-100
                 ${active ? 'border-ink bg-butter text-[#4a2511] shadow-toon-sm' : 'border-transparent hover:border-ink/25 hover:bg-cream'}`}>
        <span className={`h-7 w-7 rounded-full flex items-center justify-center border-2
        ${active ? 'border-ink bg-paper text-ink' : 'border-ink/20 bg-paper'}`}>
            <Icon className="h-4 w-4"/>
        </span>
        <span className={active ? 'font-toon text-base' : 'text-sm'}>{entry.label}</span>
        {entry.badge != null && entry.badge > 0 &&
            <span className="ml-auto min-w-6 h-6 px-1.5 rounded-full bg-tomato text-white text-xs font-bold border-2 border-ink
            flex items-center justify-center">{entry.badge}</span>}
    </Link>
}

function UserLayout({ children }: { children: ReactNode }) {
    const { t } = useTranslationClient('user')
    const [ myUser, setMyUser ] = useState<User>()
    const router = useRouter()
    const pathname = usePathname()
    const [ drawerOpen, setDrawerOpen ] = useState(false)
    const [ notifications, setNotifications ] = useState(0)

    useEffect(() => {
        (async () => {
            setMyUser((await getMyUser())!)
            setNotifications(await getMyNotificationsCount())
        })()

        const intervalId = setInterval(async () => {
            setNotifications(await getMyNotificationsCount())
        }, 10000)
        return () => clearInterval(intervalId)
    }, [])

    const isAdmin = myUser?.permissions.includes('admin.manage') ?? false
    const mine: NavEntry[] = [
        { href: '/user', label: t('nav.dashboard'), icon: HiHome, exact: true },
        { href: '/user/orders', label: t('nav.orders'), icon: HiCake },
        { href: '/user/logs', label: t('nav.auditLogs'), icon: HiCash },
        { href: '/user/inbox', label: t('nav.inbox'), icon: HiInbox, badge: notifications }
    ]
    const store: NavEntry[] = [
        { href: '/today', label: t('nav.queue'), icon: HiClipboardList },
        { href: '/user/manage/orders', label: t('nav.manageOrders'), icon: HiCake },
        { href: '/user/manage/storefront', label: t('nav.manageStore'), icon: HiShoppingBag },
        { href: '/user/manage/users', label: t('nav.manageUsers'), icon: HiUsers },
        { href: '/user/manage/stats', label: t('nav.manageStats'), icon: HiChartPie },
        { href: '/user/manage/settings', label: t('nav.manageSettings'), icon: HiCog },
        { href: '/user/manage/logs', label: t('nav.manageAuditLogs'), icon: HiCash }
    ]
    const isActive = (entry: NavEntry) => entry.exact ? pathname === entry.href : pathname === entry.href || pathname.startsWith(`${entry.href}/`)
    const close = () => setDrawerOpen(false)

    const sidebar = <nav aria-label={t('nav.sidebar')}
                         className="toon h-full flex flex-col gap-4 p-4 overflow-y-auto scrollbar-none">
        <Link href="/" className="flex items-center gap-2.5 group" onClick={close}>
            <img width={44} height={44} src="/assets/logo.png" alt=""
                 className="w-11 h-11 rounded-full bg-white border-toon border-ink group-hover:rotate-[-10deg] transition-transform"/>
            <span>
                <span className="block font-toon text-xl leading-tight">{t('brand')}</span>
                <span className="block text-xs secondary">{isAdmin ? t('nav.staffArea') : t('nav.myArea')}</span>
            </span>
        </Link>

        <div>
            <p className="text-xs secondary mb-2 pl-2">{t('nav.sectionMine')}</p>
            <div className="flex flex-col gap-0.5">
                {mine.map(entry => <NavLink key={entry.href} entry={entry} active={isActive(entry)} onNavigate={close}/>)}
            </div>
        </div>

        {isAdmin && <div>
            <p className="text-xs secondary mb-2 pl-2">{t('nav.sectionStore')}</p>
            <div className="flex flex-col gap-0.5">
                {store.map(entry => <NavLink key={entry.href} entry={entry} active={isActive(entry)} onNavigate={close}/>)}
            </div>
            <Link href="/user/manage/break" onClick={close}
                  className={`mt-3 flex items-center gap-3 rounded-2xl border-toon border-ink px-3 py-2 rotate-[-1.5deg]
                  hover:rotate-0 transition-transform ${pathname.startsWith('/user/manage/break') ? 'bg-whale' : 'bg-whale/50'}`}>
                <span className="h-9 w-9 rounded-full bg-paper border-2 border-ink flex items-center justify-center">
                    <HiPuzzle className="h-5 w-5"/>
                </span>
                <span>
                    <span className="block font-toon">{t('nav.break')}</span>
                    <span className="block text-xs text-ink/70">{t('nav.breakHint')}</span>
                </span>
            </Link>
        </div>}

        <div className="mt-auto flex flex-col gap-3">
            <p className="text-xs leading-relaxed bg-butter/40 border-2 border-dashed border-ink/30 rounded-xl p-3">
                <span className="font-toon mr-1">{t('nav.beta')}</span>
                <span className="secondary">{t('nav.betaDetails')}</span>
            </p>
            <div className="flex items-center gap-3 border-t-2 border-dashed border-ink/20 pt-3">
                <span className="h-10 w-10 rounded-full border-toon border-ink bg-whale text-[#163746] font-toon text-lg
                flex items-center justify-center shrink-0">{myUser?.name.at(0) ?? ''}</span>
                <span className="min-w-0 flex-grow">
                    <span className="block font-toon truncate">{myUser?.name ?? '...'}</span>
                    <span className="block text-xs secondary truncate">{myUser?.pinyin ?? ''}</span>
                </span>
                <button onClick={() => {
                    void logout().then(() => router.replace('/'))
                }} aria-label={t('nav.logOut')} title={t('nav.logOut')}
                        className="h-9 w-9 rounded-full border-2 border-ink/30 hover:border-ink hover:bg-blush/50 flex items-center justify-center shrink-0">
                    <HiLogout className="h-4 w-4"/>
                </button>
            </div>
        </div>
    </nav>

    return <div className="dots min-h-screen lg:h-screen lg:flex lg:overflow-hidden">
        {/* Phones: top bar and a slide-in drawer */}
        <div className="lg:hidden sticky top-0 z-40 h-16 flex items-center gap-3 px-3 bg-paper border-b-toon border-ink">
            <button onClick={() => setDrawerOpen(true)} aria-label={t('nav.sidebar')} aria-expanded={drawerOpen}
                    className="h-10 w-10 rounded-full border-toon border-ink bg-butter text-[#4a2511] shadow-toon-sm flex items-center justify-center">
                <HiMenu className="h-5 w-5"/>
            </button>
            <Link href="/" className="font-toon text-xl">{t('brand')}</Link>
        </div>
        <div className={`lg:hidden fixed inset-0 z-50 transition-opacity duration-150 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
             aria-hidden={!drawerOpen}>
            <div className="absolute inset-0 bg-ink/40" onClick={close}/>
            <div className={`absolute top-0 left-0 bottom-0 w-[85%] max-w-xs p-3 transition-transform duration-200
            ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {sidebar}
                <button onClick={close} aria-label={t('close')}
                        className="absolute top-5 right-5 h-9 w-9 rounded-full border-2 border-ink bg-paper flex items-center justify-center">
                    <HiX/>
                </button>
            </div>
        </div>

        <aside className="hidden lg:block w-72 shrink-0 h-screen p-4 pr-2">
            {sidebar}
        </aside>
        <main className="flex-grow lg:h-screen lg:overflow-y-auto" aria-label={t('a11y.mainContent')}>
            {children}
        </main>
    </div>
}
