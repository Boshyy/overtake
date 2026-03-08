import { useState, useEffect } from 'react'
import { useSpeech } from '../hooks/useSpeech.js'
import { POWERUPS, PLAYER_COLORS, QUESTION_TIME } from '../lib/constants.js'
import { playCorrect, playWrong } from '../lib/sounds.js'


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
    if (isMyTurn && supported) {
        setTimeout(() => start(), 300)
    }
    return () => stop()
  }, [question?.q, isMyTurn])

    useEffect(() => {
        if (!transcript || submitted) return
        const spoken = transcript.toLowerCase().trim()
        const lastWord = spoken.split(' ').pop()

        // Match single letter A B C D spoken clearly
        if (/^[abcd]$/.test(lastWord)) {
            setSelected(lastWord.toUpperCase())
        return
    }

        // Match full option text
        for (const opt of OPTIONS) {
            const optionText = question?.options?.find(o => o.startsWith(`${opt})`))
            if (!optionText) continue
            const optClean = optionText.replace(`${opt}) `, '').toLowerCase()
            const optWords = optClean.split(' ').filter(w => w.length > 3)
            const matchCount = optWords.filter(w => spoken.includes(w)).length
            if (matchCount >= 2 || (optWords.length === 1 && spoken.includes(optWords[0]))) {
                setSelected(opt)
                return
            }
        }
    }, [transcript])

  const handleSubmit = () => {
    if (!selected || submitted) return
    setSubmitted(true)
    stop()
    const correct = selected === question.a
    setResult(correct ? 'correct' : 'wrong')
    if (correct) playCorrect()
    else playWrong()
    setTimeout(() => onAnswer(correct, activePowerup), 1400)
  }

  const timePct = (timeLeft / maxTime) * 100
  const timerColor = timePct > 50 ? '#22c55e' : timePct > 25 ? '#fbbf24' : '#ef4444'

  if (!isMyTurn) {
    return (
      <div style={{
        background: '#0d0d1a', border: '1px solid #1f2937',
        borderRadius: '20px', padding: '28px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <div style={{
          fontFamily: 'Orbitron, monospace', color: currentPlayerColor,
          fontSize: '14px', fontWeight: 700, marginBottom: '8px',
        }}>
          {waitingFor}'s Turn
        </div>
        <div style={{ color: '#6b7280', fontFamily: 'Exo 2, sans-serif', fontSize: '13px' }}>
          Waiting for them to answer...
        </div>
        <div style={{ marginTop: '20px', background: '#1f2937', borderRadius: '100px', height: '6px' }}>
          <div style={{
            width: `${timePct}%`, height: '100%', borderRadius: '100px',
            background: timerColor, transition: 'width 1s linear',
          }} />
        </div>
        <div style={{
          fontFamily: 'Orbitron, monospace', color: timerColor,
          fontSize: '22px', fontWeight: 900, marginTop: '10px',
        }}>{timeLeft}s</div>
      </div>
    )
  }

  return (
    <div style={{
      background: '#0d0d1a',
      border: `2px solid ${currentPlayerColor}33`,
      borderRadius: '20px', padding: '24px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px',
      }}>
        <div style={{
          fontFamily: 'Orbitron, monospace', color: currentPlayerColor,
          fontSize: '12px', fontWeight: 700, letterSpacing: '2px',
        }}>
          YOUR TURN
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {myPowerups.map((pu, i) => (
            <button key={i}
              onClick={() => !submitted && onUsePowerup(pu)}
              title={POWERUPS[pu]?.desc}
              style={{
                background: activePowerup === pu ? `${POWERUPS[pu]?.color}33` : '#1f2937',
                border: `1px solid ${POWERUPS[pu]?.color}66`,
                borderRadius: '8px', padding: '5px 10px',
                cursor: 'pointer', fontSize: '16px', transition: 'all 0.2s',
              }}>
              {POWERUPS[pu]?.emoji}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: '#1f2937', borderRadius: '100px', height: '5px', marginBottom: '6px' }}>
        <div style={{
          width: `${timePct}%`, height: '100%', borderRadius: '100px',
          background: timerColor, transition: 'width 1s linear',
          boxShadow: `0 0 6px ${timerColor}`,
        }} />
      </div>
      <div style={{
        textAlign: 'center', fontFamily: 'Orbitron, monospace',
        color: timerColor, fontSize: '26px', fontWeight: 900, marginBottom: '20px',
      }}>{timeLeft}s</div>

      <div style={{
        background: '#13131f', borderRadius: '12px', padding: '18px',
        marginBottom: '20px', textAlign: 'center',
      }}>
        <div style={{
          color: '#9ca3af', fontSize: '10px', letterSpacing: '3px',
          fontFamily: 'Orbitron, monospace', marginBottom: '10px',
        }}>QUESTION</div>
        <div style={{
          color: '#f9fafb', fontSize: 'clamp(0.95rem, 2.5vw, 1.2rem)',
          fontFamily: 'Exo 2, sans-serif', lineHeight: 1.5, fontWeight: 600,
        }}>{question?.q}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        {question?.options?.map((opt, i) => {
          const letter = OPTIONS[i]
          const isSelected = selected === letter
          const isCorrectReveal = submitted && letter === question.a
          const isWrongReveal = submitted && isSelected && letter !== question.a

          let bg = '#13131f'
          let border = '#1f2937'
          let textColor = '#d1d5db'
          if (isSelected && !submitted) { bg = `${currentPlayerColor}22`; border = currentPlayerColor; textColor = '#fff' }
          if (isCorrectReveal) { bg = '#22c55e22'; border = '#22c55e'; textColor = '#22c55e' }
          if (isWrongReveal) { bg = '#ef444422'; border = '#ef4444'; textColor = '#ef4444' }

          return (
            <button key={letter}
              onClick={() => !submitted && setSelected(letter)}
              style={{
                padding: '12px 14px', borderRadius: '10px', textAlign: 'left',
                border: `2px solid ${border}`, background: bg, color: textColor,
                fontFamily: 'Exo 2, sans-serif', fontSize: '13px', cursor: submitted ? 'default' : 'pointer',
                transition: 'all 0.2s', lineHeight: 1.4,
              }}>
              <span style={{ fontFamily: 'Orbitron, monospace', fontWeight: 700, marginRight: '8px', fontSize: '11px' }}>
                {letter}
              </span>
              {opt.replace(`${letter}) `, '')}
            </button>
          )
        })}
      </div>

      <div style={{
        background: '#080812', borderRadius: '10px', padding: '12px 16px',
        marginBottom: '14px', minHeight: '44px',
        border: listening ? '1px solid #ef444444' : '1px solid #1f2937',
        transition: 'border 0.3s',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%',
            background: listening ? '#ef4444' : '#374151',
            boxShadow: listening ? '0 0 8px #ef4444' : 'none',
            animation: listening ? 'blink 1s infinite' : 'none',
          }} />
          <span style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'Orbitron, monospace', letterSpacing: '1px' }}>
            {listening ? 'LISTENING' : 'MIC OFF'}
          </span>
          {!supported && <span style={{ color: '#6b7280', fontSize: '11px' }}>— use Chrome for voice</span>}
        </div>
        <div style={{
          color: transcript ? '#f9fafb' : '#374151',
          fontFamily: 'Exo 2, sans-serif', fontSize: '14px',
          fontStyle: transcript ? 'normal' : 'italic',
        }}>
          {transcript || 'Shout your answer — A, B, C or D!'}
        </div>
      </div>

      {!submitted && (
        <button onClick={handleSubmit} disabled={!selected}
          style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: selected
              ? `linear-gradient(135deg, ${currentPlayerColor}, ${currentPlayerColor}bb)`
              : '#1f2937',
            color: selected ? '#000' : '#374151',
            fontFamily: 'Orbitron, monospace', fontWeight: 700, fontSize: '13px',
            letterSpacing: '2px', cursor: selected ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}>
          LOCK IN ANSWER
        </button>
      )}

      {result && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: result === 'correct' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
          borderRadius: '18px', backdropFilter: 'blur(3px)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '72px' }}>{result === 'correct' ? '✅' : '❌'}</div>
            <div style={{
              fontFamily: 'Orbitron, monospace', fontWeight: 900, fontSize: '28px',
              color: result === 'correct' ? '#22c55e' : '#ef4444',
              textShadow: `0 0 20px ${result === 'correct' ? '#22c55e' : '#ef4444'}`,
            }}>
              {result === 'correct' ? 'CORRECT!' : 'WRONG!'}
            </div>
            <div style={{ color: '#9ca3af', fontFamily: 'Exo 2, sans-serif', fontSize: '13px', marginTop: '6px' }}>
              Answer: {question?.a}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>
    </div>
  )
}