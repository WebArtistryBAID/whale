'use client'

import { Ad } from '@/generated/prisma/browser'
import { Carousel } from 'flowbite-react'
import If from '@/app/lib/If'
import { useTranslationClient } from '@/app/i18n/client'

export default function UIAdsClient({ ads, uploadPrefix }: { ads: Ad[], uploadPrefix: string }) {
    const { t } = useTranslationClient('welcome')

    return <If condition={ads.length > 0}>
        <Carousel aria-label={t('ads')} indicators={ads.length > 1} leftControl={ads.length > 1 ? undefined : <span/>}
                  rightControl={ads.length > 1 ? undefined : <span/>}
                  className="rounded-3xl overflow-hidden shadow-card" slideInterval={5000} pauseOnHover>
            {ads.map(ad => <a href={ad.url ?? '#'} className="relative block h-full w-full" key={ad.id}>
                <img src={uploadPrefix + ad.image} width={100} height={100} alt=""
                     className="absolute inset-0 h-full w-full object-cover"/>
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent
                px-5 pt-10 pb-4 text-white font-semibold">{ad.name}</span>
            </a>)}
        </Carousel>
    </If>
}
