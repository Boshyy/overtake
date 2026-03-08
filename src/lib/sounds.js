const getCtx = () => {
  if (!window._audioCtx) window._audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return window._audioCtx
}

function beep({ frequency = 440, duration = 0.1, gain = 0.3, type = 'square' }) {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const vol = ac.createGain()
    osc.connect(vol)
    vol.connect(ac.destination)
    osc.type = type
    osc.frequency.setValueAtTime(frequency, ac.currentTime)
    vol.gain.setValueAtTime(gain, ac.currentTime)
    vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + duration)
  } catch (e) {}
}

// car sounds 
export function playVroom() {
  try {
    const ac = getCtx()
    const osc = ac.createOscillator()
    const vol = ac.createGain()
    osc.connect(vol)
    vol.connect(ac.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(80, ac.currentTime)
    osc.frequency.exponentialRampToValueAtTime(800, ac.currentTime + 1.0)
    osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 1.6)
    vol.gain.setValueAtTime(0.0, ac.currentTime)
    vol.gain.linearRampToValueAtTime(0.25, ac.currentTime + 0.1)
    vol.gain.linearRampToValueAtTime(0.3, ac.currentTime + 1.0)
    vol.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 1.8)
    osc.start(ac.currentTime)
    osc.stop(ac.currentTime + 1.8)
  } catch (e) {}
}

// 5,4,3,2,1 
export function playCountdownBeep(number) {
  if (number > 0) {
    beep({ frequency: 220, duration: 0.12, gain: 0.3, type: 'square' })
  } else {
    // GO! 
    beep({ frequency: 440, duration: 0.1, gain: 0.4, type: 'square' })
    setTimeout(() => beep({ frequency: 550, duration: 0.1, gain: 0.4, type: 'square' }), 100)
    setTimeout(() => beep({ frequency: 660, duration: 0.2, gain: 0.5, type: 'square' }), 200)
  }
}

// correct 
export function playCorrect() {
  beep({ frequency: 523, duration: 0.1, gain: 0.3, type: 'square' })
  setTimeout(() => beep({ frequency: 659, duration: 0.1, gain: 0.3, type: 'square' }), 100)
  setTimeout(() => beep({ frequency: 784, duration: 0.1, gain: 0.3, type: 'square' }), 200)
  setTimeout(() => beep({ frequency: 1046, duration: 0.2, gain: 0.35, type: 'square' }), 300)
}

// wrong 
export function playWrong() {
  beep({ frequency: 300, duration: 0.15, gain: 0.3, type: 'square' })
  setTimeout(() => beep({ frequency: 200, duration: 0.15, gain: 0.3, type: 'square' }), 150)
  setTimeout(() => beep({ frequency: 150, duration: 0.25, gain: 0.25, type: 'square' }), 300)
}