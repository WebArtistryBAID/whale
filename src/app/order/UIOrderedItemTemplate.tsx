import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'

/**
 * One line of a receipt: amount, name, options and price.
 */
export default function UIOrderedItemTemplate({ item, index, uploadPrefix, price }: {
    item: OrderedItemTemplate,
    index: number,
    uploadPrefix: string,
    price?: string
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const linePrice = price ?? calculatePrice(item).toString()
    return <div className="flex gap-3" aria-label={item.item.name + ' ' + t('a11y.shoppingCartItem')}>
        <img src={uploadPrefix + item.item.image} alt="" width={512} height={512}
             className="flex-shrink-0 w-12 h-12 object-cover rounded bg-cream-100"/>
        <div className="flex-grow min-w-0">
            <div className="flex items-baseline gap-2">
                <span aria-hidden className="font-serif tabular-nums secondary">{item.amount}×</span>
                <p className="font-semibold truncate">{item.item.name}</p>
                <span aria-hidden className="price ml-auto">¥{linePrice}</span>
            </div>
            <div className="flex items-baseline gap-3">
                <p className="text-xs secondary truncate">
                    <span className="sr-only">{t('a11y.appliedOptions')}</span>
                    {item.options.map(i => i.name).join('，')}
                </p>
                <If condition={index !== -1}>
                    <button onClick={() => shoppingCart.removeItem(index)}
                            className="ml-auto flex-shrink-0 text-xs secondary underline underline-offset-2
                            hover:text-caramel">{t('remove')}</button>
                </If>
            </div>
            <span className="sr-only">{t('a11y.priceAmountShoppingCart', {
                item: item.amount,
                price: linePrice
            })}</span>
        </div>
    </div>
}
