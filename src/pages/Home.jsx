import { useState, useEffect, useRef } from 'react'
import { createRoom, joinRoom } from '../lib/game.js'
import { POWERUPS } from '../lib/constants.js'
import { generateQuestionsFromText, extractTextFromPDF } from '../lib/ai.js'

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

function useMount() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setTimeout(() => setMounted(true), 50) }, [])
  return mounted
}

function BigButton({ children, onClick, primary = false, disabled = false }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        padding: "14px 24px",
        borderRadius: "4px",
        border: `1.5px solid ${primary ? C.pink : C.charcoal}`,
        background: disabled ? C.charcoal : hovered
          ? primary ? C.pink : "#2a1010"
          : primary ? `${C.pink}bb` : "transparent",
        color: disabled ? C.warmGrey : primary ? C.cream : C.tan,
        fontFamily: "'Arena', sans-serif",
        fontWeight: 400,
        fontSize: "18px",
        letterSpacing: "5px",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s ease",
        transform: hovered && !disabled ? "translateY(-1px)" : "translateY(0)",
        boxShadow: hovered && !disabled ? `0 6px 24px ${primary ? C.pink : C.blood}33` : "none",
        textTransform: "uppercase",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: 0,
        left: hovered ? "120%" : "-60%",
        width: "40%", height: "100%",
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)",
        transition: "left 0.4s ease",
        pointerEvents: "none",
      }} />
      {children}
    </button>
  )
}

