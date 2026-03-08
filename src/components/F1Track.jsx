import { useMemo } from 'react'
import { PLAYER_COLORS } from '../lib/constants.js'

// Larger track — viewBox 0 0 600 400
const TRACK_OUTER = `
  M 80,50
  L 400,50
  Q 460,50 485,88
  L 520,145
  Q 545,185 520,215
  L 475,245
  Q 450,262 440,292
  L 440,335
  Q 440,355 418,355
  L 285,355
  Q 263,355 257,332
  L 251,308
  Q 244,285 224,279
  L 148,276
  Q 122,275 110,295
  L 96,325
  Q 86,344 62,344
  L 48,344
  Q 24,344 18,320
  L 12,220
  Q 9,190 30,168
  L 55,146
  Q 72,130 72,106
  L 72,72
  Q 70,56 80,50
  Z
`.trim()

const TRACK_INNER = `
  M 108,82
  L 392,82
  Q 438,82 458,110
  L 490,162
  Q 508,190 490,212
  L 452,236
  Q 426,252 418,278
  L 418,326
  Q 418,330 412,330
  L 294,330
  Q 288,330 285,322
  L 279,300
  Q 269,270 242,263
  L 146,260
  Q 112,260 100,280
  L 84,312
  Q 76,328 60,328
  L 50,328
  Q 42,328 40,318
  L 36,228
  Q 36,208 52,192
  L 76,170
  Q 98,150 98,122
  L 100,92
  Q 104,84 108,82
  Z
`.trim()

// Carefully placed waypoints ON the track centerline
const WAYPOINTS = [
  [248, 66],   // 0  start/finish
  [320, 66],   // 1
  [390, 66],   // 2
  [440, 76],   // 3  turn 1 entry
  [474, 100],  // 4
  [504, 136],  // 5
  [510, 168],  // 6
  [500, 196],  // 7
  [468, 218],  // 8
  [438, 238],  // 9
  [428, 264],  // 10
  [428, 304],  // 11 hairpin
  [414, 342],  // 12
  [370, 342],  // 13
  [290, 342],  // 14
  [264, 334],  // 15
  [258, 314],  // 16
  [248, 292],  // 17
  [228, 278],  // 18
  [160, 268],  // 19
  [114, 274],  // 20
  [96,  296],  // 21
  [82,  322],  // 22
  [62,  336],  // 23
  [36,  324],  // 24
  [28,  280],  // 25
  [26,  236],  // 26
  [30,  200],  // 27
  [42,  178],  // 28
  [62,  160],  // 29
  [76,  138],  // 30
  [82,  112],  // 31
  [82,  84],   // 32
  [100, 68],   // 33
  [148, 66],   // 34
  [198, 66],   // 35
  [248, 66],   // 36 back to start
]

function lerp(a, b, t) { return a + (b - a) * t }

function getPositionOnTrack(pct) {
  const totalPts = WAYPOINTS.length - 1
  const scaled = (pct / 100) * totalPts
  const i = Math.min(Math.floor(scaled), totalPts - 1)
  const t = scaled - i
  const [ax, ay] = WAYPOINTS[i]
  const [bx, by] = WAYPOINTS[Math.min(i + 1, totalPts)]
  return { x: lerp(ax, bx, t), y: lerp(ay, by, t) }
}

function getAngle(pct) {
  const ahead = Math.min(pct + 2, 99.9)
  const cur = getPositionOnTrack(pct)
  const nxt = getPositionOnTrack(ahead)
  return Math.atan2(nxt.y - cur.y, nxt.x - cur.x) * (180 / Math.PI)
}

// Slight offset per car slot so they don't overlap
const SLOT_OFFSETS = [
  { dx: 0,  dy: -4 },
  { dx: 0,  dy:  4 },
  { dx: -4, dy:  0 },
  { dx:  4, dy:  0 },
]

const SECTOR_LINES = [
  { x1: 248, y1: 50, x2: 248, y2: 82 },
  { x1: 428, y1: 326, x2: 418, y2: 326 },
]

const DRS_ZONE = { x: 108, y: 60, width: 140, height: 10 }

