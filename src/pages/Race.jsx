import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeRoom, submitAnswer, usePowerup as firebaseUsePowerup } from '../lib/game.js'
import { PLAYER_COLORS, QUESTION_TIME, POWERUPS } from '../lib/constants.js'
import F1Track from '../components/F1Track.jsx'
import Standings from '../components/Standings.jsx'
import QuestionCard from '../components/QuestionCard.jsx'

export default function Race({ roomCode, playerName, onFinish }) {
  const [room, setRoom] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [maxTime, setMaxTime] = useState(QUESTION_TIME)
  const [activePowerup, setActivePowerup] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const timerRef = useRef(null)
  const questionKeyRef = useRef(null)


  useEffect(() => {
    const unsub = subscribeRoom(roomCode, (data) => setRoom(data))
    return unsub
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    const qKey = `${room.currentQuestionIndex}-${room.currentPlayerIndex}`
    if (qKey !== questionKeyRef.current) {
      questionKeyRef.current = qKey
      setHasAnswered(false)
      setActivePowerup(null)
      const t = QUESTION_TIME
      setTimeLeft(t)
      setMaxTime(t)
      clearInterval(timerRef.current)
      if (room.questionPhase === 'active') {
        timerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) { clearInterval(timerRef.current); return 0 }
            return prev - 1
          })
        }, 1000)
      }
    }
  }, [room?.currentQuestionIndex, room?.currentPlayerIndex, room?.questionPhase])

  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered && isMyTurn) handleAnswer(false, null)
  }, [timeLeft])

  useEffect(() => {
    if (room?.status === 'finished') {
      clearInterval(timerRef.current)
      setTimeout(() => onFinish(room.winner, Object.values(room.players || {})), 1000)
    }
  }, [room?.status])

  useEffect(() => () => clearInterval(timerRef.current), [])

  const handleAnswer = useCallback(async (correct, powerup) => {
    if (hasAnswered) return
    setHasAnswered(true)
    clearInterval(timerRef.current)
    await submitAnswer(roomCode, playerName, correct, powerup)
  }, [hasAnswered, roomCode, playerName])

  if (!room) return <Loading />

  const players = Object.values(room.players || {})
  
  const playerNames = Object.keys(room.players || {})
  const currentTurnName = playerNames[room.currentPlayerIndex] || ''
  const isMyTurn = currentTurnName === playerName
  const currentQuestion = room?.questions?.[room?.currentQuestionIndex % (room?.questions?.length || 1)]
  const myPlayer = room?.players?.[playerName]
  const myPowerups = myPlayer?.powerups || []


  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered && isMyTurn) {
      handleAnswer(false, null)
    }
  }, [timeLeft, hasAnswered, isMyTurn, handleAnswer])

  const handleUsePowerup = async (puId) => {
    if (puId === 'SAFETY') {
      const newTime = timeLeft + 4
      setTimeLeft(newTime)
      setMaxTime(m => Math.max(m, newTime))
    }
    setActivePowerup(puId)
    await firebaseUsePowerup(roomCode, playerName, puId)
  }

  if (!room) return <Loading />

  const sortedPlayers = [...players].sort((a, b) => b.position - a.position)
  const currentPlayerSlot = players.findIndex(p => p.name === currentTurnName)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Barlow+Condensed:wght@400;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .race-root {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #05050f;
          display: flex;
          flex-direction: column;
          font-family: 'Barlow Condensed', sans-serif;
        }

        /* Top header bar */
        .race-header {
          height: 44px;
          min-height: 44px;
          background: #08081a;
          border-bottom: 1px solid #1a1a35;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 10;
        }

        .race-logo {
          font-family: 'Orbitron', monospace;
          font-weight: 900;
          font-size: 15px;
          color: #fff;
          letter-spacing: 2px;
        }

        .race-logo span { color: #f97316; }

        .race-meta {
          display: flex;
          gap: 24px;
          align-items: center;
        }

        .meta-chip {
          font-family: 'Orbitron', monospace;
          font-size: 10px;
          color: #4b5563;
          letter-spacing: 1px;
        }

        .meta-chip b {
          color: #f97316;
          font-weight: 700;
        }

        /* 4-quadrant grid */
        .race-grid {
          flex: 1;
          display: grid;
          grid-template-columns: 280px 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 1px;
          background: #111125;
          overflow: hidden;
        }

        .quadrant {
          background: #07071a;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .quadrant-label {
          font-family: 'Orbitron', monospace;
          font-size: 9px;
          letter-spacing: 3px;
          color: #f97316;
          padding: 12px 16px 0;
          opacity: 0.8;
        }

        /* Top-left: Standings */
        .q-standings {
          grid-column: 1;
          grid-row: 1;
          border-right: 1px solid #111125;
          border-bottom: 1px solid #111125;
        }

        /* Bottom-left: Power-ups (placeholder) */
        .q-powerups {
          grid-column: 1;
          grid-row: 2;
          border-right: 1px solid #111125;
        }

        /* Top-right: Track */
        .q-track {
          grid-column: 2;
          grid-row: 1;
          border-bottom: 1px solid #111125;
        }

        /* Bottom-right: Question */
        .q-question {
          grid-column: 2;
          grid-row: 2;
        }

        .quadrant-inner {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 8px 14px 14px;
          scrollbar-width: thin;
          scrollbar-color: #1f2937 transparent;
        }

        .quadrant-inner::-webkit-scrollbar { width: 4px; }
        .quadrant-inner::-webkit-scrollbar-thumb { background: #1f2937; border-radius: 2px; }

        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes pulse-ring {
          0% { transform: scale(0.9); opacity: 0.7; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div className="race-root">
        {/* Header */}
        <header className="race-header">
          <div className="race-logo">OVER<span>TAKE</span></div>
          <div className="race-meta">
            <div className="meta-chip">ROOM <b>{roomCode}</b></div>
            <div className="meta-chip">ROUND <b>{room.roundNumber || 1}</b></div>
            <div className="meta-chip" style={{ color: isMyTurn ? '#22c55e' : '#4b5563' }}>
              {isMyTurn ? '● YOUR TURN' : `● ${currentTurnName?.toUpperCase()}'S TURN`}
            </div>
          </div>
        </header>

        {/* 4-quadrant layout */}
        <div className="race-grid">

          {/* TOP LEFT — Standings */}
          <div className="quadrant q-standings">
            <div className="quadrant-label">STANDINGS</div>
            <div className="quadrant-inner">
              <StandingsCompact players={players} currentPlayerName={playerName} />
            </div>
          </div>

          {/* BOTTOM LEFT — Power-ups */}
          <div className="quadrant q-powerups">
            <div className="quadrant-label">POWER-UPS</div>
            <div className="quadrant-inner">
              <PowerupsPanel
                myPowerups={myPowerups}
                activePowerup={activePowerup}
                isMyTurn={isMyTurn && !hasAnswered}
                onUsePowerup={handleUsePowerup}
              />
            </div>
          </div>

          {/* TOP RIGHT — Track */}
          <div className="quadrant q-track">
            <div className="quadrant-label">CIRCUIT</div>
            <div className="quadrant-inner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <F1Track
                players={players}
                currentPlayerIndex={room.currentPlayerIndex || 0}
              />
            </div>
          </div>

          {/* BOTTOM RIGHT — Question */}
          <div className="quadrant q-question">
            <div className="quadrant-label">
              {isMyTurn ? 'YOUR QUESTION' : `WAITING FOR ${currentTurnName?.toUpperCase()}`}
            </div>
            <div className="quadrant-inner">
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  timeLeft={timeLeft}
                  maxTime={maxTime}
                  isMyTurn={isMyTurn && !hasAnswered}
                  currentPlayerName={currentTurnName}
                  currentPlayerColor={PLAYER_COLORS[currentPlayerSlot] || '#f97316'}
                  myPowerups={[]}
                  onAnswer={handleAnswer}
                  onUsePowerup={handleUsePowerup}
                  activePowerup={activePowerup}
                  waitingFor={currentTurnName}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}

// Compact standings for the smaller quadrant
function StandingsCompact({ players, currentPlayerName }) {
  const sorted = [...players].sort((a, b) => b.position - a.position)
  const MEDALS = ['🥇', '🥈', '🥉', '🏅']

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
      {sorted.map((player, rank) => {
        const isYou = player.name === currentPlayerName
        const colorIdx = players.findIndex(p => p.name === player.name)
        const color = PLAYER_COLORS[colorIdx] || '#f97316'
        const pct = Math.round(player.position || 0)

        return (
          <div key={player.name} style={{
            padding: '10px 12px',
            borderRadius: '10px',
            background: isYou ? `${color}18` : '#0f0f22',
            border: `1px solid ${isYou ? color + '44' : '#1a1a35'}`,
            transition: 'all 0.4s',
            animation: 'slide-in 0.3s ease both',
            animationDelay: `${rank * 0.05}s`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '16px', minWidth: '22px' }}>{MEDALS[rank] || '🏅'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: isYou ? color : '#c9cce0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {player.name.toUpperCase()}
                  {isYou && <span style={{ color: '#4b5563', fontWeight: 400, fontSize: '9px', marginLeft: '6px' }}>YOU</span>}
                </div>
              </div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '11px',
                color: color,
                fontWeight: 700,
              }}>{pct}%</div>
            </div>
            <div style={{ background: '#111128', borderRadius: '100px', height: '3px' }}>
              <div style={{
                width: `${pct}%`,
                height: '100%',
                borderRadius: '100px',
                background: `linear-gradient(90deg, ${color}88, ${color})`,
                transition: 'width 1s ease',
                boxShadow: isYou ? `0 0 6px ${color}` : 'none',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Power-ups panel
function PowerupsPanel({ myPowerups, activePowerup, isMyTurn, onUsePowerup }) {
  if (!myPowerups.length) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        paddingTop: '20px',
        opacity: 0.4,
      }}>
        <div style={{ fontSize: '32px' }}>🏁</div>
        <div style={{
          fontFamily: 'Orbitron, monospace',
          fontSize: '10px',
          color: '#4b5563',
          letterSpacing: '1px',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          ANSWER CORRECTLY<br />TO EARN POWER-UPS
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
      {myPowerups.map((pu, i) => {
        const def = POWERUPS[pu]
        const isActive = activePowerup === pu
        return (
          <button key={i}
            onClick={() => isMyTurn && onUsePowerup(pu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: isActive ? `${def?.color}22` : '#0f0f22',
              border: `1px solid ${isActive ? def?.color : '#1a1a35'}`,
              cursor: isMyTurn ? 'pointer' : 'not-allowed',
              opacity: isMyTurn ? 1 : 0.5,
              transition: 'all 0.2s',
              width: '100%',
              textAlign: 'left',
            }}>
            <span style={{ fontSize: '22px' }}>{def?.emoji}</span>
            <div>
              <div style={{
                fontFamily: 'Orbitron, monospace',
                fontSize: '10px',
                fontWeight: 700,
                color: def?.color || '#f97316',
                letterSpacing: '1px',
              }}>{def?.name}</div>
              <div style={{
                fontFamily: 'Barlow Condensed, sans-serif',
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '2px',
              }}>{def?.desc}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Loading() {
  return (
    <div style={{
      width: '100vw', height: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#05050f', flexDirection: 'column', gap: '16px',
    }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '50%',
        border: '3px solid #1a1a35',
        borderTop: '3px solid #f97316',
        animation: 'spin 0.8s linear infinite',
      }} />
      <div style={{ color: '#f97316', fontFamily: 'Orbitron, monospace', fontSize: '12px', letterSpacing: '3px' }}>
        LOADING RACE...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}