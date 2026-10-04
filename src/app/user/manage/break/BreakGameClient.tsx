'use client'

import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { HiHeart, HiPause, HiPlay } from 'react-icons/hi'
import { useTranslationClient } from '@/app/i18n/client'
import Beluga from '@/app/core-components/Beluga'

// Logical size of the play field; the canvas is scaled to fit its container
const W = 360
const H = 540
const WATER = H - 70
const BELUGA_Y = H - 62
const BELUGA_SCALE = 0.46
const CATCH_HALF_WIDTH = 46
const BEST_KEY = 'whale-break-best'

type Phase = 'ready' | 'playing' | 'paused' | 'over'
type Kind = 'bean' | 'cup' | 'clock'

interface Falling {
    kind: Kind
    x: number
    y: number
    vy: number
    rot: number
    vr: number
}

interface Popup {
    text: string
    x: number
    y: number
    age: number
    color: string
}

interface GameState {
    x: number
    targetX: number
    facing: 1 | -1
    keys: { left: boolean, right: boolean }
    items: Falling[]
    popups: Popup[]
    spawnIn: number
    score: number
    lives: number
    hurt: number
    time: number
}

function newGame(): GameState {
    return {
        x: W / 2,
        targetX: W / 2,
        facing: 1,
        keys: { left: false, right: false },
        items: [],
        popups: [],
        spawnIn: 0.6,
        score: 0,
        lives: 3,
        hurt: 0,
        time: 0
    }
}

// The mascot's outline, from core-components/Beluga.tsx
const BELUGA_PATHS = {
    tail: 'M48 94 C36 92 26 84 14 72 C18 84 18 92 24 98 C16 104 12 112 8 122 C24 114 38 106 52 104 Z',
    body: 'M40 92 C34 60 70 34 112 32 C140 30 160 34 172 46 C186 44 200 56 200 74 C201 98 176 114 132 116 C96 118 58 112 40 92 Z',
    belly: 'M74 103 C100 110 138 110 164 100',
    flipper: 'M110 108 C104 126 116 134 128 120 C126 114 122 110 118 108 Z',
    smile: 'M178 90 Q186 98 194 88',
    ouch: 'M182 94 Q186 90 190 94'
}

interface Palette {
    ink: string
    paper: string
    cream: string
    butter: string
    latte: string
    tomato: string
    whale: string
    blush: string
}

function readPalette(): Palette {
    const style = getComputedStyle(document.documentElement)
    const color = (name: string) => `rgb(${style.getPropertyValue(`--${name}`).trim()})`
    return {
        ink: color('ink'),
        paper: color('paper'),
        cream: color('cream'),
        butter: color('butter'),
        latte: color('latte'),
        tomato: color('tomato'),
        whale: color('whale'),
        blush: color('blush')
    }
}

function level(score: number): number {
    return 1 + Math.floor(score / 15)
}

function spawn(state: GameState) {
    const lv = level(state.score)
    const roll = Math.random()
    const clockChance = Math.min(0.32, 0.16 + lv * 0.02)
    const kind: Kind = roll < clockChance ? 'clock' : roll < clockChance + 0.08 ? 'cup' : 'bean'
    state.items.push({
        kind,
        x: 24 + Math.random() * (W - 48),
        y: -24,
        vy: 115 + lv * 16 + Math.random() * 40,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 3
    })
    state.spawnIn = Math.max(0.36, 0.95 - lv * 0.06) * (0.7 + Math.random() * 0.6)
}

function drawBean(ctx: CanvasRenderingContext2D, p: Palette) {
    ctx.beginPath()
    ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2)
    ctx.fillStyle = '#7a4a2a'
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = p.ink
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, -10)
    ctx.bezierCurveTo(-5, -3, 5, 3, 0, 10)
    ctx.strokeStyle = '#c99a6b'
    ctx.lineWidth = 2
    ctx.stroke()
}

function drawCup(ctx: CanvasRenderingContext2D, p: Palette) {
    ctx.lineWidth = 2.5
    ctx.strokeStyle = p.ink
    ctx.lineJoin = 'round'
    // body
    ctx.beginPath()
    ctx.moveTo(-13, -12)
    ctx.lineTo(13, -12)
    ctx.lineTo(10, 15)
    ctx.lineTo(-10, 15)
    ctx.closePath()
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.stroke()
    // sleeve
    ctx.beginPath()
    ctx.moveTo(-12, -3)
    ctx.lineTo(12, -3)
    ctx.lineTo(11, 7)
    ctx.lineTo(-11, 7)
    ctx.closePath()
    ctx.fillStyle = p.butter
    ctx.fill()
    ctx.stroke()
    // lid
    ctx.beginPath()
    ctx.roundRect(-16, -18, 32, 7, 3)
    ctx.fillStyle = p.latte
    ctx.fill()
    ctx.stroke()
}

