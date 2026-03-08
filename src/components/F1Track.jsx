import { useMemo } from 'react'
import { PLAYER_COLORS } from '../lib/constants.js'

// ─── Track Definition ───────────────────────────────────────────────
// Inspired by a hybrid of Spa-Francorchamps / Silverstone layout
// SVG viewBox: 0 0 500 320
// Points go clockwise. The path is a closed loop.

const TRACK_OUTER = `
  M 60,40
  L 340,40
  Q 390,40 410,70
  L 440,120
  Q 460,150 440,175
  L 400,200
  Q 380,215 370,240
  L 370,270
  Q 370,290 350,290
  L 240,290
  Q 220,290 215,270
  L 210,250
  Q 205,232 190,228
  L 130,225
  Q 110,224 100,240
  L 90,265
  Q 82,282 62,282
  L 50,282
  Q 30,282 25,262
  L 20,180
  Q 18,155 35,138
  L 55,120
  Q 68,108 68,90
  L 60,60
  Q 58,48 60,40
  Z
`.trim()

const TRACK_INNER = `
  M 85,68
  L 330,68
  Q 362,68 378,92
  L 408,138
  Q 422,160 408,178
  L 375,198
  Q 354,212 348,234
  L 348,262
  Q 348,266 344,266
  L 248,266
  Q 244,266 242,260
  L 238,242
  Q 230,218 208,212
  L 128,210
  Q 100,210 90,228
  L 78,252
  Q 72,264 60,264
  L 52,264
  Q 46,264 44,256
  L 42,188
  Q 42,172 55,160
  L 75,142
  Q 92,126 92,104
  L 88,76
  Q 86,70 85,68
  Z
`.trim()

// Waypoints along the track centerline (0-100%) for car positioning
// Each point is [x, y] in SVG coords
const WAYPOINTS = [
  [210, 54],  // 0  — start/finish straight (top)
  [280, 54],  // 1
  [340, 54],  // 2
  [390, 60],  // 3  — turn 1 entry
  [420, 85],  // 4
  [435, 110], // 5
  [435, 145], // 6
  [422, 165], // 7  — turn complex
  [390, 185], // 8
  [365, 205], // 9
  [358, 230], // 10
  [358, 260], // 11 — hairpin
  [340, 278], // 12
  [290, 278], // 13
  [248, 278], // 14
  [228, 268], // 15
  [224, 248], // 16 — chicane
  [210, 230], // 17
  [185, 220], // 18
  [130, 218], // 19
  [90,  228], // 20
  [76,  248], // 21
  [68,  270], // 22
  [56,  274], // 23 — back section
  [43,  264], // 24
  [40,  230], // 25
  [40,  195], // 26
  [45,  172], // 27
  [58,  155], // 28
  [72,  140], // 29
  [80,  120], // 30 — sweeping corner
  [80,  95],  // 31
  [76,  72],  // 32
  [80,  58],  // 33
  [120, 54],  // 34
  [165, 54],  // 35
  [210, 54],  // 36 — back to start
]

function lerp(a, b, t) { return a + (b - a) * t }

function getPositionOnTrack(pct) {
  const totalPts = WAYPOINTS.length - 1
  const scaled = (pct / 100) * totalPts
  const i = Math.min(Math.floor(scaled), totalPts - 1)
  const t = scaled - i
  const [ax, ay] = WAYPOINTS[i]
  const [bx, by] = WAYPOINTS[i + 1] || WAYPOINTS[0]
  return { x: lerp(ax, bx, t), y: lerp(ay, by, t) }
}

// Sector lines for visual interest
const SECTOR_LINES = [
  { x1: 210, y1: 40, x2: 210, y2: 68 },  // S1/S2
  { x1: 358, y1: 258, x2: 348, y2: 258 }, // S2/S3
]

// DRS zone indicator
const DRS_ZONE = { x: 90, y: 50, width: 120, height: 8, label: 'DRS' }

