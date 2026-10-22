'use server'

import { money, positiveId } from '@/app/lib/security'
import { validateItem, type ItemEditorInput } from '@/app/lib/item-editor'

import {
    Ad,
    Category,
    CouponCode,
    ItemType,
    OptionItem,
    OptionType,
    Prisma,
    Tag,
    UserAuditLogType
} from '@/generated/prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import { HydratedCategory, HydratedItemType, HydratedOptionType } from '@/app/lib/ui-data-actions'
import { normalizeCouponCode } from '@/app/lib/coupon-codes'
import Decimal from 'decimal.js'
import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import CategoryCreateInput = Prisma.CategoryCreateInput
import OptionTypeCreateInput = Prisma.OptionTypeCreateInput
import OptionItemCreateInput = Prisma.OptionItemCreateInput
import TagCreateInput = Prisma.TagCreateInput
import CouponCodeCreateInput = Prisma.CouponCodeCreateInput
import AdCreateInput = Prisma.AdCreateInput

async function storefrontMutation<T>(mutation: () => Promise<T>): Promise<T> {
    const result = await mutation()
    revalidatePath('/user/manage/storefront', 'layout')
    revalidatePath('/order')
    return result
}

async function getNextCategoryDisplayOrder() {
    const result = await prisma.category.aggregate({
        _max: {
            displayOrder: true
        }
    })
    return (result._max.displayOrder ?? -1) + 1
}

async function getNextOptionItemDisplayOrder(typeId: number) {
    const result = await prisma.optionItem.aggregate({
        where: {
            typeId
        },
        _max: {
            displayOrder: true
        }
    })
    return (result._max.displayOrder ?? -1) + 1
}

export async function getCategories(): Promise<Category[]> {
    await requireUserPermission('admin.manage')
    return prisma.category.findMany({
        orderBy: [
            { displayOrder: 'asc' },
            { id: 'asc' }
        ]
    })
}

export async function getCategory(id: number): Promise<HydratedCategory | null> {
    await requireUserPermission('admin.manage')
    return prisma.category.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: [
                    { displayOrder: 'asc' },
                    { id: 'asc' }
                ],
                include: {
                    tags: true,
                    options: {
                        include: {
                            items: {
                                orderBy: [
                                    { displayOrder: 'asc' },
                                    { id: 'asc' }
                                ]
                            }
                        }
                    }
                }
            }
        }
    })
}

export async function getItemTypes(category: number): Promise<HydratedItemType[]> {
    await requireUserPermission('admin.manage')
    return prisma.itemType.findMany({
        where: { categoryId: category },
        orderBy: [
            { displayOrder: 'asc' },
            { id: 'asc' }
        ],
        include: {
            tags: true,
            options: {
                include: {
                    items: {
                        orderBy: [
                            { displayOrder: 'asc' },
                            { id: 'asc' }
                        ]
                    }
                }
            }
        }
    })
}

export async function getItemType(id: number): Promise<HydratedItemType | null> {
    await requireUserPermission('admin.manage')
    return prisma.itemType.findUnique({
        where: { id },
        include: {
            tags: true,
            options: {
                include: {
                    items: {
                        orderBy: [
                            { displayOrder: 'asc' },
                            { id: 'asc' }
                        ]
                    }
                }
            }
        }
    })
}

export async function getOptionTypes(): Promise<OptionType[]> {
    await requireUserPermission('admin.manage')
    return prisma.optionType.findMany({
        orderBy: [
            { id: 'asc' }
        ]
    })
}

