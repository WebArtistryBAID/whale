import 'server-only'
import Stripe from 'stripe'

let client: Stripe | null = null

/**
 * Returns the Stripe client, creating it on first use. Creating it lazily keeps the app (and `next build`)
 * working when Stripe is not configured; only actual Stripe operations fail.
 */
export function getStripe(): Stripe {
    if (client == null) {
        const key = process.env.STRIPE_KEY
        if (key == null || key === '') {
            throw new Error('STRIPE_KEY is not configured')
        }
        client = new Stripe(key)
    }
    return client
}
