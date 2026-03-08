import { PLAYER_COLORS, ordinal } from '../lib/constants.js'

const MEDALS = ['🥇','🥈','🥉','🏅']

export default function Standings({ players, currentPlayerName }) {
  const sorted = [...players].sort((a, b) => b.position - a.position)

  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid #1f2937',
      borderRadius: '16px',
      padding: '20px',
      minWidth: '200px',
    }}>
      <div style={{
        fontFamily: 'Orbitron, monospace',
        fontSize: '10px',
        letterSpacing: '3px',
        color: '#f97316',
        marginBottom: '16px',
      }}>STANDINGS</div>

      {sorted.map((player, rank) => {
        const isYou = player.name === currentPlayerName
        const color = PLAYER_COLORS[players.findIndex(p => p.name === player.name)]
        const pct = Math.round(player.position || 0)

        return (
          <div key={player.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: rank < sorted.length - 1 ? '12px' : 0,
            padding: '10px 12px',
            borderRadius: '10px',
            background: isYou ? `${color}15` : '#13131f',
            border: isYou ? `1px solid ${color}44` : '1px solid transparent',
            transition: 'all 0.4s',
          }}>
            <span style={{ fontSize: '18px', minWidth: '24px' }}>{MEDALS[rank]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'Exo 2, sans-serif',
                fontWeight: 700,
                fontSize: '13px',
                color: isYou ? color : '#e5e7eb',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {player.name} {isYou && <span style={{ color: '#6b7280', fontWeight: 400 }}>(you)</span>}
              </div>
              <div style={{ background: '#1f2937', borderRadius: '100px', height: '4px', marginTop: '5px' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: '100px',
                  background: color, transition: 'width 1s ease',
                }} />
              </div>
            </div>
            <div style={{
              fontFamily: 'Orbitron, monospace',
              fontSize: '11px',
              color: '#6b7280',
              minWidth: '32px',
              textAlign: 'right',
            }}>{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}