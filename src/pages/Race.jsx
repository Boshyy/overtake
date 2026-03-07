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
    const unsub = subscribeRoom(roomCode, (data) => {
      setRoom(data)
    })
    return unsub
  }, [roomCode])

  // Reset when question changes
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
            if (prev <= 1) {
              clearInterval(timerRef.current)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    }
  }, [room?.currentQuestionIndex, room?.currentPlayerIndex, room?.questionPhase])

  // Auto-submit on timeout if it's my turn
  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered && isMyTurn) {
      handleAnswer(false, null)
    }
  }, [timeLeft])

  useEffect(() => {
    if (room?.status === 'finished') {
      clearInterval(timerRef.current)
      setTimeout(() => onFinish(room.winner, Object.values(room.players || {})), 1000)
    }
  }, [room?.status])

  useEffect(() => () => clearInterval(timerRef.current), [])

  if (!room) return <Loading />

  const players = Object.values(room.players || {})
  const playerNames = Object.keys(room.players || {})
  const currentTurnName = playerNames[room.currentPlayerIndex] || ''
  const isMyTurn = currentTurnName === playerName
  const currentQuestion = room.questions?.[room.currentQuestionIndex % (room.questions?.length || 1)]
  const myPlayer = room.players?.[playerName]
  const myPowerups = myPlayer?.powerups || []

  const handleAnswer = useCallback(async (correct, powerup) => {
    if (hasAnswered) return
    setHasAnswered(true)
    clearInterval(timerRef.current)
    await submitAnswer(roomCode, playerName, correct, powerup)
  }, [hasAnswered, roomCode, playerName])

  const handleUsePowerup = async (puId) => {
    if (puId === 'SAFETY') {
      const newTime = timeLeft + 4
      setTimeLeft(newTime)
      setMaxTime(m => Math.max(m, newTime))
    }
    setActivePowerup(puId)
    await firebaseUsePowerup(roomCode, playerName, puId)
  }

  const sortedPlayers = [...players].sort((a, b) => b.position - a.position)
  const currentPlayerSlot = players.findIndex(p => p.name === currentTurnName)

  return (
    <div style={{
      minHeight: '100vh', background: '#080810',
      backgroundImage: 'radial-gradient(ellipse at 50% 100%, #0d0d20 0%, #080810 50%)',
      padding: '16px',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '16px', maxWidth: '1100px', margin: '0 auto 16px',
      }}>
        <div style={{ fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '18px', color: '#fff' }}>
          REV<span style={{ color: '#f97316' }}>RACER</span>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ color: '#6b7280', fontFamily: 'Exo 2, sans-serif', fontSize: '12px' }}>
            Room: <span style={{ color: '#f97316', fontFamily: 'Orbitron, monospace' }}>{roomCode}</span>
          </div>
          <div style={{ color: '#6b7280', fontFamily: 'Exo 2, sans-serif', fontSize: '12px' }}>
            Round <span style={{ color: '#fff' }}>{room.roundNumber || 1}</span>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 220px', gap: '20px',
        alignItems: 'start',
      }}>
        {/* Left: Track + Question */}
        <div>
          {/* F1 Track */}
          <div style={{
            background: '#0d0d1a', border: '1px solid #1f2937',
            borderRadius: '20px', padding: '20px', marginBottom: '20px',
          }}>
            <F1Track players={players} currentPlayerIndex={room.currentPlayerIndex || 0} />

            {/* Car legend */}
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' }}>
              {players.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: PLAYER_COLORS[i] }} />
                  <span style={{
                    fontFamily: 'Exo 2, sans-serif', fontSize: '12px',
                    color: p.name === playerName ? '#fff' : '#9ca3af',
                    fontWeight: p.name === playerName ? 700 : 400,
                  }}>
                    {p.name} {p.name === playerName && '(you)'}
                  </span>
                  {/* Powerup indicators */}
                  {(p.powerups || []).map((pu, j) => (
                    <span key={j} style={{ fontSize: '12px' }}>{POWERUPS[pu]?.emoji}</span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Question area */}
          {currentQuestion && (
            <QuestionCard
              question={currentQuestion}
              timeLeft={timeLeft}
              maxTime={maxTime}
              isMyTurn={isMyTurn && !hasAnswered}
              currentPlayerName={currentTurnName}
              currentPlayerColor={PLAYER_COLORS[currentPlayerSlot] || '#f97316'}
              myPowerups={isMyTurn ? myPowerups : []}
              onAnswer={handleAnswer}
              onUsePowerup={handleUsePowerup}
              activePowerup={activePowerup}
              waitingFor={currentTurnName}
            />
          )}
        </div>

        {/* Right: Standings */}
        <div style={{ position: 'sticky', top: '16px' }}>
          <Standings players={players} currentPlayerName={playerName} />

          {/* My powerups display */}
          {myPowerups.length > 0 && (
            <div style={{
              marginTop: '16px', background: '#0d0d1a', border: '1px solid #1f2937',
              borderRadius: '16px', padding: '16px',
            }}>
              <div style={{ color: '#f97316', fontSize: '10px', letterSpacing: '3px', fontFamily: 'Orbitron, monospace', marginBottom: '12px' }}>
                MY POWER-UPS
              </div>
              {myPowerups.map((pu, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '18px' }}>{POWERUPS[pu]?.emoji}</span>
                  <div>
                    <div style={{ color: POWERUPS[pu]?.color, fontSize: '11px', fontFamily: 'Orbitron, monospace' }}>{POWERUPS[pu]?.name}</div>
                    <div style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'Exo 2, sans-serif' }}>{POWERUPS[pu]?.desc}</div>
                  </div>
                </div>
              ))}
              <div style={{ color: '#4b5563', fontSize: '11px', fontFamily: 'Exo 2, sans-serif', marginTop: '8px' }}>
                Tap power-up buttons on your turn card to activate
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Loading() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810' }}>
      <div style={{ color: '#f97316', fontFamily: 'Orbitron, monospace', fontSize: '14px' }}>LOADING RACE...</div>
    </div>
  )
}
