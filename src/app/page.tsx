import { serverTranslation } from '@/app/i18n'
import SimpleNav from '@/app/core-components/SimpleNav'
import Link from 'next/link'
import { HiCake, HiUser } from 'react-icons/hi'
import { getMyUser } from '@/app/login/login-actions'
import If from '@/app/lib/If'
import RecentOrder from '@/app/core-components/RecentOrder'
import UIAds from '@/app/core-components/UIAds'

export default async function Home() {
    const { t } = await serverTranslation('welcome')
    const user = await getMyUser()

    return <>
        <SimpleNav/>
        <div id="primary-content" className="flex flex-col lg:flex-row w-screen lg:h-[93vh]">
            <div className="lg:w-1/2 w-full text-center lg:text-left items-center lg:items-start
            flex flex-col lg:justify-center p-8 xl:p-16 lg:h-full overflow-y-auto" aria-label={t('welcome')}>
                <h1>{t('title')}</h1>
                <h2 className="text-lg font-normal mb-5">{t('subtitle')}</h2>

                <div className="flex flex-wrap justify-center items-center gap-5">
                    <Link aria-label={t('order')} className="w-40 h-40 rounded-3xl bg-yellow-100 dark:bg-yellow-800
                    hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5" href="/order">
                        <HiCake className="text-yellow-400 text-3xl mb-1"/>
                        <p className="font-bold text-lg" aria-hidden>{t('order')}</p>
                        <p className="secondary text-xs" aria-hidden>{t('orderSub')}</p>
                    </Link>

                    <If condition={user == null}>
                        <Link aria-label={t('login')} className="w-40 h-40 rounded-3xl bg-yellow-100 dark:bg-yellow-800
                    hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5" href="/login">
                            <HiUser className="text-yellow-400 text-3xl mb-1"/>
                            <p className="font-bold text-lg" aria-hidden>{t('login')}</p>
                            <p className="secondary text-xs" aria-hidden>{t('loginSub')}</p>
                        </Link>
                    </If>

                    <If condition={user != null}>
                        <Link aria-label={t('login')} className="w-40 h-40 rounded-3xl bg-yellow-100 dark:bg-yellow-800
                    hover:bg-yellow-200 dark:hover:bg-yellow-700 transition-colors duration-100
                    flex flex-col text-center items-center justify-center p-5" href="/user">
                            <HiUser className="text-yellow-400 text-3xl mb-1"/>
                            <p className="font-bold text-lg" aria-hidden>{t('user')}</p>
                            <p className="secondary text-xs" aria-hidden>{t('userSub')}</p>
                        </Link>
                    </If>

                    <RecentOrder/>
                </div>
            </div>
            <div
                className="lg:w-1/2 w-full p-8 xl:p-16 lg:h-full overflow-y-auto border-l border-yellow-100 dark:border-yellow-800 flex flex-col gap-5"
                aria-label={t('news')}>
                <div className="hidden lg:block h-1/2"></div>
                <div className="h-72 lg:h-1/2 w-full">
                    <UIAds/>
                </div>
            </div>
        </div>
    </>
}
