import { z } from 'zod'
import { PaymentMethod } from '@/generated/prisma/enums'
import { PICK_UP_TIME_OPTIONS } from '@/app/lib/pick-up-times'

// Runtime validation for data that arrives from the client through server actions.
// TypeScript types are not enforced at runtime, so every server action must validate its arguments.

export const idSchema = z.number().int().positive().max(2147483647)

export const cartItemSchema = z.object({
    item: z.object({ id: idSchema }),
    amount: z.number().int().min(1).max(100),
    options: z.array(z.object({ id: idSchema }).nullable()).max(20)
        .transform(options => options.filter(option => option != null))
})

export const cartSchema = z.array(cartItemSchema).max(50)

export type CartInput = z.infer<typeof cartSchema>

export const paymentMethodSchema = z.enum(PaymentMethod)

export const pickUpTimeSchema = z.enum(PICK_UP_TIME_OPTIONS)

export const createOrderSchema = z.object({
    items: cartSchema.min(1),
    coupon: z.string().max(64).nullable(),
    onSiteOrderMode: z.boolean(),
    deliveryRoom: z.string().trim().min(3).max(64).nullable(),
    paymentMethod: paymentMethodSchema,
    pickUpTime: pickUpTimeSchema.nullable()
})

export const pageSchema = z.number().int().min(0).max(100000)
