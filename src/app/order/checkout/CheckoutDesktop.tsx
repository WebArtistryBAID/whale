'use client'

import { useTranslationClient } from '@/app/i18n/client'
import { useShoppingCart } from '@/app/lib/shopping-cart'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UIOrderedItemTemplate from '@/app/order/UIOrderedItemTemplate'
import { Trans } from 'react-i18next/TransWithoutContext'
import If from '@/app/lib/If'
import { Button, TextInput } from 'flowbite-react'
import { PaymentMethod } from '@prisma/client'

function PaymentMethodButton({ paymentMethod, selected, select }: {
    paymentMethod: PaymentMethod,
    selected: boolean,
    select: () => void
}) {
    const { t } = useTranslationClient('order')
    return <Button color={selected ? 'warning' : 'gray'} pill size="xs"
                   onClick={select}>
        {t(`checkout.${paymentMethod}`)}
        <If condition={selected}>
            <span className="sr-only">{t('a11y.selected')}</span>
        </If>
    </Button>
}

export default function CheckoutDesktop({ uploadPrefix }: { uploadPrefix: string }) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const router = useRouter()
    const [ paymentMethod, setPaymentMethod ] = useState<PaymentMethod>(PaymentMethod.wxPay)
    const [ coupon, setCoupon ] = useState('')

    useEffect(() => {
        if (shoppingCart.items.length < 1) {
            router.push('/order')
        }
    }, [ shoppingCart.items, router ])

    return <div className="flex w-screen h-[93vh]">
        <div className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto" aria-label={t('checkout.title')}>
            <h1 aria-hidden className="mb-5">{t('checkout.title')}</h1>

            <p aria-hidden className="mb-1">{t('checkout.orderDetails')}</p>
            <div className="mb-5 text-sm p-5 bg-yellow-50 dark:bg-yellow-800 rounded-3xl"
                 aria-label={t('checkout.orderDetails')}>
                <p className="text-sm">{t('checkout.total')}</p>
                <p className="mb-3 text-lg">¥{shoppingCart.getTotalPrice().toString()}</p>
                <p className="text-sm">{t('checkout.wait')}</p>
                <p className="text-lg"><Trans t={t} i18nKey="checkout.waitTime" count={3}/></p>
            </div>

            <p aria-hidden className="mb-1">{t('checkout.paymentMethod')}</p>
            <div className="mb-5 flex gap-3" aria-label={t('checkout.paymentMethod')}>
                <PaymentMethodButton paymentMethod={PaymentMethod.wxPay}
                                     selected={paymentMethod === PaymentMethod.wxPay}
                                     select={() => setPaymentMethod(PaymentMethod.wxPay)}/>
                <PaymentMethodButton paymentMethod={PaymentMethod.cash} selected={paymentMethod === PaymentMethod.cash}
                                     select={() => setPaymentMethod(PaymentMethod.cash)}/>
                <PaymentMethodButton paymentMethod={PaymentMethod.balance}
                                     selected={paymentMethod === PaymentMethod.balance}
                                     select={() => setPaymentMethod(PaymentMethod.balance)}/>
                <PaymentMethodButton paymentMethod={PaymentMethod.payLater}
                                     selected={paymentMethod === PaymentMethod.payLater}
                                     select={() => setPaymentMethod(PaymentMethod.payLater)}/>
                <PaymentMethodButton paymentMethod={PaymentMethod.payForMe}
                                     selected={paymentMethod === PaymentMethod.payForMe}
                                     select={() => setPaymentMethod(PaymentMethod.payForMe)}/>
            </div>

            <p aria-hidden className="mb-1">{t('checkout.coupon')}</p>
            <TextInput className="w-full mb-8" type="text" value={coupon} placeholder={t('checkout.coupon') + '...'}
                       onChange={e => setCoupon(e.currentTarget.value)}/>

            <Button fullSized color="warning">{t('checkout.pay')}</Button>
        </div>
        <div
            className="w-1/2 p-8 xl:p-16 h-full overflow-y-auto border-l border-yellow-100 dark:border-yellow-800 flex flex-col gap-5"
            aria-label={t('a11y.orderedItems')}>
            {shoppingCart.items.map((item, index) => <UIOrderedItemTemplate key={index} item={item} index={-1}
                                                                            uploadPrefix={uploadPrefix}/>)}
        </div>
    </div>
}
