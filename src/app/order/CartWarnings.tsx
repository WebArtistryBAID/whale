export default function CartWarnings({ title, warnings }: { title: string, warnings: string[] }) {
    if (warnings.length < 1) {
        return <></>
    }
    return <div role="status" className="border-l-2 border-caramel pl-3 text-sm">
        <p className="font-semibold text-caramel dark:text-caramel-100">{title}</p>
        {warnings.map((warning, index) => <p key={`${warning}-${index}`} className="secondary">{warning}</p>)}
    </div>
}
