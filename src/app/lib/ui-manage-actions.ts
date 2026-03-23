'use server'

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

async function getNextCategoryDisplayOrder() {
    const result = await prisma.category.aggregate({
        _max: {
            displayOrder: true
        }
    })
    return (result._max.displayOrder ?? -1) + 1
}

async function getNextItemTypeDisplayOrder(categoryId: number) {
    const result = await prisma.itemType.aggregate({
        where: {
            categoryId
        },
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
}

export async function upsertOptionType(id: number | undefined, data: OptionTypeCreateInput): Promise<OptionType> {
    const user = await requireUserPermission('admin.manage')
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
}

export async function upsertOptionItem(id: number | undefined, data: OptionItemCreateInput): Promise<OptionItem> {
    const user = await requireUserPermission('admin.manage')
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
}

export async function upsertTag(id: number | undefined, data: TagCreateInput): Promise<Tag> {
    const user = await requireUserPermission('admin.manage')
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
}

export async function upsertCouponCode(data: CouponCodeCreateInput): Promise<CouponCode> {
    const user = await requireUserPermission('admin.manage')
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
}

export async function upsertAd(id: number | undefined, data: AdCreateInput): Promise<Ad> {
    const user = await requireUserPermission('admin.manage')
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
}

export async function upsertItemType(id: number | undefined, data: HydratedItemType): Promise<HydratedItemType> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.upsertItemType,
            userId: user.id,
            values: [ data.name ]
        }
    })
    const existing = id == null ? null : await prisma.itemType.findUnique({
        where: {
            id
        },
        select: {
            categoryId: true,
            displayOrder: true
        }
    })
    const displayOrder =
        existing == null || existing.categoryId !== data.categoryId
            ? await getNextItemTypeDisplayOrder(data.categoryId)
            : existing.displayOrder
    let result
    if (id == null) {
        result = await prisma.itemType.create({
            data: {
                categoryId: data.categoryId,
                name: data.name,
                image: data.image,
                tags: {
                    connect: data.tags.map(tag => ({ id: tag.id }))
                },
                description: data.description,
                shortDescription: data.shortDescription,
                options: {
                    connect: data.options.map(option => ({ id: option.id }))
                },
                basePrice: Decimal(data.basePrice).toString(),
                salePercent: Decimal(data.salePercent).toString(),
                displayOrder,
                countsTowardLimit: data.countsTowardLimit,
                inventoryTrackingEnabled: data.inventoryTrackingEnabled,
                remainingItems: data.remainingItems,
                soldOut: data.soldOut
            },
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
    } else {
        result = await prisma.itemType.update({
            where: {
                id
            },
            data: {
                categoryId: data.categoryId,
                name: data.name,
                image: data.image,
                tags: {
                    set: data.tags.map(tag => ({ id: tag.id }))
                },
                description: data.description,
                shortDescription: data.shortDescription,
                options: {
                    set: data.options.map(option => ({ id: option.id }))
                },
                basePrice: Decimal(data.basePrice).toString(),
                salePercent: Decimal(data.salePercent).toString(),
                displayOrder,
                countsTowardLimit: data.countsTowardLimit,
                inventoryTrackingEnabled: data.inventoryTrackingEnabled,
                remainingItems: data.remainingItems,
                soldOut: data.soldOut
            },
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
    return result
}

export async function deleteCategory(id: number): Promise<Category> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteCategory,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.category.delete({ where: { id } })
}

export async function deleteItemType(id: number): Promise<HydratedItemType> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteItemType,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.itemType.delete({
        where: {
            id
        },
        include: {
            tags: true,
            options: {
                include: {
                    items: true
                }
            }
        }
    })
}

export async function deleteOptionType(id: number): Promise<OptionType> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteOptionType,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.optionType.delete({ where: { id } })
}

export async function deleteOptionItem(id: number): Promise<OptionItem> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteOptionItem,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.optionItem.delete({ where: { id } })
}

export async function deleteTag(id: number): Promise<Tag> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteTag,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.tag.delete({ where: { id } })
}

export async function deleteCouponCode(id: string): Promise<CouponCode> {
    const user = await requireUserPermission('admin.manage')
    const normalizedId = normalizeCouponCode(id)
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteCouponCode,
            userId: user.id,
            values: [ normalizedId ]
        }
    })
    return prisma.couponCode.delete({ where: { id: normalizedId } })
}

export async function deleteAd(id: number): Promise<Ad> {
    const user = await requireUserPermission('admin.manage')
    await prisma.userAuditLog.create({
        data: {
            type: UserAuditLogType.deleteAd,
            userId: user.id,
            values: [ id.toString() ]
        }
    })
    return prisma.ad.delete({ where: { id } })
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
