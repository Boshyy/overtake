import { useState, useEffect, useRef, useCallback } from 'react'
import { subscribeRoom, submitAnswer, usePowerup as firebaseUsePowerup, tickMovement } from '../lib/game.js'
import { PLAYER_COLORS, QUESTION_TIME, POWERUPS } from '../lib/constants.js'
import F1Track from '../components/F1Track.jsx'
import QuestionCard from '../components/QuestionCard.jsx'
import Standings from '../components/Standings.jsx'
import { playCountdownBeep } from '../lib/sounds.js'


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

export default function Race({ roomCode, playerName, onFinish }) {
  const [room, setRoom] = useState(null)
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME)
  const [maxTime, setMaxTime] = useState(QUESTION_TIME)
  const [activePowerup, setActivePowerup] = useState(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [raceStarted, setRaceStarted] = useState(false)
  const timerRef = useRef(null)
  const tickRef = useRef(null)
  const questionKeyRef = useRef(null)
  const isHostRef = useRef(false)

  useEffect(() => {
  if (navigator.mediaDevices) {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(() => console.log('mic granted'))
      .catch(() => console.log('mic denied'))
  }
  const interval = setInterval(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        clearInterval(interval)
        setRaceStarted(true)
        playCountdownBeep(0)
        return 0
      }
      playCountdownBeep(prev - 1)
      return prev - 1
    })
  }, 1000)
  return () => clearInterval(interval)
}, [])

  useEffect(() => {
    const unsub = subscribeRoom(roomCode, (data) => setRoom(data))
    return unsub
  }, [roomCode])

  useEffect(() => {
    if (!room) return
    const playerNames = Object.keys(room.players || {})
    isHostRef.current = playerNames[0] === playerName
  }, [room, playerName])

  useEffect(() => {
    if (!room || room.status !== 'racing') return
    if (!isHostRef.current) return
    tickRef.current = setInterval(() => tickMovement(roomCode), 1000)
    return () => clearInterval(tickRef.current)
  }, [room?.status, roomCode])

  useEffect(() => {
  if (!room || !raceStarted) return
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
    if (room?.status === 'finished') {
      clearInterval(timerRef.current)
      clearInterval(tickRef.current)
      setTimeout(() => onFinish(room.winner, Object.values(room.players || {})), 1000)
    }
  }, [room?.status])

  useEffect(() => () => {
    clearInterval(timerRef.current)
    clearInterval(tickRef.current)
  }, [])

  const handleAnswer = useCallback(async (correct, powerup) => {
    if (hasAnswered) return
    setHasAnswered(true)
    clearInterval(timerRef.current)
    await submitAnswer(roomCode, playerName, correct, powerup)
  }, [hasAnswered, roomCode, playerName])

  useEffect(() => {
    if (timeLeft === 0 && !hasAnswered && room) {
      const names = Object.keys(room.players || {})
      const turnName = names[room.currentPlayerIndex] || ''
      if (turnName === playerName) handleAnswer(false, null)
    }
  }, [timeLeft, hasAnswered, playerName, room, handleAnswer])

  if (!room) return <Loading />

  const players = Object.values(room.players || {})
  const playerNames = Object.keys(room.players || {})
  const currentTurnName = playerNames[room.currentPlayerIndex] || ''
  const isMyTurn = currentTurnName === playerName
  const currentQuestion = room.questions?.[room.currentQuestionIndex % (room.questions?.length || 1)]
  const myPlayer = room.players?.[playerName]
  const myPowerups = myPlayer?.powerups || []
  const currentPlayerSlot = players.findIndex(p => p.name === currentTurnName)

  const handleUsePowerup = async (puId) => {
    if (puId === 'SAFETY') {
      const newTime = timeLeft + 4
      setTimeLeft(newTime)
      setMaxTime(m => Math.max(m, newTime))
    }
    setActivePowerup(puId)
    await firebaseUsePowerup(roomCode, playerName, puId)
  }

  // ── Countdown screen ──────────────────────────────────────────────────────
  if (!raceStarted) {
    return (
      <div style={{
        minHeight: '100vh', width: '100%', position: 'relative',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: '24px', overflow: 'hidden',
      }}>
        <style>{`
          @font-face { font-family: 'Macqueen'; src: url('/fonts/MacqueenPersonalUse-woojw.ttf') format('truetype'); }
          @font-face { font-family: 'Arena'; src: url('/fonts/Arena-rvwaK.ttf') format('truetype'); }
          @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
          @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        `}</style>
        <div style={{ position:'fixed', top:0, left:0, right:0, height:'24px', zIndex:100, backgroundImage:`repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`, backgroundSize:'24px 24px' }} />
        <div style={{ position:'fixed', bottom:0, left:0, right:0, height:'24px', zIndex:100, backgroundImage:`repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`, backgroundSize:'24px 24px', transform:'scaleY(-1)' }} />
        <div style={{ position:'fixed', inset:0, zIndex:0, background:`radial-gradient(ellipse at 50% 40%, #1a0a08 0%, ${C.darkest} 70%)` }} />
        <div style={{ position:'fixed', left:0, top:0, bottom:0, width:'3px', background:`linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity:0.5, zIndex:1 }} />
        <div style={{ position:'fixed', right:0, top:0, bottom:0, width:'3px', background:`linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity:0.5, zIndex:1 }} />
        <div style={{ position:'relative', zIndex:10, textAlign:'center', animation:'fadeIn 0.5s ease both' }}>
          <div style={{ fontFamily:"'Macqueen', cursive", fontSize:'18px', color:C.cream, letterSpacing:'4px', marginBottom:'32px' }}>
            OVER<span style={{ color:C.blood }}>TAKE</span>
          </div>
          <div style={{ fontFamily:"'Macqueen', cursive", fontSize:'clamp(5rem, 20vw, 10rem)', color:C.pink, textShadow:`0 0 60px ${C.pink}99`, animation:'pulse 1s infinite', lineHeight:1 }}>
            {countdown}
          </div>
          <div style={{ color:C.charcoal, fontFamily:"'Arena', sans-serif", fontSize:'14px', letterSpacing:'4px', marginTop:'24px', textTransform:'uppercase' }}>
            Race Starting Soon
          </div>
          <div style={{ marginTop:'32px', background:'#0a0303', border:`1px solid ${C.crimson}`, borderRadius:'4px', padding:'16px 24px', maxWidth:'320px', margin:'32px auto 0' }}>
            <div style={{ fontSize:'24px', marginBottom:'8px' }}>🎙️</div>
            <div style={{ color:C.pink, fontFamily:"'Arena', sans-serif", fontSize:'11px', letterSpacing:'3px', marginBottom:'6px' }}>MICROPHONE ACCESS</div>
            <div style={{ color:C.charcoal, fontFamily:"'Arena', sans-serif", fontSize:'12px', letterSpacing:'1px', lineHeight:1.6 }}>Allow microphone access to answer questions by voice</div>
          </div>
        </div>
      </div>
    )
  }

  // ── Race screen ───────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @font-face { font-family: 'Macqueen'; src: url('/fonts/MacqueenPersonalUse-woojw.ttf') format('truetype'); }
        @font-face { font-family: 'Arena'; src: url('/fonts/Arena-rvwaK.ttf') format('truetype'); }
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .race-root {
          width: 100vw; height: 100vh; overflow: hidden;
          background: ${C.darkest}; display: flex; flex-direction: column;
          font-family: 'Arena', sans-serif;
        }

        /* Slim top bar */
        .race-header {
          height: 40px; min-height: 40px;
          background: #0a0303;
          border-bottom: 1px solid ${C.darkWine};
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 16px; flex-shrink: 0; z-index: 10;
        }
        .race-logo { font-family: 'Macqueen', cursive; font-size: 15px; color: ${C.cream}; letter-spacing: 3px; }
        .race-logo span { color: ${C.blood}; }
        .race-meta { display: flex; gap: 18px; align-items: center; }
        .meta-chip { font-family: 'Arena', sans-serif; font-size: 10px; color: ${C.charcoal}; letter-spacing: 2px; text-transform: uppercase; }
        .meta-chip b { color: ${C.pink}; }

        /* 2-col grid: left sidebar | right main */
        .race-body {
          flex: 1; min-height: 0;
          display: grid;
          grid-template-columns: 300px 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 1px;
          background: ${C.darkWine};
          overflow: hidden;
        }

        /* Each quadrant */
        .panel {
          background: ${C.darkest};
          display: flex; flex-direction: column;
          overflow: hidden; min-height: 0;
        }
        .panel-label {
          font-family: 'Arena', sans-serif; font-size: 9px;
          letter-spacing: 4px; color: ${C.charcoal};
          padding: 8px 14px 4px; text-transform: uppercase; flex-shrink: 0;
        }
        .panel-scroll {
          flex: 1; overflow-y: auto; overflow-x: hidden;
          padding: 6px 12px 12px;
          scrollbar-width: thin; scrollbar-color: ${C.darkWine} transparent;
          min-height: 0;
        }
        .panel-scroll::-webkit-scrollbar { width: 3px; }
        .panel-scroll::-webkit-scrollbar-thumb { background: ${C.darkWine}; border-radius: 2px; }

        /* Powerup buttons */
        .pu-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 4px; cursor: pointer;
          border: 1px solid ${C.darkWine}; background: #0a0303;
          transition: all 0.2s; width: 100%; text-align: left;
          margin-bottom: 8px;
        }
        .pu-btn:hover { border-color: ${C.charcoal}; background: #0e0303; }
        .pu-btn.active { background: #1a0505; }
        .pu-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @keyframes boost-flash { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>

      <div className="race-root">

        {/* Top checker strip */}
        <div style={{ height:'5px', flexShrink:0, backgroundImage:`repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`, backgroundSize:'10px 10px', opacity:0.9 }} />

        {/* Header */}
        <header className="race-header">
          <div className="race-logo">OVER<span>TAKE</span></div>
          <div className="race-meta">
            <div className="meta-chip">ROOM <b>{roomCode}</b></div>
            <div className="meta-chip">ROUND <b>{room.roundNumber || 1}</b></div>
            <div className="meta-chip" style={{ color: isMyTurn ? '#22c55e' : C.charcoal }}>
              {isMyTurn ? '● YOUR TURN' : `● ${currentTurnName?.toUpperCase()}'S TURN`}
            </div>
          </div>
        </header>

        {/* 4-panel body */}
        <div className="race-body">

          {/* ── TOP-LEFT: Standings ── */}
          <div className="panel">
            <div className="panel-label">Standings</div>
            <div className="panel-scroll">
              <Standings players={players} currentPlayerName={playerName} />
            </div>
          </div>

          {/* ── TOP-RIGHT: Circuit ── */}
          <div className="panel">
            <div className="panel-label">Circuit</div>
            <div className="panel-scroll" style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'0' }}>
              <F1Track players={players} currentPlayerIndex={room.currentPlayerIndex || 0} />
            </div>
          </div>

          {/* ── BOTTOM-LEFT: Power-Ups ── */}
          <div className="panel">
            <div className="panel-label">Power-Ups</div>
            <div className="panel-scroll">
              {myPowerups.length === 0 ? (
                <div style={{ color:C.charcoal, fontFamily:"'Arena', sans-serif", fontSize:'11px', letterSpacing:'1px', fontStyle:'italic', paddingTop:'4px' }}>
                  Answer correctly to earn power-ups
                </div>
              ) : (
                myPowerups.map((pu, i) => {
                  const def = POWERUPS[pu]
                  const isActive = activePowerup === pu
                  return (
                    <button key={i}
                      className={`pu-btn${isActive ? ' active' : ''}`}
                      onClick={() => isMyTurn && !hasAnswered && handleUsePowerup(pu)}
                      disabled={!isMyTurn || hasAnswered}
                      style={{ border:`1px solid ${isActive ? def?.color + '88' : C.darkWine}`, background: isActive ? `${def?.color}18` : '#0a0303' }}
                    >
                      <span style={{ fontSize:'22px' }}>{def?.emoji}</span>
                      <div>
                        <div style={{ fontFamily:"'Arena', sans-serif", fontSize:'12px', letterSpacing:'2px', color: def?.color || C.pink, textTransform:'uppercase' }}>
                          {def?.name}
                        </div>
                        <div style={{ fontFamily:"'Arena', sans-serif", fontSize:'10px', color:C.charcoal, letterSpacing:'1px', marginTop:'2px' }}>
                          {def?.desc}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* ── BOTTOM-RIGHT: Question ── */}
          <div className="panel">
            <div className="panel-label">
              {isMyTurn ? 'Your Question' : `${currentTurnName?.toUpperCase()}'s Question`}
            </div>
            <div className="panel-scroll">
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  timeLeft={timeLeft}
                  maxTime={maxTime}
                  isMyTurn={isMyTurn && !hasAnswered}
                  currentPlayerName={currentTurnName}
                  currentPlayerColor={PLAYER_COLORS[currentPlayerSlot] || C.pink}
                  myPowerups={isMyTurn ? myPowerups : []}
                  onAnswer={handleAnswer}
                  onUsePowerup={handleUsePowerup}
                  activePowerup={activePowerup}
                  waitingFor={currentTurnName}
                />
              )}
            </div>
          </div>

        </div>

        {/* Bottom checker strip */}
        <div style={{ height:'5px', flexShrink:0, backgroundImage:`repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`, backgroundSize:'10px 10px', opacity:0.9, transform:'scaleY(-1)' }} />

      </div>
    </>
  )
}

function Loading() {
  return (
    <div style={{ width:'100vw', height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#080405', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'40px', height:'40px', borderRadius:'50%', border:'3px solid #2F1416', borderTop:'3px solid #BB7780', animation:'spin 0.8s linear infinite' }} />
      <div style={{ color:'#BB7780', fontFamily:"'Arena', sans-serif", fontSize:'12px', letterSpacing:'4px', textTransform:'uppercase' }}>Loading Race...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}