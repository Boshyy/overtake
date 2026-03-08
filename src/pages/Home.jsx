import { useState, useEffect, useRef } from 'react'
import { createRoom, joinRoom } from '../lib/game.js'
import { generateQuestionsFromText, extractTextFromPDF } from '../lib/ai.js'

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
  const mounted = useMount()

  const handlePDF = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setPdfFile(file)
    setGeneratingQ(true)
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
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body, #root { min-height: 100vh; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; } to { opacity: 1; }
        }
        @keyframes revealTitle {
          0%   { opacity: 0; letter-spacing: 16px; }
          100% { opacity: 1; letter-spacing: 2px; }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-16px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        input::placeholder { color: #5B514F; font-style: italic; }
        input:focus { outline: none; border-color: #BB7780 !important; }
        .back-btn {
          background: none; border: none; color: #5B514F;
          cursor: pointer; font-family: 'Arena', sans-serif;
          font-size: 13px; letter-spacing: 4px; padding: 0;
          transition: color 0.2s; text-transform: uppercase;
        }
        .back-btn:hover { color: #BE9F7E; }
      `}</style>

      {/* Checkered top */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0,
        height: "24px", zIndex: 100,
        backgroundImage: `repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`,
        backgroundSize: "24px 24px",
      }} />

      {/* Checkered bottom */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        height: "24px", zIndex: 100,
        backgroundImage: `repeating-conic-gradient(${C.cream} 0% 25%, ${C.blood} 0% 50%)`,
        backgroundSize: "24px 24px",
        transform: "scaleY(-1)",
      }} />

      {/* Background */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        background: `radial-gradient(ellipse at 50% 40%, #1a0a08 0%, ${C.darkest} 70%)`,
      }} />

      {/* Side stripes */}
      <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity: 0.5, zIndex: 1 }} />
      <div style={{ position: "fixed", right: 0, top: 0, bottom: 0, width: "3px", background: `linear-gradient(to bottom, transparent, ${C.blood}, transparent)`, opacity: 0.5, zIndex: 1 }} />

      {/* Content */}
      <div style={{
        width: "100%", maxWidth: "400px",
        padding: "60px 20px",
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        position: "relative", zIndex: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>

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

            {/* Room code */}
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
              disabled={loading}
            >
              {loading ? '...' : mode === 'create' ? 'Create & Enter Lobby' : 'Join Race'}
            </BigButton>
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