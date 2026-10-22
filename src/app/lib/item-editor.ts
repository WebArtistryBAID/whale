import { money, positiveId } from '@/app/lib/security'

export interface ItemEditorInput {
    categoryId: number
    name: string
    image: string
    description: string
    shortDescription: string
    basePrice: string
    salePercent: string
    countsTowardLimit: boolean
    inventoryTrackingEnabled: boolean
    remainingItems: number
    initialRemainingItems?: number
    soldOut: boolean
    tagIds: number[]
    optionTypeIds: number[]
}

export type ItemEditorValues = Omit<ItemEditorInput, 'remainingItems' | 'initialRemainingItems'> & { remainingItems: string }
export type ItemEditorErrors = Partial<Record<keyof ItemEditorValues, boolean>>

export function validInventory(value: string): boolean {
    return /^(0|[1-9]\d*)$/.test(value) && Number(value) <= 2147483647
}

export function validateItem(values: ItemEditorValues): ItemEditorErrors {
    return Object.fromEntries(Object.entries({
        name: typeof values.name !== 'string' || !values.name.trim(),
        categoryId: !positiveId(values.categoryId),
        image: typeof values.image !== 'string' || !values.image.trim(),
        description: typeof values.description !== 'string' || !values.description.trim() || values.description.length > 384,
        shortDescription: typeof values.shortDescription !== 'string' || !values.shortDescription.trim() || values.shortDescription.length > 32,
        basePrice: !money(values.basePrice),
        salePercent: typeof values.salePercent !== 'string' || !/^(?:0(?:\.\d{1,6})?|1(?:\.0{1,6})?)$/.test(values.salePercent),
        remainingItems: typeof values.remainingItems !== 'string' || !validInventory(values.remainingItems),
        tagIds: !Array.isArray(values.tagIds) || values.tagIds.some(id => !positiveId(id)) || new Set(values.tagIds).size !== values.tagIds.length,
        optionTypeIds: !Array.isArray(values.optionTypeIds) || values.optionTypeIds.some(id => !positiveId(id)) || new Set(values.optionTypeIds).size !== values.optionTypeIds.length,
        countsTowardLimit: typeof values.countsTowardLimit !== 'boolean',
        inventoryTrackingEnabled: typeof values.inventoryTrackingEnabled !== 'boolean',
        soldOut: typeof values.soldOut !== 'boolean'
    }).filter(([, invalid]) => invalid))
}

export function recordId(value: unknown): number | null {
    return typeof value === 'string' && /^[1-9]\d*$/.test(value) && Number(value) <= 2147483647 ? Number(value) : null
}
