import { useState, useEffect } from 'react'
import { useSpeech } from '../hooks/useSpeech.js'
import { POWERUPS } from '../lib/constants.js'

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

const OPTIONS = ['A', 'B', 'C', 'D']

export default function QuestionCard({
  question, timeLeft, maxTime, isMyTurn,
  currentPlayerName, currentPlayerColor,
  myPowerups = [], onAnswer, onUsePowerup,
  activePowerup, waitingFor,
}) {
  const [selected, setSelected] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState(null)
  const { transcript, listening, supported, start, stop, reset } = useSpeech()

  useEffect(() => {
    setSelected(null)
    setSubmitted(false)
    setResult(null)
    reset()
    if (isMyTurn && supported) start()
    return () => stop()
  }, [question?.q, isMyTurn])

  useEffect(() => {
    if (!transcript || submitted) return
    const norm = s => s.toLowerCase().trim().replace(/[^a-z0-9 ]/g, '')
    const spoken = norm(transcript)
    let bestMatch = null
    let bestScore = 0
    for (const opt of OPTIONS) {
      const optionText = question?.options?.find(o => o.startsWith(`${opt})`))
      if (!optionText) continue
      const optWords = norm(optionText.replace(`${opt})`, '')).split(' ').filter(w => w.length > 2)
      let score = 0
      for (const word of optWords) { if (spoken.includes(word)) score++ }
      if (score > bestScore) { bestScore = score; bestMatch = opt }
    }
    if (bestMatch && bestScore > 0) setSelected(bestMatch)
  }, [transcript])

  const handleSubmit = () => {
    if (!selected || submitted) return
    setSubmitted(true)
    stop()
    const correct = selected === question.a
    setResult(correct ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(correct, activePowerup), 1200)
  }

  const timePct = (timeLeft / maxTime) * 100
  const timerColor = timePct > 50 ? '#22c55e' : timePct > 25 ? '#fbbf24' : '#ef4444'

  return (
    <div style={{
      background: '#0a0303',
      border: `1px solid ${isMyTurn ? currentPlayerColor + '55' : C.crimson}`,
      borderRadius: '4px',
      padding: '12px 14px',
      position: 'relative',
      overflow: 'hidden',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
    }}>
      <style>{`
        @font-face { font-family: 'Arena'; src: url('/src/assets/fonts/Arena-rvwaK.ttf') format('truetype'); }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
      `}</style>

      {/* Top row: who's turn + timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: "'Arena', sans-serif", fontSize: '11px',
          color: currentPlayerColor, letterSpacing: '3px', textTransform: 'uppercase',
        }}>
          {isMyTurn ? '▶ YOUR TURN' : `▶ ${currentPlayerName?.toUpperCase()}'S TURN`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isMyTurn && myPowerups.map((pu, i) => (
            <button key={i}
              onClick={() => !submitted && onUsePowerup(pu)}
              title={POWERUPS[pu]?.desc}
              style={{
                background: activePowerup === pu ? `${POWERUPS[pu]?.color}33` : C.darkWine,
                border: `1px solid ${POWERUPS[pu]?.color}66`,
                borderRadius: '3px', padding: '3px 7px',
                cursor: 'pointer', fontSize: '14px',
              }}>
              {POWERUPS[pu]?.emoji}
            </button>
          ))}
          <div style={{
            fontFamily: "'Arena', sans-serif", fontSize: '18px',
            color: timerColor, minWidth: '36px', textAlign: 'right', letterSpacing: '1px',
          }}>{timeLeft}s</div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ background: C.darkWine, borderRadius: '100px', height: '3px' }}>
        <div style={{
          width: `${timePct}%`, height: '100%', borderRadius: '100px',
          background: timerColor, transition: 'width 1s linear',
          boxShadow: `0 0 4px ${timerColor}`,
        }} />
      </div>

      {/* Question text */}
      <div style={{
        background: '#0d0505', borderRadius: '4px',
        padding: '10px 12px', textAlign: 'center',
        border: `1px solid ${C.darkWine}`,
      }}>
        <div style={{
          color: C.cream, fontSize: '13px',
          fontFamily: "'Arena', sans-serif",
          lineHeight: 1.5, letterSpacing: '0.5px',
        }}>{question?.q}</div>
      </div>

      {/* Answer options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1 }}>
        {question?.options?.map((opt, i) => {
          const letter = OPTIONS[i]
          const isSelected = selected === letter
          const isCorrectReveal = submitted && letter === question.a
          const isWrongReveal = submitted && isSelected && letter !== question.a

          let bg = '#0a0303'
          let border = C.darkWine
          let textColor = C.warmGrey
          if (isSelected && !submitted) { bg = `${currentPlayerColor}22`; border = currentPlayerColor; textColor = C.cream }
          if (isCorrectReveal) { bg = '#22c55e22'; border = '#22c55e'; textColor = '#22c55e' }
          if (isWrongReveal)   { bg = '#ef444422'; border = '#ef4444'; textColor = '#ef4444' }

          const clickable = isMyTurn && !submitted

          return (
            <button key={letter}
              onClick={() => clickable && setSelected(letter)}
              style={{
                padding: '8px 10px', borderRadius: '4px', textAlign: 'left',
                border: `1.5px solid ${border}`, background: bg, color: textColor,
                fontFamily: "'Arena', sans-serif", fontSize: '12px', letterSpacing: '0.5px',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'all 0.15s', lineHeight: 1.4,
                opacity: !isMyTurn && !isSelected ? 0.7 : 1,
              }}>
              <span style={{
                fontFamily: "'Arena', sans-serif", fontWeight: 700,
                marginRight: '6px', fontSize: '11px', color: border, letterSpacing: '1px',
              }}>{letter}</span>
              {opt.replace(`${letter}) `, '')}
            </button>
          )
        })}
      </div>

      {/* Voice indicator */}
      {isMyTurn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: C.darkest, borderRadius: '4px', padding: '6px 10px',
          border: listening ? `1px solid ${C.blood}44` : `1px solid ${C.darkWine}`,
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: listening ? '#ef4444' : C.charcoal,
            boxShadow: listening ? '0 0 6px #ef4444' : 'none',
          }} />
          <div style={{
            color: transcript ? C.cream : C.charcoal,
            fontSize: '11px', fontFamily: "'Arena', sans-serif",
            fontStyle: transcript ? 'normal' : 'italic',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '1px',
          }}>
            {transcript || (listening ? 'Listening... say your answer' : 'Mic off')}
          </div>
          {!supported && <span style={{ color: C.charcoal, fontSize: '10px', fontFamily: "'Arena', sans-serif" }}>Chrome only</span>}
        </div>
      )}

      {/* Submit button */}
      {isMyTurn && !submitted && (
        <button onClick={handleSubmit} disabled={!selected}
          style={{
            padding: '10px', borderRadius: '4px', border: 'none',
            background: selected ? `${currentPlayerColor}cc` : C.darkWine,
            color: selected ? C.cream : C.charcoal,
            fontFamily: "'Arena', sans-serif", fontSize: '13px',
            letterSpacing: '4px', cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s', textTransform: 'uppercase',
          }}>
          Lock In
        </button>
      )}

      {/* Result overlay */}
      {result && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: result === 'correct' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          borderRadius: '4px', backdropFilter: 'blur(3px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>{result === 'correct' ? '✅' : '❌'}</div>
            <div style={{
              fontFamily: "'Arena', sans-serif", fontSize: '22px', letterSpacing: '4px',
              color: result === 'correct' ? '#22c55e' : '#ef4444',
              textShadow: `0 0 16px ${result === 'correct' ? '#22c55e' : '#ef4444'}`,
              textTransform: 'uppercase',
            }}>
              {result === 'correct' ? 'Correct!' : 'Wrong!'}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}