'use server'

import { Ad, Category, CouponCode, ItemType, OptionItem, OptionType, Prisma, PrismaClient, Tag } from '@prisma/client'
import { requireUserPermission } from '@/app/login/login-actions'
import { HydratedCategory, HydratedItemType } from '@/app/lib/ui-data-actions'
import Decimal from 'decimal.js'
import CategoryCreateInput = Prisma.CategoryCreateInput
import OptionTypeCreateInput = Prisma.OptionTypeCreateInput
import OptionItemCreateInput = Prisma.OptionItemCreateInput
import TagCreateInput = Prisma.TagCreateInput
import CouponCodeCreateInput = Prisma.CouponCodeCreateInput
import AdCreateInput = Prisma.AdCreateInput

const prisma = new PrismaClient()

export async function getCategories(): Promise<Category[]> {
    await requireUserPermission('admin.manage')
    return prisma.category.findMany()
}

export async function getCategory(id: number): Promise<HydratedCategory | null> {
    await requireUserPermission('admin.manage')
    return prisma.category.findUnique({
        where: { id },
        include: {
            items: {
                include: {
                    tags: true,
                    options: {
                        include: {
                            items: true
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

export async function getOptionTypes(): Promise<OptionType[]> {
    await requireUserPermission('admin.manage')
    return prisma.optionType.findMany()
}

export async function getOptionType(id: number): Promise<OptionType | null> {
    await requireUserPermission('admin.manage')
    return prisma.optionType.findUnique({ where: { id } })
}

export async function getOptionItems(type: number): Promise<OptionItem[]> {
    await requireUserPermission('admin.manage')
    return prisma.optionItem.findMany({ where: { typeId: type } })
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
    return prisma.couponCode.findUnique({ where: { id } })
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
    await requireUserPermission('admin.manage')
    if (id == null) {
        return prisma.category.create({ data })
    }
    return prisma.category.upsert({ where: { id }, update: data, create: data })
}

export async function upsertOptionType(id: number | undefined, data: OptionTypeCreateInput): Promise<OptionType> {
    await requireUserPermission('admin.manage')
    if (id == null) {
        return prisma.optionType.create({ data })
    }
    return prisma.optionType.upsert({ where: { id }, update: data, create: data })
}

export async function upsertOptionItem(id: number | undefined, data: OptionItemCreateInput): Promise<OptionItem> {
    await requireUserPermission('admin.manage')
    if (id == null) {
        return prisma.optionItem.create({ data })
    }
    return prisma.optionItem.upsert({ where: { id }, update: data, create: data })
}

export async function upsertTag(id: number | undefined, data: TagCreateInput): Promise<Tag> {
    await requireUserPermission('admin.manage')
    if (id == null) {
        return prisma.tag.create({ data })
    }
    return prisma.tag.upsert({ where: { id }, update: data, create: data })
}

export async function upsertCouponCode(data: CouponCodeCreateInput): Promise<CouponCode> {
    await requireUserPermission('admin.manage')
    return prisma.couponCode.upsert({ where: { id: data.id }, update: data, create: data })
}

export async function upsertAd(id: number | undefined, data: AdCreateInput): Promise<Ad> {
    await requireUserPermission('admin.manage')
    if (id == null) {
        return prisma.ad.create({ data })
    }
    return prisma.ad.upsert({ where: { id }, update: data, create: data })
}

export async function upsertItemType(id: number | undefined, data: HydratedItemType): Promise<HydratedItemType> {
    await requireUserPermission('admin.manage')
    await prisma.itemType.upsert({
        where: {
            id
        },
        update: {
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
            soldOut: data.soldOut
        },
        create: {
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
            soldOut: data.soldOut
        }
    })
    return (await prisma.itemType.findUnique({
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
    }))!
}

export async function deleteCategory(id: number): Promise<Category> {
    await requireUserPermission('admin.manage')
    return prisma.category.delete({ where: { id } })
}

export async function deleteItemType(id: number): Promise<HydratedItemType> {
    await requireUserPermission('admin.manage')
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
    await requireUserPermission('admin.manage')
    return prisma.optionType.delete({ where: { id } })
}

export async function deleteOptionItem(id: number): Promise<OptionItem> {
    await requireUserPermission('admin.manage')
    return prisma.optionItem.delete({ where: { id } })
}

export async function deleteTag(id: number): Promise<Tag> {
    await requireUserPermission('admin.manage')
    return prisma.tag.delete({ where: { id } })
}

export async function deleteCouponCode(id: string): Promise<CouponCode> {
    await requireUserPermission('admin.manage')
    return prisma.couponCode.delete({ where: { id } })
}

export async function deleteAd(id: number): Promise<Ad> {
    await requireUserPermission('admin.manage')
    return prisma.ad.delete({ where: { id } })
}
