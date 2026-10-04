import { ReactNode } from 'react'
import { IconType } from 'react-icons'

/** A sticker section with an optional icon title row, used across the dashboard and admin pages. */
export default function Panel({ title, icon: Icon, action, className = '', children }: {
    title?: string,
    icon?: IconType,
    action?: ReactNode,
    className?: string,
    children: ReactNode
}) {
    return <section className={`toon p-5 ${className}`} aria-label={title}>
        {title != null && <div className="flex items-center gap-3 mb-4 pb-3 border-b-2 border-dashed border-ink/20">
            {Icon != null && <span className="h-9 w-9 shrink-0 rounded-full bg-whale/60 border-2 border-ink flex items-center justify-center">
                <Icon className="h-4 w-4"/>
            </span>}
            <h2 className="text-xl flex-grow">{title}</h2>
            {action}
        </div>}
        {children}
    </section>
}
