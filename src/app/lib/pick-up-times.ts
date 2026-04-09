export const PICK_UP_TIME_OPTIONS = [ 'morning', 'midday', 'evening' ] as const

export type PickUpTimeOption = (typeof PICK_UP_TIME_OPTIONS)[number]

export const DEFAULT_PICK_UP_TIME: PickUpTimeOption = 'midday'

export function isValidPickUpTime(value: string | null | undefined): value is PickUpTimeOption {
    return value != null && PICK_UP_TIME_OPTIONS.includes(value as PickUpTimeOption)
}
