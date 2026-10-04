import { calculatePrice, OrderedItemTemplate, useShoppingCart } from '@/app/lib/shopping-cart'
import { useTranslationClient } from '@/app/i18n/client'
import If from '@/app/lib/If'
import { HiX } from 'react-icons/hi'

export default function UIOrderedItemTemplate({ item, index, uploadPrefix, price }: {
    item: OrderedItemTemplate,
    index: number,
    uploadPrefix: string,
    price?: string
}) {
    const { t } = useTranslationClient('order')
    const shoppingCart = useShoppingCart()
    const linePrice = price ?? calculatePrice(item).toString()
    return <div className="flex items-center gap-3" aria-label={item.item.name + ' ' + t('a11y.shoppingCartItem')}>
        <div className="relative flex-shrink-0">
            <img src={uploadPrefix + item.item.image} alt="" width={512} height={512}
                 className="w-14 h-14 lg:w-16 lg:h-16 object-cover rounded-full border-toon border-ink bg-latte"/>
            <span aria-hidden className="absolute -bottom-1 -right-1 h-6 min-w-6 px-1 rounded-full border-2 border-ink
            bg-butter text-[#4a2511] font-toon text-sm flex items-center justify-center">{item.amount}</span>
        </div>
        <div className="flex-grow min-w-0">
            <p className="font-toon text-lg leading-tight truncate">{item.item.name}</p>
            <p className="text-xs secondary truncate">
                <span className="sr-only">{t('a11y.appliedOptions')}</span>
                {item.options.map(i => i.name).join(' / ')}
            </p>
        </div>
        <p aria-hidden className="font-toon text-lg flex-shrink-0">¥{linePrice}</p>
        <span className="sr-only">{t('a11y.priceAmountShoppingCart', { item: item.amount, price: linePrice })}</span>
        <If condition={index !== -1}>
            <button aria-label={t('remove')} onClick={() => shoppingCart.removeItem(index)}
                    className="h-8 w-8 flex-shrink-0 rounded-full border-2 border-ink/30 flex items-center justify-center
                    hover:border-ink hover:bg-tomato hover:text-white transition-colors">
                <HiX/>
            </button>
        </If>
    </div>
}
