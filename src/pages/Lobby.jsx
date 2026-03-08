import { useState, useEffect } from 'react'
import { subscribeRoom, setReady, startGame } from '../lib/game.js'
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

export default function Lobby({ roomCode, playerName, isHost, onStartRace }) {
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
      minHeight: '100vh',
      width: '100%',
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      <style>{`
        @font-face {
          font-family: 'Macqueen';
          src: url('/fonts/MacqueenPersonalUse-woojw.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Arena';
          src: url('/fonts/Arena-rvwaK.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .lobby-btn {
          width: 100%; padding: 14px 24px;
          border-radius: 4px;
          font-family: 'Arena', sans-serif;
          font-size: 16px; letter-spacing: 4px;
          cursor: pointer; transition: all 0.2s ease;
          text-transform: uppercase; border: none;
        }
        .lobby-btn:hover { transform: translateY(-1px); }
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
      <div style={{
        width: '100%', maxWidth: '440px',
        padding: '60px 20px',
        position: 'relative', zIndex: 10,
        animation: 'fadeUp 0.6s ease both',
      }}>

        {/* Room code */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontFamily: "'Arena', sans-serif",
            fontSize: '10px', letterSpacing: '6px',
            color: C.charcoal, marginBottom: '12px',
          }}>
            ROOM CODE
          </div>
          <div style={{
            fontFamily: "'Macqueen', cursive",
            fontSize: 'clamp(2.5rem, 10vw, 4rem)',
            color: C.pink, letterSpacing: '10px',
            textShadow: `0 0 30px ${C.pink}55`,
          }}>
            {roomCode}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${C.charcoal}, transparent)`, marginBottom: '24px' }} />

        {/* Players list */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{
            fontFamily: "'Arena', sans-serif",
            fontSize: '10px', letterSpacing: '5px',
            color: C.charcoal, marginBottom: '16px',
          }}>
            RACERS ({players.length}/4)
          </div>

          {players.map((p, i) => (
            <div key={p.name} style={{
              display: 'flex', alignItems: 'center', gap: '14px',
              padding: '12px 14px', borderRadius: '4px', marginBottom: '10px',
              background: p.name === playerName ? `${PLAYER_COLORS[p.slotIndex || i]}15` : '#0a0303',
              border: `1px solid ${p.name === playerName ? PLAYER_COLORS[p.slotIndex || i] + '55' : C.crimson}`,
              transition: 'all 0.3s',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: PLAYER_COLORS[p.slotIndex || i],
                boxShadow: `0 0 8px ${PLAYER_COLORS[p.slotIndex || i]}88`,
              }} />
              <span style={{
                flex: 1, fontFamily: "'Arena', sans-serif",
                fontWeight: 400, color: C.cream, fontSize: '15px',
                letterSpacing: '1px',
              }}>
                {p.name}
                {p.name === playerName && <span style={{ color: C.charcoal, marginLeft: '6px', fontSize: '12px' }}>(you)</span>}
                {isHost && p.name === playerName && <span style={{ color: C.pink, fontSize: '11px', marginLeft: '8px', letterSpacing: '2px' }}>HOST</span>}
              </span>
              <div style={{
                fontSize: '11px', fontFamily: "'Arena', sans-serif",
                letterSpacing: '2px',
                color: p.ready ? '#22c55e' : C.charcoal,
              }}>
                {p.ready ? '✓ READY' : 'WAITING'}
              </div>
            </div>
          ))}

          {players.length < 4 && (
            <div style={{
              padding: '12px', borderRadius: '4px', background: '#0a0303',
              border: `1px dashed ${C.crimson}`, textAlign: 'center',
              color: C.charcoal, fontFamily: "'Arena', sans-serif",
              fontSize: '12px', letterSpacing: '2px',
            }}>
              Waiting for players...
            </div>
          )}
        </div>

        {/* Questions loaded */}
        {room.questions && (
          <div style={{
            background: '#0a1a0a', border: `1px solid #22c55e33`,
            borderRadius: '4px', padding: '10px 16px',
            color: '#22c55e', fontSize: '11px',
            fontFamily: "'Arena', sans-serif",
            textAlign: 'center', marginBottom: '16px',
            letterSpacing: '2px',
          }}>
            ✓ {room.questions.length} questions loaded
          </div>
        )}

        {/* Divider */}
        <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${C.charcoal}, transparent)`, marginBottom: '16px' }} />

        {/* Ready button */}
        {!meReady ? (
          <button
            className="lobby-btn"
            onClick={() => setReady(roomCode, playerName)}
            style={{
              background: `${C.pink}bb`,
              border: `1.5px solid ${C.pink}`,
              color: C.cream,
              boxShadow: `0 4px 20px ${C.pink}33`,
            }}
          >
            ✓ &nbsp; I'M READY
          </button>
        ) : (
          <div style={{
            textAlign: 'center', color: '#22c55e',
            fontFamily: "'Arena', sans-serif",
            fontSize: '13px', padding: '16px',
            letterSpacing: '3px',
          }}>
            ✓ You're ready!
          </div>
        )}

        {/* Start race */}
        {isHost && allReady && (
          <button
            className="lobby-btn"
            onClick={async () => {
              await startGame(roomCode)
              onStartRace()
            }}
            style={{
              marginTop: '12px',
              background: `${C.blood}cc`,
              border: `1.5px solid ${C.blood}`,
              color: C.cream,
              boxShadow: `0 4px 20px ${C.blood}44`,
            }}
          >
            START RACE
          </button>
        )}

        {isHost && !allReady && players.length >= 2 && (
          <div style={{
            textAlign: 'center', color: C.charcoal,
            fontFamily: "'Arena', sans-serif",
            fontSize: '12px', marginTop: '12px', letterSpacing: '2px',
          }}>
            Waiting for all players to ready up...
          </div>
        )}

        {isHost && players.length < 2 && (
          <div style={{
            textAlign: 'center', color: C.charcoal,
            fontFamily: "'Arena', sans-serif",
            fontSize: '12px', marginTop: '12px', letterSpacing: '2px',
          }}>
            Need at least 2 players to start
          </div>
        )}

      </div>
    </div>
  )
}

function Loading() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#080405',
    }}>
      <div style={{
        color: '#BB7780', fontFamily: "'Arena', sans-serif",
        fontSize: '14px', letterSpacing: '4px',
      }}>LOADING...</div>
    </div>
  )
}