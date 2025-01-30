'use client'

import { Ad } from '@prisma/client'
import { Carousel } from 'flowbite-react'
import Image from 'next/image'
import If from '@/app/lib/If'
import { useTranslationClient } from '@/app/i18n/client'

export default function UIAdsClient({ ads, uploadPrefix }: { ads: Ad[], uploadPrefix: string }) {
    const { t } = useTranslationClient('welcome')

    return <If condition={ads.length > 0}>
        <Carousel aria-label={t('ads')} indicators={false} className="rounded-3xl bg-yellow-50 dark:bg-yellow-800"
                  slideInterval={5000} pauseOnHover>
            {ads.map(ad => <a href={ad.url ?? '#'} className="block h-full w-full" key={ad.id}>
                <Image src={uploadPrefix + ad.image} width={100} height={100} alt=""
                       className="rounded-3xl h-2/3 lg:h-4/5 object-cover w-full"/>
                <p className="text-sm px-5 py-3">{ad.name}</p>
            </a>)}
        </Carousel>
    </If>
}