export async function getOptionTypesHydrated(): Promise<HydratedOptionType[]> {
    await requireUserPermission('admin.manage')
    return prisma.optionType.findMany({
        orderBy: [
            { id: 'asc' }
        ],
        include: {
            items: {
                orderBy: [
                    { displayOrder: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    })
}

export async function getOptionType(id: number): Promise<HydratedOptionType | null> {
    await requireUserPermission('admin.manage')
    return prisma.optionType.findUnique({
        where: { id },
        include: {
            items: {
                orderBy: [
                    { displayOrder: 'asc' },
                    { id: 'asc' }
                ]
            }
        }
    })
}

export async function getOptionTypeAssociatedItems(id: number): Promise<ItemType[]> {
    await requireUserPermission('admin.manage')
    return prisma.itemType.findMany({
        where: {
            options: {
                some: {
                    id
                }
            }
        },
        orderBy: [
            { category: { displayOrder: 'asc' } },
            { displayOrder: 'asc' },
            { id: 'asc' }
        ]
    })
}

export async function getOptionItems(type: number): Promise<OptionItem[]> {
    await requireUserPermission('admin.manage')
    return prisma.optionItem.findMany({
        where: { typeId: type },
        orderBy: [
            { displayOrder: 'asc' },
            { id: 'asc' }
        ]
    })
}

export async function getOptionItem(id: number): Promise<OptionItem | null> {
    await requireUserPermission('admin.manage')
    return prisma.optionItem.findUnique({ where: { id } })
}

export async function getCouponCodes(): Promise<CouponCode[]> {
    await requireUserPermission('admin.manage')
    return prisma.couponCode.findMany()
}

export async function getCouponCode(id: string): Promise<CouponCode | null> {
    await requireUserPermission('admin.manage')
    return prisma.couponCode.findUnique({ where: { id: normalizeCouponCode(id) } })
}

export async function getTags(): Promise<Tag[]> {
    await requireUserPermission('admin.manage')
    return prisma.tag.findMany()
}

export async function getTag(id: number): Promise<Tag | null> {
    await requireUserPermission('admin.manage')
    return prisma.tag.findUnique({ where: { id } })
}

export async function getTagAssociatedItems(id: number): Promise<ItemType[]> {
    await requireUserPermission('admin.manage')
    return prisma.itemType.findMany({
        where: {
            tags: {
                some: {
                    id
                }
            }
        }
    })
}

export async function getAds(): Promise<Ad[]> {
    await requireUserPermission('admin.manage')
    return prisma.ad.findMany()
}

export async function getAd(id: number): Promise<Ad | null> {
    await requireUserPermission('admin.manage')
    return prisma.ad.findUnique({ where: { id } })
}

export async function upsertCategory(id: number | undefined, data: CategoryCreateInput): Promise<Category> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertCategory,
                userId: user.id,
                values: [ data.name ]
            }
        })
        if (id == null) {
            return prisma.category.create({
                data: {
                    ...data,
                    displayOrder: await getNextCategoryDisplayOrder()
                }
            })
        }
        return prisma.category.upsert({
            where: { id },
            update: data,
            create: {
                ...data,
                displayOrder: await getNextCategoryDisplayOrder()
            }
        })
    })
}

export async function upsertOptionType(id: number | undefined, data: OptionTypeCreateInput): Promise<OptionType> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertOptionType,
                userId: user.id,
                values: [ data.name ]
            }
        })
        if (id == null) {
            return prisma.optionType.create({ data })
        }
        return prisma.optionType.upsert({ where: { id }, update: data, create: data })
    })
}

export async function upsertOptionItem(id: number | undefined, data: OptionItemCreateInput): Promise<OptionItem> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        if (typeof data.priceChange !== 'string' || !money(data.priceChange.replace(/^-/, ''))) throw new Error('Invalid option price')
        const typeId = data.type.connect?.id
        if (typeId == null) {
            throw new Error('Option items must be connected to a type.')
        }
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertOptionItem,
                userId: user.id,
                values: [ data.name ]
            }
        })
        if (data.default) {
            await prisma.optionItem.updateMany({
                where: {
                    typeId,
                    default: true
                },
                data: {
                    default: false
                }
            })
        }
        const existing = id == null ? null : await prisma.optionItem.findUnique({
            where: { id },
            select: {
                typeId: true,
                displayOrder: true
            }
        })
        const displayOrder =
            existing == null || existing.typeId !== typeId
                ? await getNextOptionItemDisplayOrder(typeId)
                : existing.displayOrder

        if (id == null) {
            return prisma.optionItem.create({
                data: {
                    ...data,
                    displayOrder
                }
            })
        }
        return prisma.optionItem.upsert({
            where: { id },
            update: {
                ...data,
                displayOrder
            },
            create: {
                ...data,
                displayOrder
            }
        })
    })
}

export async function upsertTag(id: number | undefined, data: TagCreateInput): Promise<Tag> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertTag,
                userId: user.id,
                values: [ data.name ]
            }
        })
        if (id == null) {
            return prisma.tag.create({ data })
        }
        return prisma.tag.upsert({ where: { id }, update: data, create: data })
    })
}