export default function F1Track({ players, currentPlayerIndex }) {
  const playerPositions = useMemo(() =>
    players.map(p => getPositionOnTrack(p.position || 0)),
    [players]
  )

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 600 400"
        style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 30px rgba(179,38,35,0.15))' }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1a0a08" />
            <stop offset="100%" stopColor="#0e0504" />
          </linearGradient>
          <filter id="carGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="boostGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Background */}
        <rect x="0" y="0" width="600" height="400" fill="#080405" />
        <path d={TRACK_OUTER} fill="url(#trackGrad)" />
        <path d={TRACK_INNER} fill="#080405" />

        {/* Outer kerb — cream/blood red checkered */}
        <path d={TRACK_OUTER} fill="none" stroke="#B32623" strokeWidth="5" strokeDasharray="10 10" opacity="0.7" />
        <path d={TRACK_OUTER} fill="none" stroke="#F2E8D9" strokeWidth="5" strokeDasharray="10 10" strokeDashoffset="10" opacity="0.35" />

        {/* Inner kerb */}
        <path d={TRACK_INNER} fill="none" stroke="#B32623" strokeWidth="4" strokeDasharray="8 8" opacity="0.55" />
        <path d={TRACK_INNER} fill="none" stroke="#F2E8D9" strokeWidth="4" strokeDasharray="8 8" strokeDashoffset="8" opacity="0.22" />

        {/* Racing line */}
        <polyline
          points={WAYPOINTS.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none" stroke="#BE9F7E" strokeWidth="0.8" strokeDasharray="4 8" opacity="0.08"
        />

        {/* Sector markers */}
        {SECTOR_LINES.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2} stroke="#BE9F7E" strokeWidth="2" opacity="0.5" />
        ))}

        {/* DRS zone */}
        <rect x={DRS_ZONE.x} y={DRS_ZONE.y} width={DRS_ZONE.width} height={DRS_ZONE.height} rx="2" fill="#BB7780" opacity="0.18" />
        <text x={DRS_ZONE.x + DRS_ZONE.width / 2} y={DRS_ZONE.y + 7.5} textAnchor="middle"
          fontSize="6" fontFamily="'Arena', monospace" fontWeight="700" fill="#BB7780" opacity="0.9">DRS</text>

        {/* Start/finish line — cream/black checkered */}
        {[0,1,2,3].map(row => [0,1].map(col => (
          <rect key={`cf-${row}-${col}`} x={232 + col*1.5} y={50 + row*8} width="1.5" height="8"
            fill={(row+col)%2===0 ? '#F2E8D9' : '#080405'} opacity="0.9" />
        )))}
        <text x="238" y="94" fontSize="6.5" fontFamily="'Arena', sans-serif" fontWeight="700" fill="#BE9F7E" opacity="0.5">S/F</text>

        {/* Turn numbers */}
        {[
          { n:'1', x:478, y:70 }, { n:'3', x:530, y:132 }, { n:'5', x:528, y:200 },
          { n:'8', x:448, y:368 }, { n:'11', x:270, y:368 }, { n:'14', x:56, y:350 },
          { n:'17', x:16, y:240 }, { n:'19', x:62, y:152 },
        ].map(t => (
          <text key={t.n} x={t.x} y={t.y} textAnchor="middle"
            fontSize="8" fontFamily="'Arena', sans-serif" fontWeight="700" fill="#BE9F7E" opacity="0.2">T{t.n}</text>
        ))}

        {/* Infield text */}
        <text x="270" y="195" textAnchor="middle" fontSize="14" fontFamily="'Arena', sans-serif"
          fontWeight="900" fill="#BB7780" opacity="0.35" letterSpacing="3">OVERTAKE</text>
        <text x="270" y="214" textAnchor="middle" fontSize="8" fontFamily="'Arena', sans-serif"
          fontWeight="400" fill="#F2E8D9" opacity="0.1" letterSpacing="2">CIRCUIT</text>

        {/* Cars — rendered back to front by position (lower position first) */}
        {[...players]
          .map((player, i) => ({ player, i }))
          .sort((a, b) => (a.player.position || 0) - (b.player.position || 0))
          .map(({ player, i }) => {
            const pos = playerPositions[i]
            const offset = SLOT_OFFSETS[i] || { dx: 0, dy: 0 }
            const x = pos.x + offset.dx
            const y = pos.y + offset.dy
            const isActive = i === currentPlayerIndex
            const isBoosting = player.boosting
            const color = PLAYER_COLORS[i] || '#BB7780'
            const angle = getAngle(player.position || 0)

            return (
              <g key={player.name}
                transform={`translate(${x}, ${y})`}
                style={{ transition: 'transform 0.9s cubic-bezier(0.25, 0.46, 0.45, 0.94)' }}
                filter={isBoosting ? 'url(#boostGlow)' : isActive ? 'url(#carGlow)' : undefined}
              >
                {/* Pulse ring for active car */}
                {isActive && (
                  <circle r="9" fill="none" stroke={color} strokeWidth="1.5" opacity="0">
                    <animate attributeName="r" values="6;16;6" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Boost trail */}
                {isBoosting && (() => {
                  const trailPct = Math.max(0, (player.position || 0) - 6)
                  const trailPos = getPositionOnTrack(trailPct)
                  return (
                    <line
                      x1={trailPos.x - x} y1={trailPos.y - y}
                      x2="0" y2="0"
                      stroke={color} strokeWidth="4" opacity="0.5" strokeLinecap="round"
                    />
                  )
                })()}

                {/* Car — rotated to face direction */}
                <g transform={`rotate(${angle})`}>
                  {/* Shadow */}
                  <ellipse cx="1" cy="1" rx="7" ry="3.5" fill="#000" opacity="0.5" />
                  {/* Body */}
                  <rect x="-8" y="-3.5" width="16" height="7" rx="2.5" fill={color} />
                  {/* Cockpit */}
                  <rect x="-2" y="-2.5" width="6" height="5" rx="1.5"
                    fill={isActive ? '#F2E8D9' : '#F2E8D9aa'} opacity="0.95" />
                  {/* Front wing */}
                  <rect x="7" y="-4.5" width="3" height="9" rx="1" fill={color} opacity="0.85" />
                  {/* Rear wing */}
                  <rect x="-11" y="-4.5" width="2.5" height="9" rx="1" fill={color} opacity="0.85" />
                  {/* Wheels */}
                  <rect x="-6" y="-5" width="3" height="2.5" rx="1" fill="#0e0504" />
                  <rect x="-6" y="2.5" width="3" height="2.5" rx="1" fill="#0e0504" />
                  <rect x="2" y="-5" width="3" height="2.5" rx="1" fill="#0e0504" />
                  <rect x="2" y="2.5" width="3" height="2.5" rx="1" fill="#0e0504" />
                </g>

                {/* Name badge */}
                <circle cx="0" cy="-11" r="6" fill="#080405" stroke={color} strokeWidth="1.5" />
                <text x="0" y="-8.8" textAnchor="middle"
                  fontSize="5.5" fontFamily="'Arena', sans-serif" fontWeight="900" fill={color}>
                  {i + 1}
                </text>
              </g>
            )
          })}
      </svg>
    </div>
  )
}