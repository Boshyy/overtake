import { PLAYER_COLORS, ordinal } from '../lib/constants.js'

const C = {
  blood:    "#B32623",
  deepRed:  "#761212",
  darkest:  "#080405",
  darkWine: "#2F1416",
  crimson:  "#5C0B0D",
  tan:      "#BE9F7E",
  warmGrey: "#888278",
  charcoal: "#5B514F",
  cream:    "#F2E8D9",
  pink:     "#BB7780",
}

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

export default function Standings({ players, currentPlayerName }) {
  const sorted = [...players].sort((a, b) => b.position - a.position)

  return (
    <div style={{
      background: '#0a0303',
      border: `1px solid ${C.darkWine}`,
      borderRadius: '4px',
      padding: '20px',
      minWidth: '200px',
    }}>
      <style>{`
        @font-face { font-family: 'Arena'; src: url('/src/assets/fonts/Arena-rvwaK.ttf') format('truetype'); }
      `}</style>

      <div style={{
        fontFamily: "'Arena', sans-serif",
        fontSize: '10px', letterSpacing: '5px',
        color: C.charcoal, marginBottom: '16px',
        textTransform: 'uppercase',
      }}>Standings</div>

      {sorted.map((player, rank) => {
        const isYou = player.name === currentPlayerName
        const color = PLAYER_COLORS[players.findIndex(p => p.name === player.name)]
        const pct = Math.round(player.position || 0)

        return (
          <div key={player.name} style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            marginBottom: rank < sorted.length - 1 ? '10px' : 0,
            padding: '10px 12px', borderRadius: '4px',
            background: isYou ? `${color}15` : '#0d0303',
            border: `1px solid ${isYou ? color + '44' : C.crimson}`,
            transition: 'all 0.4s',
          }}>
            <span style={{ fontSize: '18px', minWidth: '24px' }}>{MEDALS[rank]}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: "'Arena', sans-serif",
                fontSize: '13px', letterSpacing: '1px',
                color: isYou ? color : C.tan,
                whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', textTransform: 'uppercase',
              }}>
                {player.name} {isYou && <span style={{ color: C.charcoal, fontWeight: 400, fontSize: '11px' }}>(you)</span>}
              </div>
              <div style={{ background: C.darkWine, borderRadius: '100px', height: '3px', marginTop: '5px' }}>
                <div style={{
                  width: `${pct}%`, height: '100%', borderRadius: '100px',
                  background: color, transition: 'width 1s ease',
                  boxShadow: isYou ? `0 0 6px ${color}` : 'none',
                }} />
              </div>
            </div>
            <div style={{
              fontFamily: "'Arena', sans-serif",
              fontSize: '11px', letterSpacing: '1px',
              color: C.charcoal, minWidth: '32px', textAlign: 'right',
            }}>{pct}%</div>
          </div>
        )
      })}
    </div>
  )
}