function drawClock(ctx: CanvasRenderingContext2D, p: Palette, time: number) {
    ctx.lineWidth = 2.5
    ctx.strokeStyle = p.ink
    // bells
    for (const side of [ -1, 1 ]) {
        ctx.beginPath()
        ctx.arc(side * 10, -13, 6, 0, Math.PI * 2)
        ctx.fillStyle = p.butter
        ctx.fill()
        ctx.stroke()
    }
    ctx.beginPath()
    ctx.arc(0, 2, 15, 0, Math.PI * 2)
    ctx.fillStyle = p.tomato
    ctx.fill()
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(0, 2, 10, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(0, 2)
    ctx.lineTo(0, -5)
    ctx.moveTo(0, 2)
    ctx.lineTo(5 * Math.cos(time * 6), 2 + 5 * Math.sin(time * 6))
    ctx.lineWidth = 2
    ctx.stroke()
}

function drawBeluga(ctx: CanvasRenderingContext2D, p: Palette, state: GameState, paths: { [k: string]: Path2D }) {
    ctx.save()
    const bob = Math.sin(state.time * 4) * 2
    ctx.translate(state.x, BELUGA_Y + bob)
    ctx.scale(BELUGA_SCALE * state.facing, BELUGA_SCALE)
    ctx.translate(-118, -78)
    ctx.lineWidth = 4 / 1
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.strokeStyle = p.ink
    ctx.fillStyle = state.hurt > 0 ? p.blush : '#fff'
    for (const key of [ 'tail', 'body' ]) {
        ctx.fill(paths[key])
        ctx.stroke(paths[key])
    }
    ctx.lineWidth = 6
    ctx.strokeStyle = p.whale
    ctx.stroke(paths.belly)
    ctx.lineWidth = 4
    ctx.strokeStyle = p.ink
    ctx.fill(paths.flipper)
    ctx.stroke(paths.flipper)
    // cheek and eye
    ctx.beginPath()
    ctx.ellipse(170, 86, 9, 5, 0, 0, Math.PI * 2)
    ctx.fillStyle = p.blush
    ctx.fill()
    if (state.hurt > 0) {
        ctx.beginPath()
        ctx.moveTo(152, 66)
        ctx.lineTo(164, 74)
        ctx.moveTo(164, 66)
        ctx.lineTo(152, 74)
        ctx.stroke()
    } else {
        ctx.beginPath()
        ctx.arc(158, 70, 5.5, 0, Math.PI * 2)
        ctx.fillStyle = p.ink
        ctx.fill()
    }
    ctx.lineWidth = 3.5
    ctx.stroke(state.hurt > 0 ? paths.ouch : paths.smile)
    ctx.restore()
}

function drawScene(ctx: CanvasRenderingContext2D, p: Palette, state: GameState, paths: { [k: string]: Path2D }) {
    // sky with the dotted background used across the app
    ctx.fillStyle = p.cream
    ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = p.ink
    ctx.globalAlpha = 0.07
    for (let y = 11; y < WATER; y += 22) {
        for (let x = 11; x < W; x += 22) {
            ctx.beginPath()
            ctx.arc(x, y, 1.5, 0, Math.PI * 2)
            ctx.fill()
        }
    }
    ctx.globalAlpha = 1

    // falling things
    for (const item of state.items) {
        ctx.save()
        ctx.translate(item.x, item.y)
        ctx.rotate(item.kind === 'clock' ? Math.sin(state.time * 12) * 0.25 : item.rot)
        if (item.kind === 'bean') {
            drawBean(ctx, p)
        } else if (item.kind === 'cup') {
            drawCup(ctx, p)
        } else {
            drawClock(ctx, p, state.time)
        }
        ctx.restore()
    }

    // water, drawn as a wavy sticker strip
    ctx.beginPath()
    ctx.moveTo(0, H)
    ctx.lineTo(0, WATER)
    for (let x = 0; x <= W; x += 6) {
        ctx.lineTo(x, WATER + Math.sin(x / 22 + state.time * 2.4) * 4)
    }
    ctx.lineTo(W, H)
    ctx.closePath()
    ctx.fillStyle = p.whale
    ctx.fill()
    ctx.lineWidth = 2.5
    ctx.strokeStyle = p.ink
    ctx.stroke()

    drawBeluga(ctx, p, state, paths)

    // score popups
    ctx.textAlign = 'center'
    ctx.font = '20px "ZCOOL KuaiLe", sans-serif'
    for (const popup of state.popups) {
        ctx.globalAlpha = Math.max(0, 1 - popup.age / 0.8)
        ctx.lineWidth = 4
        ctx.strokeStyle = p.paper
        ctx.strokeText(popup.text, popup.x, popup.y - popup.age * 40)
        ctx.fillStyle = popup.color
        ctx.fillText(popup.text, popup.x, popup.y - popup.age * 40)
    }
    ctx.globalAlpha = 1

    if (state.hurt > 0) {
        ctx.fillStyle = p.tomato
        ctx.globalAlpha = state.hurt * 0.35
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
    }
}

export default function BreakGameClient() {
    const { t } = useTranslationClient('user')
    const router = useRouter()
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const game = useRef<GameState>(newGame())
    const paths = useRef<{ [k: string]: Path2D } | null>(null)
    const palette = useRef<Palette | null>(null)
    const [ phase, setPhase ] = useState<Phase>('ready')
    const [ score, setScore ] = useState(0)
    const [ lives, setLives ] = useState(3)
    const [ best, setBest ] = useState(0)
    const [ newBest, setNewBest ] = useState(false)
    const [ bossLine, setBossLine ] = useState('')

    useEffect(() => {
        try {
            setBest(parseInt(localStorage.getItem(BEST_KEY) ?? '0', 10) || 0)
        } catch {
            // Storage can be unavailable (private mode); the best score just isn't kept
        }
    }, [])

    const draw = useCallback(() => {
        const canvas = canvasRef.current
        const ctx = canvas?.getContext('2d')
        if (canvas == null || ctx == null) {
            return
        }
        paths.current ??= Object.fromEntries(Object.entries(BELUGA_PATHS).map(([ k, d ]) => [ k, new Path2D(d) ]))
        palette.current ??= readPalette()
        const dpr = window.devicePixelRatio || 1
        const cssWidth = canvas.clientWidth
        if (canvas.width !== Math.round(cssWidth * dpr)) {
            canvas.width = Math.round(cssWidth * dpr)
            canvas.height = Math.round(cssWidth * dpr * H / W)
        }
        ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0)
        drawScene(ctx, palette.current, game.current, paths.current)
    }, [])

    // Redraw when idle so the scene shows behind the menus, and after theme or size changes
    useEffect(() => {
        draw()
        const media = matchMedia('(prefers-color-scheme: dark)')
        const onTheme = () => {
            palette.current = null
            draw()
        }
        media.addEventListener('change', onTheme)
        window.addEventListener('resize', draw)
        return () => {
            media.removeEventListener('change', onTheme)
            window.removeEventListener('resize', draw)
        }
    }, [ draw ])

    const start = useCallback(() => {
        game.current = newGame()
        setScore(0)
        setLives(3)
        setNewBest(false)
        setPhase('playing')
    }, [])

    const finish = useCallback((finalScore: number) => {
        setPhase('over')
        setBest(previous => {
            if (finalScore > previous) {
                setNewBest(true)
                try {
                    localStorage.setItem(BEST_KEY, String(finalScore))
                } catch {
                    // ignore
                }
                return finalScore
            }
            return previous
        })
    }, [])

    // Main loop
    useEffect(() => {
        if (phase !== 'playing') {
            return
        }
        let frame = 0
        let last = performance.now()
        const tick = (now: number) => {
            const dt = Math.min(0.05, (now - last) / 1000)
            last = now
            const s = game.current
            s.time += dt
            s.hurt = Math.max(0, s.hurt - dt * 2.5)

            // movement: keys push the target, pointer sets it directly
            const keyDir = (s.keys.right ? 1 : 0) - (s.keys.left ? 1 : 0)
            if (keyDir !== 0) {
                s.targetX += keyDir * 330 * dt
            }
            s.targetX = Math.max(36, Math.min(W - 36, s.targetX))
            const dx = s.targetX - s.x
            if (Math.abs(dx) > 1) {
                s.facing = dx > 0 ? 1 : -1
            }
            s.x += dx * Math.min(1, dt * 12)

            s.spawnIn -= dt
            if (s.spawnIn <= 0) {
                spawn(s)
            }

            let scoreChanged = false
            let livesChanged = false
            for (const item of s.items) {
                item.y += item.vy * dt
                item.rot += item.vr * dt
                const caught = item.y > BELUGA_Y - 34 && item.y < BELUGA_Y + 10 && Math.abs(item.x - s.x) < CATCH_HALF_WIDTH
                if (caught) {
                    item.y = H + 100
                    if (item.kind === 'clock') {
                        s.lives -= 1
                        s.hurt = 1
                        livesChanged = true
                        s.popups.push({ text: t('break.ouch'), x: s.x, y: BELUGA_Y - 50, age: 0, color: palette.current?.tomato ?? 'red' })
                    } else {
                        const gain = item.kind === 'cup' ? 5 : 1
                        s.score += gain
                        scoreChanged = true
                        s.popups.push({ text: `+${gain}`, x: item.x, y: BELUGA_Y - 40, age: 0, color: palette.current?.ink ?? 'black' })
                    }
                }
            }
            s.items = s.items.filter(item => item.y < H + 40)
            for (const popup of s.popups) {
                popup.age += dt
            }
            s.popups = s.popups.filter(popup => popup.age < 0.8)

            draw()
            if (scoreChanged) {
                setScore(s.score)
            }
            if (livesChanged) {
                setLives(s.lives)
                if (s.lives <= 0) {
                    finish(s.score)
                    return
                }
            }
            frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [ phase, draw, finish, t ])

    const bossKey = useCallback(() => {
        setPhase(p => p === 'playing' ? 'paused' : p)
        router.push('/today')
    }, [ router ])

    // Keyboard: arrows or A/D move, Space/Enter start or resume, P/Esc pause, B is the boss key
    useEffect(() => {
        const onKey = (e: KeyboardEvent, down: boolean) => {
            const s = game.current
            const key = e.key.toLowerCase()
            if (key === 'arrowleft' || key === 'a') {
                s.keys.left = down
            } else if (key === 'arrowright' || key === 'd') {
                s.keys.right = down
            } else if (!down) {
                return
            } else if (key === ' ' || key === 'enter') {
                if (phase === 'ready' || phase === 'over') {
                    start()
                } else if (phase === 'paused') {
                    setPhase('playing')
                } else {
                    return
                }
            } else if ((key === 'p' || key === 'escape') && phase === 'playing') {
                setPhase('paused')
            } else if (key === 'b') {
                bossKey()
            } else {
                return
            }
            if (phase === 'playing' || key === ' ') {
                e.preventDefault()
            }
        }
        const onDown = (e: KeyboardEvent) => onKey(e, true)
        const onUp = (e: KeyboardEvent) => onKey(e, false)
        window.addEventListener('keydown', onDown)
        window.addEventListener('keyup', onUp)
        return () => {
            window.removeEventListener('keydown', onDown)
            window.removeEventListener('keyup', onUp)
        }
    }, [ phase, start, bossKey ])

    // Pause when the tab is hidden
    useEffect(() => {
        const onVisibility = () => {
            if (document.hidden) {
                setPhase(p => p === 'playing' ? 'paused' : p)
            }
        }
        document.addEventListener('visibilitychange', onVisibility)
        return () => document.removeEventListener('visibilitychange', onVisibility)
    }, [])

    useEffect(() => {
        if (phase === 'over') {
            const lines = t('break.bossLines', { returnObjects: true }) as unknown as string[]
            setBossLine(Array.isArray(lines) ? lines[Math.floor(Math.random() * lines.length)] : '')
        }
    }, [ phase, t ])

    function pointerTo(e: ReactPointerEvent<HTMLCanvasElement>) {
        const rect = e.currentTarget.getBoundingClientRect()
        game.current.targetX = (e.clientX - rect.left) / rect.width * W
    }

    return <div className="container">
        <header className="mb-6">
            <h1>{t('break.title')}</h1>
            <p className="secondary mt-2">{t('break.subtitle')}</p>
        </header>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
            <div className="relative w-full max-w-[420px] mx-auto lg:mx-0 shrink-0">
                {/* HUD */}
                <div className="absolute top-3 left-3 right-3 z-10 flex items-center gap-2 pointer-events-none">
                    <span className="h-9 px-3 rounded-full border-toon border-ink bg-butter text-[#4a2511] font-toon text-lg flex items-center"
                          aria-live="polite">{t('break.score', { score })}</span>
                    <span className="h-9 px-2 rounded-full border-toon border-ink bg-paper flex items-center gap-0.5"
                          aria-label={t('break.lives', { count: lives })}>
                        {[ 0, 1, 2 ].map(i => <HiHeart key={i} className={`h-5 w-5 ${i < lives ? 'text-tomato' : 'text-ink/20'}`}/>)}
                    </span>
                    <span className="ml-auto h-9 px-3 rounded-full border-2 border-ink/30 bg-paper/80 text-sm flex items-center">
                        {t('break.best', { score: best })}
                    </span>
                </div>

                <canvas ref={canvasRef} aria-label={t('break.canvas')} role="img"
                        className="block w-full aspect-[2/3] rounded-[1.6rem] border-toon border-ink shadow-toon touch-none select-none bg-cream"
                        onPointerDown={e => {
                            pointerTo(e)
                            e.currentTarget.setPointerCapture(e.pointerId)
                        }}
                        onPointerMove={e => {
                            if (e.pointerType === 'mouse' || e.buttons > 0) {
                                pointerTo(e)
                            }
                        }}/>

                {phase !== 'playing' &&
                    <div className="absolute inset-0 z-20 flex items-center justify-center p-5 rounded-[1.6rem] bg-ink/25">
                        <div className="toon p-5 w-full text-center pop-in">
                            {phase === 'ready' && <>
                                <Beluga withCup className="w-32 mx-auto mb-2"/>
                                <p className="font-toon text-2xl mb-2">{t('break.readyTitle')}</p>
                                <p className="text-sm secondary mb-4">{t('break.rules')}</p>
                                <button className="toon-btn w-full" onClick={start}><HiPlay/>{t('break.start')}</button>
                            </>}
                            {phase === 'paused' && <>
                                <Beluga mood="sleepy" className="w-28 mx-auto mb-2"/>
                                <p className="font-toon text-2xl mb-4">{t('break.paused')}</p>
                                <button className="toon-btn w-full" onClick={() => setPhase('playing')}><HiPlay/>{t('break.resume')}</button>
                            </>}
                            {phase === 'over' && <>
                                <Beluga mood={newBest ? 'cheer' : 'sleepy'} className="w-28 mx-auto mb-2"/>
                                <p className="font-toon text-2xl">{t('break.over')}</p>
                                <p className="font-toon text-5xl my-2">{score}</p>
                                {newBest
                                    ? <p className="inline-block mb-3 px-3 py-1 rounded-full border-2 border-ink bg-butter text-sm font-bold rotate-[-3deg]">{t('break.newBest')}</p>
                                    : <p className="text-sm secondary mb-3">{bossLine}</p>}
                                <button className="toon-btn w-full" onClick={start}><HiPlay/>{t('break.again')}</button>
                            </>}
                        </div>
                    </div>}
            </div>

            <aside className="flex flex-col gap-4 w-full lg:max-w-xs">
                <div className="toon p-5">
                    <p className="font-toon text-xl mb-3">{t('break.howTo')}</p>
                    <ul className="flex flex-col gap-2 text-sm">
                        <li className="flex items-center gap-3"><span className="h-7 w-7 rounded-full border-2 border-ink bg-[#7a4a2a] shrink-0"/>{t('break.bean')}</li>
                        <li className="flex items-center gap-3"><span className="h-7 w-7 rounded-full border-2 border-ink bg-butter shrink-0"/>{t('break.cup')}</li>
                        <li className="flex items-center gap-3"><span className="h-7 w-7 rounded-full border-2 border-ink bg-tomato shrink-0"/>{t('break.clock')}</li>
                    </ul>
                    <p className="text-xs secondary mt-4">{t('break.controls')}</p>
                </div>
                <div className="flex gap-3">
                    {phase === 'playing' &&
                        <button className="toon-btn-ghost h-11 text-base flex-grow" onClick={() => setPhase('paused')}>
                            <HiPause/>{t('break.pause')}
                        </button>}
                    <button className="toon-btn h-11 text-base flex-grow bg-tomato text-white" onClick={bossKey}>
                        {t('break.boss')}
                    </button>
                </div>
            </aside>
        </div>
    </div>
}
