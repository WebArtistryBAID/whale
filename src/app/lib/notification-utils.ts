import { Notification, NotificationType } from '@prisma/client'

export function getNotificationMessageParams(notification: Notification): { [key: string]: string } {
    const messageParams: { [key: string]: string } = Object()
    if (notification.orderId != null) {
        messageParams.order = notification.orderId.toString()
    }
    if (([
        NotificationType.orderRefunded,
        NotificationType.balanceToppedUp,
        NotificationType.pointsEarned
    ] as NotificationType[]).includes(notification.type)) {
        messageParams.v0 = notification.values[0]
    }
    return messageParams
}
