'use client'

import { Ad } from '@/generated/prisma/browser'
import { Carousel } from 'flowbite-react'
import If from '@/app/lib/If'
import { useTranslationClient } from '@/app/i18n/client'

export default function UIAdsClient({ ads, uploadPrefix }: { ads: Ad[], uploadPrefix: string }) {
    const { t } = useTranslationClient('welcome')

    return <If condition={ads.length > 0}>
        <div className="toon h-full overflow-hidden rotate-[-0.6deg]">
            <Carousel aria-label={t('ads')} indicators={ads.length > 1} leftControl={ads.length > 1 ? undefined : <span/>}
                      rightControl={ads.length > 1 ? undefined : <span/>}
                      className="h-full [&>div]:rounded-none" slideInterval={5000} pauseOnHover>
                {ads.map(ad => <a href={ad.url ?? '#'} className="relative block h-full w-full" key={ad.id}>
                    <img src={uploadPrefix + ad.image} width={1200} height={600} alt=""
                         className="absolute inset-0 h-full w-full object-cover"/>
                    <span className="absolute left-4 bottom-4 max-w-[85%] font-toon text-lg bg-paper border-toon border-ink
                    rounded-xl px-3 py-1 shadow-toon-sm -rotate-1">{ad.name}</span>
                </a>)}
            </Carousel>
        </div>
    </If>
}
