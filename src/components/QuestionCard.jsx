import { useState, useEffect } from 'react'
import { useSpeech } from '../hooks/useSpeech.js'
import { POWERUPS } from '../lib/constants.js'

const OPTIONS = ['A', 'B', 'C', 'D']

export default function QuestionCard({
  question,
  timeLeft,
  maxTime,
  isMyTurn,
  currentPlayerName,
  currentPlayerColor,
  myPowerups = [],
  onAnswer,
  onUsePowerup,
  activePowerup,
  waitingFor,
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

  const cardStyle = {
    background: '#0d0d1a',
    border: `1px solid ${isMyTurn ? currentPlayerColor + '55' : '#1f2937'}`,
    borderRadius: '14px',
    padding: '12px 14px',
    position: 'relative',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  }

  return (
    <div style={cardStyle}>

      {/* Top row: who's turn + timer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', fontSize: '10px', fontWeight: 700,
          color: currentPlayerColor, letterSpacing: '1.5px',
        }}>
          {isMyTurn ? '▶ YOUR TURN' : `▶ ${currentPlayerName?.toUpperCase()}'S TURN`}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Power-up buttons (only shown on your turn) */}
          {isMyTurn && myPowerups.map((pu, i) => (
            <button key={i}
              onClick={() => !submitted && onUsePowerup(pu)}
              title={POWERUPS[pu]?.desc}
              style={{
                background: activePowerup === pu ? `${POWERUPS[pu]?.color}33` : '#1f2937',
                border: `1px solid ${POWERUPS[pu]?.color}66`,
                borderRadius: '6px', padding: '3px 7px',
                cursor: 'pointer', fontSize: '14px',
              }}>
              {POWERUPS[pu]?.emoji}
            </button>
          ))}
          {/* Timer */}
          <div style={{
            fontFamily: 'Orbitron, monospace', fontSize: '18px', fontWeight: 900,
            color: timerColor, minWidth: '36px', textAlign: 'right',
          }}>{timeLeft}s</div>
        </div>
      </div>

      {/* Timer bar */}
      <div style={{ background: '#1f2937', borderRadius: '100px', height: '3px' }}>
        <div style={{
          width: `${timePct}%`, height: '100%', borderRadius: '100px',
          background: timerColor, transition: 'width 1s linear',
          boxShadow: `0 0 4px ${timerColor}`,
        }} />
      </div>

      {/* Question text */}
      <div style={{
        background: '#13131f', borderRadius: '10px', padding: '10px 12px', textAlign: 'center',
      }}>
        <div style={{
          color: '#f9fafb', fontSize: '13px',
          fontFamily: 'Barlow Condensed, sans-serif', lineHeight: 1.4, fontWeight: 600,
        }}>{question?.q}</div>
      </div>

      {/* Answer options */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', flex: 1 }}>
        {question?.options?.map((opt, i) => {
          const letter = OPTIONS[i]
          const isSelected = selected === letter
          const isCorrectReveal = submitted && letter === question.a
          const isWrongReveal = submitted && isSelected && letter !== question.a

          let bg = '#13131f'
          let border = '#1f2937'
          let textColor = '#9ca3af'
          if (isSelected && !submitted) { bg = `${currentPlayerColor}22`; border = currentPlayerColor; textColor = '#fff' }
          if (isCorrectReveal) { bg = '#22c55e22'; border = '#22c55e'; textColor = '#22c55e' }
          if (isWrongReveal) { bg = '#ef444422'; border = '#ef4444'; textColor = '#ef4444' }

          // Non-active players can see options but can't click
          const clickable = isMyTurn && !submitted

          return (
            <button key={letter}
              onClick={() => clickable && setSelected(letter)}
              style={{
                padding: '8px 10px', borderRadius: '8px', textAlign: 'left',
                border: `1.5px solid ${border}`, background: bg, color: textColor,
                fontFamily: 'Barlow Condensed, sans-serif', fontSize: '12px',
                cursor: clickable ? 'pointer' : 'default',
                transition: 'all 0.15s', lineHeight: 1.3,
                opacity: !isMyTurn && !isSelected ? 0.7 : 1,
              }}>
              <span style={{
                fontFamily: 'Orbitron, monospace', fontWeight: 700,
                marginRight: '6px', fontSize: '10px', color: border,
              }}>{letter}</span>
              {opt.replace(`${letter}) `, '')}
            </button>
          )
        })}
      </div>

      {/* Voice indicator (compact, only when your turn) */}
      {isMyTurn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          background: '#080812', borderRadius: '8px', padding: '6px 10px',
          border: listening ? '1px solid #ef444433' : '1px solid #1f2937',
        }}>
          <div style={{
            width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
            background: listening ? '#ef4444' : '#374151',
            boxShadow: listening ? '0 0 6px #ef4444' : 'none',
          }} />
          <div style={{
            color: transcript ? '#f9fafb' : '#4b5563',
            fontSize: '11px', fontFamily: 'Barlow Condensed, sans-serif',
            fontStyle: transcript ? 'normal' : 'italic',
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {transcript || (listening ? 'Listening... say your answer' : 'Mic off')}
          </div>
          {!supported && <span style={{ color: '#6b7280', fontSize: '10px' }}>Chrome only</span>}
        </div>
      )}

      {/* Submit button (only your turn) */}
      {isMyTurn && !submitted && (
        <button onClick={handleSubmit} disabled={!selected}
          style={{
            padding: '10px', borderRadius: '10px', border: 'none',
            background: selected
              ? `linear-gradient(135deg, ${currentPlayerColor}, ${currentPlayerColor}bb)`
              : '#1f2937',
            color: selected ? '#000' : '#374151',
            fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '11px',
            letterSpacing: '2px', cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}>
          LOCK IN
        </button>
      )}

      {/* Result overlay */}
      {result && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: result === 'correct' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          borderRadius: '13px', backdropFilter: 'blur(3px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>{result === 'correct' ? '✅' : '❌'}</div>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '22px',
              color: result === 'correct' ? '#22c55e' : '#ef4444',
              textShadow: `0 0 16px ${result === 'correct' ? '#22c55e' : '#ef4444'}`,
            }}>
              {result === 'correct' ? 'CORRECT!' : 'WRONG!'}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  )
}