export async function upsertCouponCode(data: CouponCodeCreateInput): Promise<CouponCode> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        if (!money(data.value) || !Number.isSafeInteger(data.remainingUses) || data.remainingUses < 0 || !normalizeCouponCode(data.id)) throw new Error('Invalid coupon')
        const normalizedData = {
            ...data,
            id: normalizeCouponCode(data.id)
        }
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertCouponCode,
                userId: user.id,
                values: [ normalizedData.id ]
            }
        })
        return prisma.couponCode.upsert({
            where: { id: normalizedData.id },
            update: normalizedData,
            create: normalizedData
        })
    })
}

export async function upsertAd(id: number | undefined, data: AdCreateInput): Promise<Ad> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        if (id == null) {
            const ad = await prisma.ad.create({ data })
            await prisma.userAuditLog.create({
                data: {
                    type: UserAuditLogType.upsertAd,
                    userId: user.id,
                    values: [ ad.id.toString() ]
                }
            })
            return ad
        }
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.upsertAd,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.ad.upsert({ where: { id }, update: data, create: data })
    })
}

export async function upsertItemType(id: number | undefined, data: ItemEditorInput): Promise<HydratedItemType> {
    const user = await requireUserPermission('admin.manage')
    if (id != null && !positiveId(id)) throw new Error('Invalid item ID')
    if (Object.keys(validateItem({ ...data, remainingItems: String(data.remainingItems) })).length) throw new Error('Invalid item')
    const result = await prisma.$transaction(async tx => {
        const existing = id == null ? null : await tx.itemType.findUnique({ where: { id } })
        if (id != null && !existing) throw new Error('Item no longer exists')
        const [category, tags, options] = await Promise.all([
            tx.category.findUnique({ where: { id: data.categoryId } }),
            tx.tag.count({ where: { id: { in: data.tagIds } } }),
            tx.optionType.count({ where: { id: { in: data.optionTypeIds } } })
        ])
        if (!category || tags !== data.tagIds.length || options !== data.optionTypeIds.length) throw new Error('Selected records no longer exist')
        const movingCategory = !existing || existing.categoryId !== data.categoryId
        const maximum = movingCategory ? await tx.itemType.aggregate({ where: { categoryId: data.categoryId }, _max: { displayOrder: true } }) : null
        const displayOrder = movingCategory ? (maximum?._max.displayOrder ?? -1) + 1 : existing!.displayOrder
        const inventoryChanged = existing == null || data.remainingItems !== data.initialRemainingItems
        if (existing && inventoryChanged && existing.remainingItems !== data.initialRemainingItems) throw new Error('Inventory changed; reload before updating its count')
        const fields = {
            categoryId: data.categoryId, name: data.name.trim(), image: data.image,
            description: data.description, shortDescription: data.shortDescription,
            basePrice: Decimal(data.basePrice).toString(), salePercent: Decimal(data.salePercent).toString(),
            displayOrder, countsTowardLimit: data.countsTowardLimit, inventoryTrackingEnabled: data.inventoryTrackingEnabled,
            ...(inventoryChanged ? { remainingItems: data.remainingItems } : {}), soldOut: data.soldOut
        }
        const include = {
            tags: true,
            options: { include: { items: { orderBy: [{ displayOrder: 'asc' as const }, { id: 'asc' as const }] } } }
        }
        const tagIds = data.tagIds.map(id => ({ id }))
        const optionIds = data.optionTypeIds.map(id => ({ id }))
        const item = existing == null
            ? await tx.itemType.create({ data: { ...fields, tags: { connect: tagIds }, options: { connect: optionIds } }, include })
            : await tx.itemType.update({
                where: { id: existing.id, ...(inventoryChanged ? { remainingItems: data.initialRemainingItems } : {}) },
                data: { ...fields, tags: { set: tagIds }, options: { set: optionIds } }, include
            })
        await tx.userAuditLog.create({ data: { type: UserAuditLogType.upsertItemType, userId: user.id, values: [item.name] } })
        return item
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
    revalidatePath('/user/manage/storefront', 'layout')
    revalidatePath('/order')
    return result
}

export async function deleteCategory(id: number): Promise<Category> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteCategory,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.category.delete({ where: { id } })
    })
}

