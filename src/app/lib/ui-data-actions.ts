'use server'

import { Ad, OptionItem, Tag } from '@/generated/prisma/client'
import { prisma } from '@/app/lib/prisma'

export interface HydratedCategory {
    id: number
    name: string
    items: HydratedItemType[]
}

export interface HydratedOptionType {
    id: number
    name: string
    items: OptionItem[]
}

export interface HydratedItemType {
    id: number
    categoryId: number
    createdAt: Date
    name: string
    image: string | null
    tags: Tag[]
    description: string
    shortDescription: string
    options: HydratedOptionType[]
    basePrice: string
    salePercent: string
    soldOut: boolean
}

export async function getCoreItems(): Promise<HydratedCategory[]> {
    return prisma.category.findMany({
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

export async function getAds(): Promise<Ad[]> {
    return prisma.ad.findMany()
}
