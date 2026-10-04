import { ReactNode } from 'react'
import { IconType } from 'react-icons'

const tones = {
    butter: 'bg-butter/45',
    whale: 'bg-whale/45',
    mint: 'bg-mint/45',
    blush: 'bg-blush/45',
    paper: 'bg-paper'
}

/** A big number on a coloured sticker, e.g. balance, points or today's queue. */
export default function StatTile({ label, value, hint, icon: Icon, tone = 'paper', action, className = '' }: {
    label: string,
    value: ReactNode,
    hint?: ReactNode,
    icon?: IconType,
    tone?: keyof typeof tones,
    action?: ReactNode,
    className?: string
}) {
    return <div className={`toon p-4 flex flex-col gap-1 ${tones[tone]} ${className}`} aria-label={label}>
        <p className="flex items-center gap-2 text-sm">
            {Icon != null && <Icon className="h-4 w-4"/>}
            {label}
        </p>
        <p className="font-toon text-4xl leading-tight break-all">{value}</p>
        {hint != null && <p className="text-xs secondary">{hint}</p>}
        {action != null && <div className="mt-2">{action}</div>}
    </div>
}