export default function F1Track({ players, currentPlayerIndex }) {
  const playerPositions = useMemo(() =>
    players.map(p => getPositionOnTrack(p.position || 0)),
    [players]
  )

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        viewBox="0 0 500 330"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '100%',
          filter: 'drop-shadow(0 0 30px rgba(249,115,22,0.08))',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Track surface gradient */}
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2a2a40" />
            <stop offset="100%" stopColor="#1e1e30" />
          </linearGradient>

          {/* Glow filter for active car */}
          <filter id="carGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Subtle noise texture */}
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
            <feBlend in="SourceGraphic" mode="overlay" result="blend" />
            <feComposite in="blend" in2="SourceGraphic" operator="in" />
          </filter>

          <clipPath id="trackClip">
            <path d={TRACK_OUTER} />
          </clipPath>
        </defs>

        {/* ── Tarmac layers ── */}

        {/* Outer run-off / grass */}
        <rect x="0" y="0" width="500" height="330" fill="#080816" />

        {/* Gravel traps */}
        <path d={TRACK_OUTER} fill="#0e0e1e" />

        {/* Main tarmac */}
        <path d={TRACK_OUTER} fill="url(#trackGrad)" />
        <path d={TRACK_INNER} fill="#080816" />

        {/* Tarmac texture overlay */}
        <path d={TRACK_OUTER} fill="none" clipPath="url(#trackClip)" />

        {/* Kerb — outer (red/white alternating via dashes) */}
        <path d={TRACK_OUTER}
          fill="none"
          stroke="#c0392b"
          strokeWidth="4"
          strokeDasharray="8 8"
          opacity="0.55"
        />
        <path d={TRACK_OUTER}
          fill="none"
          stroke="#ffffff"
          strokeWidth="4"
          strokeDasharray="8 8"
          strokeDashoffset="8"
          opacity="0.25"
        />

        {/* Kerb — inner */}
        <path d={TRACK_INNER}
          fill="none"
          stroke="#c0392b"
          strokeWidth="3"
          strokeDasharray="6 6"
          opacity="0.45"
        />
        <path d={TRACK_INNER}
          fill="none"
          stroke="#ffffff"
          strokeWidth="3"
          strokeDasharray="6 6"
          strokeDashoffset="6"
          opacity="0.2"
        />

        {/* Racing line (subtle white line through centre) */}
        <polyline
          points={WAYPOINTS.map(([x, y]) => `${x},${y}`).join(' ')}
          fill="none"
          stroke="#ffffff"
          strokeWidth="0.6"
          strokeDasharray="3 6"
          opacity="0.12"
        />

        {/* ── Track furniture ── */}

        {/* Sector markers */}
        {SECTOR_LINES.map((s, i) => (
          <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
            stroke="#fbbf24" strokeWidth="1.5" opacity="0.6" />
        ))}

        {/* DRS zone */}
        <rect x={DRS_ZONE.x} y={DRS_ZONE.y} width={DRS_ZONE.width} height={DRS_ZONE.height}
          rx="2" fill="#22c55e" opacity="0.18" />
        <text x={DRS_ZONE.x + DRS_ZONE.width / 2} y={DRS_ZONE.y + 6}
          textAnchor="middle" fontSize="5"
          fontFamily="Orbitron, monospace" fontWeight="700" fill="#22c55e" opacity="0.7">
          DRS
        </text>

        {/* Start/Finish line */}
        <rect x="193" y="40" width="2" height="28"
          fill="#ffffff" opacity="0.9" />
        {/* Chequered pattern on S/F */}
        {[0, 1, 2, 3].map(row =>
          [0, 1].map(col => (
            <rect key={`cf-${row}-${col}`}
              x={193 + col * 1} y={40 + row * 7}
              width="1" height="7"
              fill={(row + col) % 2 === 0 ? '#ffffff' : '#000000'}
              opacity="0.85"
            />
          ))
        )}

        {/* S/F label */}
        <text x="197" y="76" fontSize="5.5"
          fontFamily="Orbitron, monospace" fontWeight="700" fill="#ffffff" opacity="0.5">
          S/F
        </text>

        {/* Turn numbers */}
        {[
          { n: '1', x: 405, y: 58 },
          { n: '2', x: 448, y: 108 },
          { n: '5', x: 448, y: 162 },
          { n: '8', x: 375, y: 300 },
          { n: '11', x: 230, y: 300 },
          { n: '14', x: 60, y: 285 },
          { n: '17', x: 24, y: 200 },
          { n: '19', x: 60, y: 128 },
        ].map(t => (
          <text key={t.n} x={t.x} y={t.y} textAnchor="middle"
            fontSize="7" fontFamily="Orbitron, monospace" fontWeight="700"
            fill="#ffffff" opacity="0.2">
            T{t.n}
          </text>
        ))}

        {/* Infield circuit name */}
        <text x="230" y="160" textAnchor="middle"
          fontSize="11" fontFamily="Orbitron, monospace" fontWeight="900"
          fill="#f97316" opacity="0.5" letterSpacing="3">
          OVERTAKE
        </text>
        <text x="230" y="175" textAnchor="middle"
          fontSize="6.5" fontFamily="Orbitron, monospace" fontWeight="400"
          fill="#ffffff" opacity="0.15" letterSpacing="2">
          CIRCUIT
        </text>

        {/* ── Cars ── */}
        {players.map((player, i) => {
          const pos = playerPositions[i]
          const isActive = i === currentPlayerIndex
          const color = PLAYER_COLORS[i] || '#f97316'

          // Compute a slight forward-facing rotation from next waypoint
          const nextPct = Math.min((player.position || 0) + 3, 100)
          const nextPos = getPositionOnTrack(nextPct)
          const angle = Math.atan2(nextPos.y - pos.y, nextPos.x - pos.x) * (180 / Math.PI)

          return (
            <g key={player.name}
              transform={`translate(${pos.x}, ${pos.y})`}
              style={{ transition: 'transform 1.1s cubic-bezier(0.34,1.2,0.64,1)' }}
              filter={isActive ? 'url(#carGlow)' : undefined}
            >
              {/* Active pulse ring */}
              {isActive && (
                <>
                  <circle r="7" fill="none" stroke={color} strokeWidth="1" opacity="0">
                    <animate attributeName="r" values="5;12;5" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                </>
              )}

              {/* Speed trail */}
              {isActive && (() => {
                const trailPct = Math.max(0, (player.position || 0) - 4)
                const trailPos = getPositionOnTrack(trailPct)
                return (
                  <line
                    x1={trailPos.x - pos.x} y1={trailPos.y - pos.y}
                    x2="0" y2="0"
                    stroke={color} strokeWidth="2.5"
                    opacity="0.35" strokeLinecap="round"
                  />
                )
              })()}

              {/* Car body — rotated to face direction */}
              <g transform={`rotate(${angle})`}>
                {/* Car shadow */}
                <ellipse cx="0.5" cy="0.5" rx="4.5" ry="2.5" fill="#000" opacity="0.4" />
                {/* Main body */}
                <rect x="-5" y="-2.5" width="10" height="5" rx="1.5"
                  fill={color} />
                {/* Cockpit */}
                <rect x="-1.5" y="-1.8" width="4" height="3.5" rx="1"
                  fill={isActive ? '#fff' : '#ffffff88'} opacity="0.9" />
                {/* Front wing */}
                <rect x="4" y="-3" width="2" height="6" rx="0.5"
                  fill={color} opacity="0.8" />
                {/* Rear wing */}
                <rect x="-7" y="-3" width="1.5" height="6" rx="0.5"
                  fill={color} opacity="0.8" />
              </g>

              {/* Car number badge */}
              <circle cx="0" cy="-7" r="4.5" fill="#080816" stroke={color} strokeWidth="1" />
              <text x="0" y="-5.2" textAnchor="middle"
                fontSize="4.5" fontFamily="Orbitron, monospace" fontWeight="900"
                fill={color}>
                {i + 1}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}