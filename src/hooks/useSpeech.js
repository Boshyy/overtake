import { useState, useEffect, useRef, useCallback } from 'react'

export function useSpeech() {
  const [transcript, setTranscript] = useState('')
  const [listening, setListening] = useState(false)
  const [supported, setSupported] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    setSupported(!!SR)
  }, [])

  const start = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return
    setTranscript('')
    const r = new SR()
    r.continuous = true
    r.interimResults = true
    r.lang = 'en-GB'
    r.onstart = () => setListening(true)
    r.onend = () => setListening(false)
    r.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join(' ')
      setTranscript(t)
    }
    recognitionRef.current = r
    try { r.start() } catch (e) { console.warn('SR start failed', e) }
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch (e) {}
    }
  }, [])

  const reset = useCallback(() => {
    stop()
    setTranscript('')
  }, [stop])

  return { transcript, listening, supported, start, stop, reset }
}