export async function deleteItemType(id: number): Promise<HydratedItemType> {
    const user = await requireUserPermission('admin.manage')
    if (!positiveId(id)) throw new Error('Invalid item ID')
    const result = await prisma.$transaction(async tx => {
        const item = await tx.itemType.delete({ where: { id }, include: { tags: true, options: { include: { items: true } } } })
        await tx.userAuditLog.create({ data: { type: UserAuditLogType.deleteItemType, userId: user.id, values: [String(id)] } })
        return item
    })
    revalidatePath('/user/manage/storefront', 'layout')
    revalidatePath('/order')
    return result
}

export async function deleteOptionType(id: number): Promise<OptionType> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteOptionType,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.optionType.delete({ where: { id } })
    })
}

export async function deleteOptionItem(id: number): Promise<OptionItem> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteOptionItem,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.optionItem.delete({ where: { id } })
    })
}

export async function deleteTag(id: number): Promise<Tag> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteTag,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.tag.delete({ where: { id } })
    })
}

export async function deleteCouponCode(id: string): Promise<CouponCode> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        const normalizedId = normalizeCouponCode(id)
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteCouponCode,
                userId: user.id,
                values: [ normalizedId ]
            }
        })
        return prisma.couponCode.delete({ where: { id: normalizedId } })
    })
}

export async function deleteAd(id: number): Promise<Ad> {
    const user = await requireUserPermission('admin.manage')
    return storefrontMutation(async () => {
        await prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.deleteAd,
                userId: user.id,
                values: [ id.toString() ]
            }
        })
        return prisma.ad.delete({ where: { id } })
    })
}

export async function reorderCategories(ids: number[]): Promise<void> {
    const user = await requireUserPermission('admin.manage')
    const categories = await prisma.category.findMany({
        where: {
            id: {
                in: ids
            }
        },
        select: {
            id: true
        }
    })
    if (categories.length !== ids.length) {
        throw new Error('One or more categories were not found.')
    }
    await prisma.$transaction([
        ...ids.map((id, index) => prisma.category.update({
            where: { id },
            data: {
                displayOrder: index
            }
        })),
        prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.reorderCategories,
                userId: user.id,
                values: []
            }
        })
    ])
    revalidatePath('/order')
    revalidatePath('/user/manage/storefront')
}

export async function reorderItemTypes(categoryId: number, ids: number[]): Promise<void> {
    const user = await requireUserPermission('admin.manage')
    const category = await prisma.category.findUnique({
        where: {
            id: categoryId
        },
        select: {
            name: true
        }
    })
    if (category == null) {
        throw new Error('Category not found.')
    }
    const items = await prisma.itemType.findMany({
        where: {
            categoryId,
            id: {
                in: ids
            }
        },
        select: {
            id: true
        }
    })
    if (items.length !== ids.length) {
        throw new Error('One or more items were not found in this category.')
    }
    await prisma.$transaction([
        ...ids.map((id, index) => prisma.itemType.update({
            where: { id },
            data: {
                displayOrder: index
            }
        })),
        prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.reorderItemTypes,
                userId: user.id,
                values: [ category.name ]
            }
        })
    ])
    revalidatePath('/order')
    revalidatePath('/user/manage/storefront')
    revalidatePath(`/user/manage/storefront/categories/${categoryId}`)
}

export async function reorderOptionItems(typeId: number, ids: number[]): Promise<void> {
    const user = await requireUserPermission('admin.manage')
    const optionType = await prisma.optionType.findUnique({
        where: {
            id: typeId
        },
        select: {
            name: true
        }
    })
    if (optionType == null) {
        throw new Error('Option type not found.')
    }
    const items = await prisma.optionItem.findMany({
        where: {
            typeId,
            id: {
                in: ids
            }
        },
        select: {
            id: true
        }
    })
    if (items.length !== ids.length) {
        throw new Error('One or more option items were not found in this option type.')
    }
    await prisma.$transaction([
        ...ids.map((id, index) => prisma.optionItem.update({
            where: { id },
            data: {
                displayOrder: index
            }
        })),
        prisma.userAuditLog.create({
            data: {
                type: UserAuditLogType.reorderOptionItems,
                userId: user.id,
                values: [ optionType.name ]
            }
        })
    ])
    revalidatePath('/order')
    revalidatePath(`/user/manage/storefront/option-types/${typeId}`)
}
