import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { HiTrash } from 'react-icons/hi'

export default function UIOrderedItemTemplate({ item, index, uploadPrefix, price }: {
    item: OrderedItemTemplate,
    index: number,
    uploadPrefix: string,
    price?: string
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const linePrice = price ?? calculatePrice(item).toString()
    return <div className="flex items-center gap-4" aria-label={item.item.name + ' ' + t('a11y.shoppingCartItem')}>
        <div className="relative flex-shrink-0">
            <img src={uploadPrefix + item.item.image} alt="" width={512} height={512}
                 className="w-16 h-16 lg:w-20 lg:h-20 object-cover rounded-2xl bg-cream-100"/>
            <span aria-hidden className="absolute -top-1.5 -right-1.5 h-6 min-w-6 px-1.5 rounded-full bg-espresso
            dark:bg-caramel text-white text-xs font-bold flex items-center justify-center ring-2 ring-white
            dark:ring-espresso-700 tabular-nums">{item.amount}</span>
        </div>
        <div className="flex-grow min-w-0">
            <p className="font-semibold leading-snug">{item.item.name}</p>
            <p className="text-sm secondary truncate">
                <span className="sr-only">{t('a11y.appliedOptions')}</span>
                {item.options.map(i => i.name).join(' · ')}
            </p>
            <p aria-hidden className="price mt-1">¥{linePrice}</p>
            <span className="sr-only">{t('a11y.priceAmountShoppingCart', {
                item: item.amount,
                price: linePrice
            })}</span>
        </div>
        <If condition={index !== -1}>
            <button aria-label={t('remove')} onClick={() => shoppingCart.removeItem(index)}
                    className="h-9 w-9 flex-shrink-0 rounded-full flex items-center justify-center secondary
                    hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                <HiTrash/>
            </button>
        </If>
    </div>
}
