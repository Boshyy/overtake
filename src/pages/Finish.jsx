import { PLAYER_COLORS } from '../lib/constants.js'

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

export default function Finish({ winner, players, onPlayAgain }) {
  const sorted = [...players].sort((a, b) => b.position - a.position)

  return (
    <div style={{
      minHeight: '100vh', width: '100%',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', textAlign: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @font-face {
          font-family: 'Macqueen';
          src: url('/src/assets/fonts/MacqueenPersonalUse-woojw.ttf') format('truetype');
        }
        @font-face {
          font-family: 'Arena';
          src: url('/src/assets/fonts/Arena-rvwaK.ttf') format('truetype');
        }
        @keyframes bounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-20px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow {
          0%,100% { text-shadow: 0 0 20px #BB778855; }
          50%      { text-shadow: 0 0 40px #BB7780cc, 0 0 80px #BB778844; }
        }
        .finish-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px #B3262344 !important; }
      `}</style>

      {/* Checkered top */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '24px', zIndex: 100,
        backgroundImage: `repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`,
        backgroundSize: '24px 24px',
      }} />

      {/* Checkered bottom */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '24px', zIndex: 100,
        backgroundImage: `repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`,
        backgroundSize: '24px 24px',
        transform: 'scaleY(-1)',
      }} />

      {/* Background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 50% 40%, #1a0a08 0%, ${C.darkest} 70%)`,
      }} />

      {/* Side stripes */}
      <div style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: '3px', background: `linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity: 0.5, zIndex: 1 }} />
      <div style={{ position: 'fixed', right: 0, top: 0, bottom: 0, width: '3px', background: `linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity: 0.5, zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10, animation: 'fadeUp 0.6s ease both', width: '100%', maxWidth: '440px' }}>

        {/* Trophy */}
        <div style={{ fontSize: '72px', marginBottom: '16px', animation: 'bounce 0.8s ease' }}>
          🏆
        </div>

        {/* Race over label */}
        <div style={{
          fontFamily: "'Arena', sans-serif",
          fontSize: '10px', letterSpacing: '6px',
          color: C.charcoal, marginBottom: '10px',
          textTransform: 'uppercase',
        }}>
          Race Over
        </div>

        {/* Winner */}
        <div style={{
          fontFamily: "'Macqueen', cursive",
          fontSize: 'clamp(2rem, 8vw, 3.5rem)',
          color: C.pink, letterSpacing: '3px',
          animation: 'glow 2s ease infinite',
          marginBottom: '8px',
        }}>
          {winner}
        </div>
        <div style={{
          fontFamily: "'Arena', sans-serif",
          fontSize: '13px', letterSpacing: '6px',
          color: C.tan, marginBottom: '40px',
          textTransform: 'uppercase',
        }}>
          Takes the Chequered Flag
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${C.charcoal}, transparent)`, marginBottom: '24px' }} />

        {/* Standings */}
        <div style={{ width: '100%', marginBottom: '36px' }}>
          {sorted.map((p, i) => {
            const playerIdx = players.findIndex(pl => pl.name === p.name)
            const color = PLAYER_COLORS[playerIdx]
            return (
              <div key={p.name} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 16px', borderRadius: '4px', marginBottom: '10px',
                background: i === 0 ? `${color}18` : '#0a0303',
                border: `1px solid ${i === 0 ? color + '55' : C.crimson}`,
                transition: 'all 0.3s',
                animation: `fadeUp 0.4s ${i * 0.1}s ease both`,
              }}>
                <span style={{ fontSize: '24px' }}>{MEDALS[i]}</span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{
                    fontFamily: "'Arena', sans-serif",
                    fontWeight: 400, letterSpacing: '2px',
                    color: i === 0 ? color : C.cream,
                    fontSize: '15px', textTransform: 'uppercase',
                  }}>
                    {p.name}
                  </div>
                  <div style={{
                    color: C.charcoal, fontSize: '11px',
                    fontFamily: "'Arena', sans-serif",
                    letterSpacing: '1px', marginTop: '2px',
                  }}>
                    {p.score || 0} correct answers
                  </div>
                </div>
                <div style={{
                  background: 'transparent',
                  border: `1px solid ${color}`,
                  borderRadius: '3px', padding: '4px 10px',
                  fontFamily: "'Arena', sans-serif",
                  fontSize: '12px', color: color,
                  letterSpacing: '1px',
                }}>
                  {Math.round(p.position || 0)}%
                </div>
              </div>
            )
          })}
        </div>

        {/* Play again button */}
        <button
          className="finish-btn"
          onClick={onPlayAgain}
          style={{
            padding: '14px 40px', borderRadius: '4px',
            border: `1.5px solid ${C.blood}`,
            background: `${C.blood}cc`,
            color: C.cream,
            fontFamily: "'Arena', sans-serif",
            fontSize: '16px', letterSpacing: '5px',
            cursor: 'pointer', textTransform: 'uppercase',
            boxShadow: `0 4px 20px ${C.blood}44`,
            transition: 'all 0.2s ease',
          }}
        >
          Race Again
        </button>

      </div>
    </div>
  )
}