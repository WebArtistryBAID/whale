import { useTranslationClient } from '@/app/i18n/client'
import { HydratedOrderedItem } from '@/app/lib/ordering-actions'

export default function UIOrderedItem({ item }: { item: HydratedOrderedItem }) {
    const { t } = useTranslationClient('order')
    return <>
        {
            Array.from({ length: item.amount }, (_, index) => (
                <div key={index + '-' + item.id}
                     aria-label={item.itemType.name + ' ' + t('a11y.shoppingCartItem')}>
                    <p className="font-bold font-display text-lg" aria-hidden>{item.itemType.name}</p>
                    <p aria-hidden>x1</p>
                    <p>
                        <span className="sr-only">{t('a11y.appliedOptions')}</span>
                        {item.appliedOptions.map(i => i.name).join(' / ')}
                    </p>
                </div>
            ))
        }
    </>
}
