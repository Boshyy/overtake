import { PLAYER_COLORS } from '../lib/constants.js'

const MEDALS = ['🥇', '🥈', '🥉', '🏅']

export default function Finish({ winner, players, onPlayAgain }) {
  const sorted = [...players].sort((a, b) => b.position - a.position)

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #0d1a0d 0%, #080810 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px', textAlign: 'center',
    }}>
      <div style={{ fontSize: '80px', marginBottom: '16px', animation: 'bounce 0.6s ease' }}>🏁</div>

      <div style={{ fontFamily: 'Orbitron, monospace', fontSize: '12px', letterSpacing: '4px', color: '#22c55e', marginBottom: '8px', opacity: 0.7 }}>
        RACE OVER
      </div>
      <div style={{
        fontFamily: 'Orbitron, monospace', fontWeight: 900,
        fontSize: 'clamp(1.8rem,6vw,3rem)', color: '#22c55e',
        textShadow: '0 0 30px #22c55e', marginBottom: '40px',
      }}>
        {winner} WINS! 🏆
      </div>

      <div style={{ width: '100%', maxWidth: '400px', marginBottom: '40px' }}>
        {sorted.map((p, i) => {
          const playerIdx = players.findIndex(pl => pl.name === p.name)
          const color = PLAYER_COLORS[playerIdx]
          return (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px 20px', borderRadius: '14px', marginBottom: '10px',
              background: i === 0 ? '#13231a' : '#0d0d1a',
              border: i === 0 ? '1px solid #22c55e44' : '1px solid #1f2937',
            }}>
              <span style={{ fontSize: '28px' }}>{MEDALS[i]}</span>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ fontFamily: 'Exo 2, sans-serif', fontWeight: 700, color: i === 0 ? '#22c55e' : '#e5e7eb', fontSize: '16px' }}>
                  {p.name}
                </div>
                <div style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'Exo 2, sans-serif' }}>
                  {p.score || 0} correct answers
                </div>
              </div>
              <div style={{
                background: color, borderRadius: '8px', padding: '4px 10px',
                fontFamily: 'Orbitron, monospace', fontSize: '11px', fontWeight: 700, color: '#000',
              }}>
                {Math.round(p.position || 0)}%
              </div>
            </div>
          )
        })}
      </div>

      <button onClick={onPlayAgain} style={{
        padding: '16px 40px', borderRadius: '12px', border: 'none',
        background: 'linear-gradient(135deg, #f97316, #ef4444)',
        color: '#000', fontFamily: 'Orbitron, monospace', fontWeight: 700,
        fontSize: '14px', letterSpacing: '3px', cursor: 'pointer',
        boxShadow: '0 0 30px rgba(249,115,22,0.4)',
      }}>🔄 RACE AGAIN</button>

      <style>{`@keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }`}</style>
    </div>
  )
}