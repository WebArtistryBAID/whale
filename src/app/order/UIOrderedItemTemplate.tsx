import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import { Button } from 'flowbite-react'
import If from '@/app/lib/If'

export default function UIOrderedItemTemplate({ item, index, uploadPrefix, price }: {
    item: OrderedItemTemplate,
    index: number,
    uploadPrefix: string,
    price: string | undefined
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    return <div className="flex items-center gap-5" aria-label={item.item.name + ' ' + t('a11y.shoppingCartItem')}>
        <img src={uploadPrefix + item.item.image} alt="" width={512} height={512}
             className="w-16 lg:w-24 rounded-full flex-shrink"/>
        <div className="flex-grow">
            <p className="font-bold font-display text-lg" aria-hidden>{item.item.name}</p>
            <p className="text-sm secondary mb-2">
                <span className="sr-only">{t('a11y.appliedOptions')}</span>
                {item.options.map(i => i.name).join(' / ')}
            </p>
            <div className="flex w-full items-center">
                <p aria-hidden className="mr-auto">
                    x<span className="mr-3">{item.amount}</span>
                    ¥{price ?? calculatePrice(item).toString()}
                </p>
                <span className="sr-only">{t('a11y.priceAmountShoppingCart', {
                    item: item.amount,
                    price: price ?? calculatePrice(item).toString()
                })}</span>
                <If condition={index !== -1}>
                    <Button pill size="xs" color="warning"
                            onClick={() => shoppingCart.removeItem(index)}>{t('remove')}</Button>
                </If>
            </div>
        </div>
    </div>
}

UIOrderedItemTemplate.defaultProps = {
    price: undefined
}