export default function Home({ onEnterGame }) {
  const [mode, setMode] = useState(null)
  const [playerName, setPlayerName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [pdfFile, setPdfFile] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [generatingQ, setGeneratingQ] = useState(false)
  const fileRef = useRef()

  const handlePDF = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    setGeneratingQ(true)
    setError('')
    try {
      const base64 = await new Promise((res, rej) => {
        const reader = new FileReader()
        reader.onload = () => res(reader.result.split(',')[1])
        reader.onerror = rej
        reader.readAsDataURL(file)
      })
      const text = await extractTextFromPDF(base64)
      const qs = await generateQuestionsFromText(text)
      setQuestions(qs)
    } catch (e) {
      setError('Could not process PDF. Using sample questions.')
      setQuestions(SAMPLE_QUESTIONS)
    }
    setGeneratingQ(false)
  }

  const handleCreate = async () => {
    if (!playerName.trim()) { setError('Enter your name'); return }
    setLoading(true); setError('')
    try {
      const code = await createRoom(playerName.trim(), questions || SAMPLE_QUESTIONS)
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
      minHeight: "100vh",
      width: "100%",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
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
          OVER<span style={{ color: '#f97316' }}>TAKE</span>
        </h1>
        <div style={{ color: '#4b5563', fontFamily: 'Exo 2, sans-serif', marginTop: '8px', fontSize: '14px' }}>
          Study hard. Race harder.
        </div>
      </div>

        {/* LANDING */}
        {!mode && (
          <>
            <div style={{
              textAlign: "center", marginBottom: "10px",
              animation: "revealTitle 0.9s cubic-bezier(.22,1,.36,1) 0.15s both",
            }}>
              <span style={{
                fontFamily: "'Macqueen', cursive",
                fontSize: "clamp(3.5rem, 16vw, 5.5rem)",
                letterSpacing: "2px",
                color: C.cream,
                textShadow: `0 0 40px ${C.blood}55, 0 2px 0 ${C.deepRed}`,
              }}>OVER</span>
              <span style={{
                fontFamily: "'Macqueen', cursive",
                fontSize: "clamp(3.5rem, 16vw, 5.5rem)",
                letterSpacing: "2px",
                color: C.blood,
                textShadow: `0 0 40px ${C.blood}88, 0 2px 0 ${C.deepRed}`,
              }}>TAKE</span>
            </div>

            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              width: "100%", margin: "4px 0 32px",
              animation: "fadeIn 0.5s 0.4s ease both",
            }}>
              <div style={{ flex: 1, height: "1px", background: `linear-gradient(to right, transparent, ${C.charcoal})` }} />
              <span style={{
                fontFamily: "'Arena', sans-serif",
                fontSize: "9px", letterSpacing: "4px",
                color: C.charcoal, fontWeight: 300,
                whiteSpace: "nowrap",
              }}>REVISION IN THE FAST LANE</span>
              <div style={{ flex: 1, height: "1px", background: `linear-gradient(to left, transparent, ${C.charcoal})` }} />
            </div>

            <div style={{
              display: "flex", flexDirection: "column", gap: "12px",
              width: "100%",
              animation: "fadeUp 0.5s 0.4s ease both",
            }}>
              <BigButton primary onClick={() => setMode('create')}>
                Create Room
              </BigButton>
              <BigButton onClick={() => setMode('join')}>
                Join Room
              </BigButton>
            </div>
          </>
        )}

        {/* FORM */}
        {mode && (
          <div style={{ animation: "slideIn 0.3s ease both", width: "100%" }}>
            <button className="back-btn" onClick={() => { setMode(null); setError('') }}>
              ← Back
            </button>

            <div style={{ textAlign: "center", margin: "20px 0 28px" }}>
              <div style={{
                fontFamily: "'Macqueen', cursive",
                fontSize: "2rem", letterSpacing: "3px",
                color: C.cream,
                textShadow: `0 0 20px ${C.blood}44`,
              }}>
                {mode === 'create' ? 'CREATE ROOM' : 'JOIN ROOM'}
              </div>
              <div style={{
                height: "1px", marginTop: "10px",
                background: `linear-gradient(90deg, transparent, ${C.tan}55, transparent)`,
              }} />
            </div>

            {/* Name */}
            <div style={{ marginBottom: "14px" }}>
              <label style={labelStyle}>DRIVER NAME</label>
              <input
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                placeholder="Enter your racing name"
                style={inputStyle}
              />
            </div>

            {mode === 'create' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={labelStyle}>REVISION NOTES (PDF)</label>
                <div
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: `2px dashed ${pdfFile ? '#22c55e' : '#374151'}`,
                    borderRadius: '12px', padding: '20px', textAlign: 'center',
                    cursor: 'pointer', background: '#080812',
                  }}>
                  {generatingQ ? (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</div>
                      <div style={{ color: '#f97316', fontFamily: 'Orbitron, monospace', fontSize: '12px' }}>GENERATING QUESTIONS...</div>
                    </div>
                  ) : questions ? (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>✅</div>
                      <div style={{ color: '#22c55e', fontFamily: 'Exo 2, sans-serif', fontSize: '13px' }}>
                        {pdfFile?.name} — {questions.length} questions ready
                      </div>
                      <div style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px' }}>Click to change</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '28px', marginBottom: '8px' }}>📄</div>
                      <div style={{ color: '#9ca3af', fontFamily: 'Exo 2, sans-serif', fontSize: '13px' }}>
                        Click to upload PDF notes
                      </div>
                      <div style={{ color: '#4b5563', fontSize: '11px', marginTop: '4px' }}>
                        AI will generate quiz questions automatically
                      </div>
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handlePDF} style={{ display: 'none' }} />
                </div>
                {!pdfFile && !generatingQ && (
                  <div style={{ color: '#4b5563', fontSize: '11px', fontFamily: 'Exo 2, sans-serif', marginTop: '8px', textAlign: 'center' }}>
                    No PDF? Sample questions will be used.
                  </div>
                )}
              </div>
            )}

            {mode === 'join' && (
              <div style={{ marginBottom: "14px" }}>
                <label style={labelStyle}>ROOM CODE</label>
                <input
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="A1B2C3"
                  maxLength={6}
                  style={{
                    ...inputStyle,
                    fontFamily: "'Arena', sans-serif",
                    fontSize: "22px",
                    letterSpacing: "10px",
                    textAlign: "center",
                    color: C.pink,
                  }}
                />
              </div>
            )}

            {/* PDF upload */}
            {mode === 'create' && (
              <div style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>REVISION NOTES</label>
                <div
                  onClick={() => fileRef.current.click()}
                  style={{
                    border: `1px dashed ${pdfFile ? C.pink : C.deepRed}`,
                    borderRadius: "3px", padding: "20px",
                    textAlign: "center", cursor: "pointer",
                    background: "#0a0303",
                    transition: "border-color 0.2s",
                  }}>
                  {generatingQ ? (
                    <>
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>⚡</div>
                      <div style={{ fontFamily: "'Arena', sans-serif", color: C.pink, fontSize: "12px", letterSpacing: "3px" }}>GENERATING QUESTIONS...</div>
                    </>
                  ) : questions ? (
                    <>
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>✅</div>
                      <div style={{ fontFamily: "'Arena', sans-serif", color: C.pink, fontSize: "12px", letterSpacing: "2px" }}>
                        {pdfFile?.name} — {questions.length} questions ready
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>📄</div>
                      <div style={{ fontFamily: "'Arena', sans-serif", color: C.warmGrey, fontSize: "12px", letterSpacing: "3px" }}>UPLOAD PDF</div>
                      <div style={{ fontFamily: "'Arena', sans-serif", color: C.charcoal, fontSize: "11px", marginTop: "3px", fontStyle: "italic" }}>AI generates your questions</div>
                    </>
                  )}
                  <input ref={fileRef} type="file" accept=".pdf" onChange={handlePDF} style={{ display: "none" }} />
                </div>
                {!pdfFile && !generatingQ && (
                  <div style={{ color: C.charcoal, fontSize: "11px", fontFamily: "'Arena', sans-serif", marginTop: "6px", textAlign: "center", fontStyle: "italic" }}>
                    No PDF? Sample questions will be used.
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{
                color: C.blood, fontFamily: "'Arena', sans-serif",
                fontSize: "13px", marginBottom: "14px", letterSpacing: "1px",
              }}>
                {error}
              </div>
            )}

            <BigButton
              primary
              onClick={mode === 'create' ? handleCreate : handleJoin}
              disabled={loading || generatingQ}
              style={btnStyle(loading || generatingQ ? '#374151' : '#f97316')}>
              {loading ? '...' : generatingQ ? 'GENERATING...' : mode === 'create' ? '🏁 Create & Enter Lobby' : '🚗 Join Race'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

const labelStyle = {
  display: "block", fontSize: "9px", letterSpacing: "4px",
  color: "#5B514F", marginBottom: "7px",
  fontFamily: "'Arena', sans-serif",
}

const inputStyle = {
  width: "100%", padding: "11px 16px",
  background: "#0a0303",
  border: "1px solid #761212",
  borderRadius: "3px", color: "#F2E8D9",
  fontFamily: "'Arena', sans-serif",
  fontSize: "16px", letterSpacing: "1px",
  boxSizing: "border-box",
}