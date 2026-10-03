import { HiExclamationCircle } from 'react-icons/hi'

export default function CartWarnings({ title, warnings }: { title: string, warnings: string[] }) {
    if (warnings.length < 1) {
        return <></>
    }
    return <div role="status"
                className="flex gap-3 rounded-2xl bg-amber-50 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100
                border border-amber-200/70 dark:border-amber-700/40 p-3 text-sm">
        <HiExclamationCircle className="text-lg flex-shrink-0 mt-0.5 text-amber-500"/>
        <div>
            <p className="font-semibold">{title}</p>
            {warnings.map((warning, index) => <p key={`${warning}-${index}`}>{warning}</p>)}
        </div>
    </div>
}
