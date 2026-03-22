export interface ItemAvailabilityLike {
    soldOut?: boolean | null
    inventoryTrackingEnabled?: boolean | null
    remainingItems?: number | null
    countsTowardLimit?: boolean | null
}

export interface RequestedCartItemLike {
    item: {
        id: number
    }
    amount: number
}

export function isInventoryTrackingEnabled(item: ItemAvailabilityLike): boolean {
    return item.inventoryTrackingEnabled === true
}

export function getAvailableInventory(item: ItemAvailabilityLike): number | null {
    if (!isInventoryTrackingEnabled(item)) {
        return null
    }
    return Math.max(item.remainingItems ?? 0, 0)
}

export function isItemSoldOut(item: ItemAvailabilityLike): boolean {
    const availableInventory = getAvailableInventory(item)
    if (availableInventory != null) {
        return availableInventory <= 0
    }
    return item.soldOut === true
}

export function countsTowardLimit(item: ItemAvailabilityLike): boolean {
    return item.countsTowardLimit !== false
}

export function getRequestedAmountForItem(items: RequestedCartItemLike[], itemId: number, excludeIndex = -1): number {
    return items.reduce((acc, current, index) => {
        if (index === excludeIndex || current.item.id !== itemId) {
            return acc
        }
        return acc + current.amount
    }, 0)
}
