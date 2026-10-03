/**
 * A hand-drawn wavy line, used under headings and as a divider.
 */
export default function Squiggle({ className = '' }: { className?: string }) {
    return <svg viewBox="0 0 120 12" preserveAspectRatio="none" className={className} aria-hidden fill="none">
        <path d="M2 6 Q 9 0 16 6 T 30 6 T 44 6 T 58 6 T 72 6 T 86 6 T 100 6 T 114 6"
              stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
}
