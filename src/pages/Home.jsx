import { useState, useRef } from 'react'
import { createRoom, joinRoom } from '../lib/game.js'
import { POWERUPS } from '../lib/constants.js'

const SAMPLE_QUESTIONS = [
  { q: 'What is the powerhouse of the cell?', options: ['A) Nucleus', 'B) Mitochondria', 'C) Ribosome', 'D) Golgi body'], a: 'B' },
  { q: 'What does DNA stand for?', options: ['A) Deoxyribonucleic acid', 'B) Dynamic nuclear acid', 'C) Dual nitrogen array', 'D) Dense network assembly'], a: 'A' },
  { q: "What is Newton's second law?", options: ['A) Every action has equal reaction', 'B) Objects at rest stay at rest', 'C) Force equals mass times acceleration', 'D) Energy is conserved'], a: 'C' },
  { q: 'What year did World War II end?', options: ['A) 1943', 'B) 1944', 'C) 1945', 'D) 1946'], a: 'C' },
  { q: 'What is the chemical symbol for gold?', options: ['A) Gd', 'B) Go', 'C) Gl', 'D) Au'], a: 'D' },
  { q: 'Who wrote Romeo and Juliet?', options: ['A) Charles Dickens', 'B) William Shakespeare', 'C) Jane Austen', 'D) Oscar Wilde'], a: 'B' },
  { q: 'What is the derivative of x²?', options: ['A) x', 'B) 2', 'C) 2x', 'D) x³/3'], a: 'C' },
  { q: 'What gas do plants absorb during photosynthesis?', options: ['A) Oxygen', 'B) Nitrogen', 'C) Hydrogen', 'D) Carbon dioxide'], a: 'D' },
  { q: 'What is the speed of light?', options: ['A) 300,000 km/s', 'B) 30,000 km/s', 'C) 3,000 km/s', 'D) 300 km/s'], a: 'A' },
  { q: 'What is the largest planet in our solar system?', options: ['A) Saturn', 'B) Neptune', 'C) Jupiter', 'D) Uranus'], a: 'C' },
  { q: 'What is the capital of France?', options: ['A) Lyon', 'B) Marseille', 'C) Nice', 'D) Paris'], a: 'D' },
  { q: 'In what year did the Berlin Wall fall?', options: ['A) 1987', 'B) 1989', 'C) 1991', 'D) 1993'], a: 'B' },
]

export default function Home({ onEnterGame }) {
  const [mode, setMode] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return }
    setLoading(true); setError('')
    try {
      const code = await createRoom(playerName.trim(), SAMPLE_QUESTIONS)
      await joinRoom(code, playerName.trim())
      onEnterGame(code, playerName.trim(), true)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  const handleJoin = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return }
    if (!joinCode.trim()) { setError('Enter a room code'); return }
    setLoading(true); setError('')
    try {
      await joinRoom(joinCode.trim().toUpperCase(), playerName.trim())
      onEnterGame(joinCode.trim().toUpperCase(), playerName.trim(), false)
    } catch (e) {
      setError(e.message)
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      backgroundImage: 'radial-gradient(ellipse at 50% -10%, #1a0a2e 0%, #080810 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '11px', color: '#f97316', letterSpacing: '7px', fontFamily: 'Orbitron, monospace', marginBottom: '6px', opacity: 0.8 }}>
          REVISION LEAGUE
        </div>
        <h1 style={{
          fontFamily: 'Orbitron, monospace', fontWeight: 900,
          fontSize: 'clamp(2.5rem,8vw,5rem)', margin: 0,
          color: '#fff', letterSpacing: '4px',
          textShadow: '0 0 40px rgba(249,115,22,0.5)',
        }}>
          REV<span style={{ color: '#f97316' }}>RACER</span>
        </h1>
        <div style={{ color: '#4b5563', fontFamily: 'Exo 2, sans-serif', marginTop: '8px', fontSize: '14px' }}>
          Study hard. Race harder.
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: '480px' }}>
        {!mode && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <button onClick={() => setMode('create')} style={btnStyle('#f97316')}>
              🏁 Create Room
            </button>
            <button onClick={() => setMode('join')} style={btnStyle('#3b82f6')}>
              🚗 Join Room
            </button>
            <div style={{ marginTop: '20px', background: '#0d0d1a', border: '1px solid #1f2937', borderRadius: '14px', padding: '18px' }}>
              <div style={{ color: '#f97316', fontSize: '10px', letterSpacing: '3px', fontFamily: 'Orbitron, monospace', marginBottom: '14px' }}>POWER-UPS</div>
              {Object.values(POWERUPS).map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{p.emoji}</span>
                  <div>
                    <div style={{ color: p.color, fontSize: '11px', fontFamily: 'Orbitron, monospace', fontWeight: 700 }}>{p.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '12px', fontFamily: 'Exo 2, sans-serif' }}>{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {mode && (
          <div style={{ background: '#0d0d1a', border: '1px solid #1f2937', borderRadius: '20px', padding: '28px' }}>
            <button onClick={() => { setMode(null); setError('') }} style={{
              background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer',
              fontFamily: 'Exo 2, sans-serif', fontSize: '13px', marginBottom: '20px', padding: 0,
            }}>← Back</button>

            <div style={{ color: '#f97316', fontFamily: 'Orbitron, monospace', fontSize: '11px', letterSpacing: '3px', marginBottom: '20px' }}>
              {mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>YOUR NAME</label>
              <input value={playerName} onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your racing name"
                style={inputStyle} />
            </div>

            {mode === 'join' && (
              <div style={{ marginBottom: '14px' }}>
                <label style={labelStyle}>ROOM CODE</label>
                <input value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="e.g. A1B2C3"
                  maxLength={6}
                  style={{ ...inputStyle, fontFamily: 'Orbitron, monospace', letterSpacing: '6px', fontSize: '20px' }} />
              </div>
            )}

            {error && (
              <div style={{ color: '#ef4444', fontFamily: 'Exo 2, sans-serif', fontSize: '13px', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading}
              style={btnStyle(loading ? '#374151' : '#f97316')}>
              {loading ? '...' : mode === 'create' ? '🏁 Create & Enter Lobby' : '🚗 Join Race'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const btnStyle = (bg) => ({
  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
  background: bg, color: bg === '#374151' ? '#6b7280' : '#000',
  fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '14px',
  letterSpacing: '2px', cursor: 'pointer', transition: 'all 0.2s',
  boxShadow: bg !== '#374151' ? `0 0 20px ${bg}44` : 'none',
})

const labelStyle = {
  display: 'block', color: '#6b7280', fontSize: '10px',
  letterSpacing: '3px', fontFamily: 'Orbitron, monospace', marginBottom: '8px',
}

const inputStyle = {
  width: '100%', padding: '12px 16px', borderRadius: '10px',
  border: '1px solid #374151', background: '#080812',
  color: '#f9fafb', fontFamily: 'Exo 2, sans-serif', fontSize: '16px',
  outline: 'none', boxSizing: 'border-box',
}