/**
 * The café's mascot, a small beluga. Drawn as a flat sticker with ink outlines.
 * `mood` changes the face: happy (default), sleepy (store closed / empty states) or cheer (order ready).
 */
export default function Beluga({ mood = 'happy', withCup = false, className = '' }: {
    mood?: 'happy' | 'sleepy' | 'cheer',
    withCup?: boolean,
    className?: string
}) {
    const ink = 'rgb(var(--ink))'
    return <svg viewBox="0 0 220 150" className={className} aria-hidden fill="none" strokeLinecap="round"
                strokeLinejoin="round">
        {/* tail fluke */}
        <path d="M48 94 C36 92 26 84 14 72 C18 84 18 92 24 98 C16 104 12 112 8 122 C24 114 38 106 52 104 Z"
              fill="#fff" stroke={ink} strokeWidth="4"/>
        {/* body with the round melon forehead of a beluga */}
        <path d="M40 92 C34 60 70 34 112 32 C140 30 160 34 172 46 C186 44 200 56 200 74 C201 98 176 114 132 116
                 C96 118 58 112 40 92 Z"
              fill="#fff" stroke={ink} strokeWidth="4"/>
        {/* belly shade */}
        <path d="M74 103 C100 110 138 110 164 100" stroke="rgb(var(--whale))" strokeWidth="6" opacity="0.8"/>
        {/* flipper */}
        <path d="M110 108 C104 126 116 134 128 120 C126 114 122 110 118 108 Z" fill="#fff" stroke={ink}
              strokeWidth="4"/>
        {/* cheek */}
        <ellipse cx="170" cy="86" rx="9" ry="5" fill="rgb(var(--blush))"/>
        {/* eye */}
        {mood === 'sleepy'
            ? <path d="M152 70 Q158 75 164 70" stroke={ink} strokeWidth="4"/>
            : mood === 'cheer'
                ? <path d="M152 72 Q158 64 164 72" stroke={ink} strokeWidth="4"/>
                : <>
                    <circle cx="158" cy="70" r="5.5" fill={ink}/>
                    <circle cx="160" cy="68" r="1.8" fill="#fff"/>
                </>}
        {/* mouth */}
        {mood === 'sleepy'
            ? <path d="M182 92 Q186 94 190 92" stroke={ink} strokeWidth="3.5"/>
            : <path d="M178 90 Q186 98 194 88" stroke={ink} strokeWidth="3.5"/>}
        {/* sleepy z / cheer sparkles */}
        {mood === 'sleepy' ? <path d="M176 30 h12 l-12 12 h12" stroke={ink} strokeWidth="3"/> : null}
        {mood === 'cheer'
            ? <g stroke={ink} strokeWidth="3.5">
                <path d="M196 30 v12 M190 36 h12"/>
                <path d="M120 14 v10 M115 19 h10"/>
            </g>
            : null}
        {/* a little cup balanced on the head */}
        {withCup
            ? <g transform="rotate(-8 132 26)">
                <path d="M118 12 h28 l-4 22 a4 4 0 0 1 -4 3 h-12 a4 4 0 0 1 -4 -3 Z" fill="rgb(var(--latte))"
                      stroke={ink} strokeWidth="4"/>
                <path d="M146 17 a6 6 0 0 1 0 12" stroke={ink} strokeWidth="4"/>
                <path d="M126 4 q-3 -5 0 -9 M136 4 q-3 -5 0 -9" stroke={ink} strokeWidth="3"/>
            </g>
            : null}
    </svg>
}
