import { useState, useEffect } from 'react'
import { subscribeRoom, setReady, startGame } from '../lib/game.js'
import { PLAYER_COLORS } from '../lib/constants.js'

export default function Lobby({ roomCode, playerName, isHost }) {
  const [room, setRoom] = useState(null)

  useEffect(() => {
    const unsub = subscribeRoom(roomCode, setRoom)
    return unsub
  }, [roomCode])

  if (!room) return <Loading />

  const players = Object.values(room.players || {})
  const allReady = players.length >= 2 && players.every(p => p.ready)
  const meReady = room.players?.[playerName]?.ready

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      backgroundImage: 'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #080810 60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '24px',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ color: '#6b7280', fontSize: '11px', letterSpacing: '3px', fontFamily: 'Orbitron, monospace', marginBottom: '10px' }}>
            ROOM CODE
          </div>
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: 'clamp(2.5rem,10vw,4rem)',
            fontWeight: 900, color: '#f97316', letterSpacing: '10px',
            textShadow: '0 0 30px rgba(249,115,22,0.5)',
          }}>
            {roomCode}
          </div>
          <div style={{ color: '#4b5563', fontSize: '13px', fontFamily: 'Exo 2, sans-serif', marginTop: '10px' }}>
            Share this code with your friends
          </div>
        </div>

        <div style={{ background: '#0d0d1a', border: '1px solid #1f2937', borderRadius: '20px', padding: '24px', marginBottom: '20px' }}>
          <div style={{ color: '#f97316', fontSize: '10px', letterSpacing: '3px', fontFamily: 'Orbitron, monospace', marginBottom: '18px' }}>
            RACERS ({players.length}/4)
          </div>

          {players.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px', borderRadius: '12px', marginBottom: '10px',
              background: p.name === playerName ? `${PLAYER_COLORS[p.slotIndex || i]}15` : '#13131f',
              border: `1px solid ${p.name === playerName ? PLAYER_COLORS[p.slotIndex || i] + '44' : 'transparent'}`,
            }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%',
                background: PLAYER_COLORS[p.slotIndex || i],
              }} />
              <span style={{ flex: 1, fontFamily: 'Exo 2, sans-serif', fontWeight: 600, color: '#f9fafb' }}>
                {p.name} {p.name === playerName && <span style={{ color: '#6b7280', fontWeight: 400 }}>(you)</span>}
                {isHost && p.name === playerName && <span style={{ color: '#f97316', fontSize: '11px', marginLeft: '6px' }}>HOST</span>}
              </span>
              <div style={{
                fontSize: '12px', fontFamily: 'Orbitron, monospace',
                color: p.ready ? '#22c55e' : '#6b7280',
              }}>
                {p.ready ? '✓ READY' : 'NOT READY'}
              </div>
            </div>
          ))}

          {players.length < 4 && (
            <div style={{
              padding: '12px', borderRadius: '12px', background: '#080812',
              border: '1px dashed #1f2937', textAlign: 'center',
              color: '#374151', fontFamily: 'Exo 2, sans-serif', fontSize: '13px',
            }}>
              Waiting for players...
            </div>
          )}
        </div>

        {room.questions && (
          <div style={{
            background: '#0d1a0d', border: '1px solid #22c55e33',
            borderRadius: '12px', padding: '12px 16px',
            color: '#22c55e', fontSize: '12px', fontFamily: 'Exo 2, sans-serif',
            textAlign: 'center', marginBottom: '16px',
          }}>
            ✓ {room.questions.length} questions loaded
          </div>
        )}

        {!meReady ? (
          <button onClick={() => setReady(roomCode, playerName)} style={bigBtn('#3b82f6')}>
            ✓ I'M READY
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: '#22c55e', fontFamily: 'Orbitron, monospace', fontSize: '13px', padding: '16px' }}>
            ✓ You're ready!
          </div>
        )}

        {isHost && allReady && (
          <button onClick={() => startGame(roomCode)} style={{ ...bigBtn('#f97316'), marginTop: '12px' }}>
            🏁 START RACE
          </button>
        )}

        {isHost && !allReady && players.length >= 2 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'Exo 2, sans-serif', fontSize: '13px', marginTop: '12px' }}>
            Waiting for all players to ready up...
          </div>
        )}

        {isHost && players.length < 2 && (
          <div style={{ textAlign: 'center', color: '#6b7280', fontFamily: 'Exo 2, sans-serif', fontSize: '13px', marginTop: '12px' }}>
            Need at least 2 players to start
          </div>
        )}
      </div>
    </div>
  )
}

const bigBtn = (bg) => ({
  width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
  background: bg, color: '#000', fontFamily: 'Orbitron, monospace',
  fontWeight: 700, fontSize: '14px', letterSpacing: '2px', cursor: 'pointer',
  boxShadow: `0 0 20px ${bg}44`,
})

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
      <div style={{ color: '#f97316', fontFamily: 'Orbitron, monospace', fontSize: '14px' }}>LOADING...</div>
    </div>
  )
}