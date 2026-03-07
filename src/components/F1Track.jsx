import { useMemo } from 'react'
import { PLAYER_COLORS, getTrackPosition } from '../lib/constants.js'

// Monaco-inspired track shape as an SVG path
// viewBox 0 0 100 60
const TRACK_PATH = `
  M 15,10
  L 85,10
  Q 95,10 95,20
  L 95,40
  Q 95,50 85,50
  L 55,50
  Q 48,50 48,43
  L 48,38
  Q 48,32 42,32
  L 30,32
  Q 24,32 24,38
  L 24,43
  Q 24,50 17,50
  L 15,50
  Q 5,50 5,40
  L 5,20
  Q 5,10 15,10
  Z
`.trim()

// We animate cars along a simplified oval for easier maths
// Points sampled along the track for 0-100%
function sampleTrackPoint(pct) {
  // Use parametric oval: wider than tall, matching the track shape
  const t = (pct / 100) * 2 * Math.PI - Math.PI / 2
  const cx = 50, cy = 30, rx = 40, ry = 18
  return {
    x: cx + rx * Math.cos(t),
    y: cy + ry * Math.sin(t),
  }
}

const CHECKERED_POSITIONS = [
  { x: 50, y: 12 }, // start/finish on top straight
]

export default function F1Track({ players, currentPlayerIndex }) {
  const playerPositions = useMemo(() =>
    players.map(p => sampleTrackPoint(p.position || 0)),
    [players]
  )

  return (
    <div style={{ width: '100%', maxWidth: '700px', margin: '0 auto' }}>
      <svg
        viewBox="0 0 100 60"
        style={{ width: '100%', height: 'auto', filter: 'drop-shadow(0 0 20px rgba(249,115,22,0.15))' }}
      >
        {/* Track tarmac — thick stroke */}
        <ellipse cx="50" cy="30" rx="40" ry="18"
          fill="none" stroke="#2a2a3e" strokeWidth="8" />

        {/* Track surface lines */}
        <ellipse cx="50" cy="30" rx="40" ry="18"
          fill="none" stroke="#1a1a2e" strokeWidth="6" />

        {/* White racing lines */}
        <ellipse cx="50" cy="30" rx="40" ry="18"
          fill="none" stroke="#ffffff08" strokeWidth="0.4" strokeDasharray="2 3" />

        {/* Inner kerb — red/white */}
        <ellipse cx="50" cy="30" rx="33" ry="11"
          fill="none" stroke="#ef444433" strokeWidth="1.5" strokeDasharray="1.5 1.5" />

        {/* Outer kerb */}
        <ellipse cx="50" cy="30" rx="44" ry="22"
          fill="none" stroke="#ef444422" strokeWidth="1" strokeDasharray="1.5 1.5" />

        {/* Grass / infield */}
        <ellipse cx="50" cy="30" rx="32" ry="10" fill="#0d1f0d" />

        {/* RevRacer logo on infield */}
        <text x="50" y="28" textAnchor="middle" fontSize="3.5"
          fontFamily="Orbitron, monospace" fontWeight="900" fill="#f97316" opacity="0.7">
          REV
        </text>
        <text x="50" y="33" textAnchor="middle" fontSize="3.5"
          fontFamily="Orbitron, monospace" fontWeight="900" fill="#ffffff" opacity="0.4">
          RACER
        </text>

        {/* Start/finish line */}
        <rect x="48" y="11" width="4" height="1.2" fill="#ffffff" opacity="0.9" />
        <rect x="48" y="11" width="1" height="0.6" fill="#000" opacity="0.5" />
        <rect x="50" y="11" width="1" height="0.6" fill="#000" opacity="0.5" />
        <rect x="49" y="11.6" width="1" height="0.6" fill="#000" opacity="0.5" />
        <rect x="51" y="11.6" width="1" height="0.6" fill="#000" opacity="0.5" />

        {/* Distance markers */}
        {[0, 25, 50, 75].map(pct => {
          const pos = sampleTrackPoint(pct)
          return (
            <circle key={pct} cx={pos.x} cy={pos.y} r="0.6"
              fill="#ffffff20" />
          )
        })}

        {/* Cars */}
        {players.map((player, i) => {
          const pos = playerPositions[i]
          const isActive = i === currentPlayerIndex
          const color = PLAYER_COLORS[i]

          return (
            <g key={player.name}>
              {/* Glow when active */}
              {isActive && (
                <circle cx={pos.x} cy={pos.y} r="3.5"
                  fill="none" stroke={color} strokeWidth="0.5" opacity="0.6">
                  <animate attributeName="r" values="3.5;5;3.5" dur="1.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.1;0.6" dur="1.5s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Car body */}
              <circle cx={pos.x} cy={pos.y} r="2.2"
                fill={color}
                style={{ transition: 'cx 1.2s cubic-bezier(0.34,1.56,0.64,1), cy 1.2s cubic-bezier(0.34,1.56,0.64,1)' }}
              />

              {/* Car number */}
              <text x={pos.x} y={pos.y + 0.7} textAnchor="middle"
                fontSize="2" fontFamily="Orbitron, monospace" fontWeight="700" fill="#000">
                {i + 1}
              </text>
            </g>
          )
        })}

        {/* Speed trail for active player */}
        {players.map((player, i) => {
          if (i !== currentPlayerIndex) return null
          const pos = playerPositions[i]
          const trailPct = Math.max(0, (player.position || 0) - 5)
          const trailPos = sampleTrackPoint(trailPct)
          return (
            <line key={`trail-${i}`}
              x1={trailPos.x} y1={trailPos.y}
              x2={pos.x} y2={pos.y}
              stroke={PLAYER_COLORS[i]} strokeWidth="1.5"
              opacity="0.3" strokeLinecap="round"
            />
          )
        })}
      </svg>
    </div>
  )
}
