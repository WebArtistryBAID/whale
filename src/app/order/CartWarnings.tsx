import { HiExclamation } from 'react-icons/hi'

export default function CartWarnings({ title, warnings }: { title: string, warnings: string[] }) {
    if (warnings.length < 1) {
        return <></>
    }
    return <div role="status" className="flex gap-2 rounded-2xl border-2 border-dashed border-tomato bg-tomato/10 p-3 text-sm">
        <HiExclamation className="text-lg text-tomato flex-shrink-0 mt-0.5"/>
        <div>
            <p className="font-toon">{title}</p>
            {warnings.map((warning, index) => <p key={`${warning}-${index}`}>{warning}</p>)}
        </div>
    </div>
}
