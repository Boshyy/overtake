export const TRACK_LENGTH = 100
export const BASE_ADVANCE = 12
export const QUESTION_TIME = 7

export const PLAYER_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#ec4899']
export const PLAYER_CAR_COLORS = ['#ff6b00', '#2563eb', '#16a34a', '#db2777']
export const CAR_LABELS = ['🅰', '🅱', '🅲', '🅳']

export const POWERUPS = {
  DRS:    { id: 'DRS',    emoji: '🟣', name: 'DRS BOOST',   desc: 'Doubles your advancement',        color: '#a855f7' },
  SAFETY: { id: 'SAFETY', emoji: '🟡', name: 'SAFETY CAR',  desc: '+4 seconds to answer',            color: '#eab308' },
  SLIP:   { id: 'SLIP',   emoji: '🔴', name: 'SLIPSTREAM',  desc: "Steal 50% of leader's next gain", color: '#ef4444' },
}

export function generateRoomCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

export function getRankedPlayers(players) {
  return [...players].sort((a, b) => b.position - a.position)
}

export function getTrackPosition(pct) {
  const angle = (pct / 100) * 2 * Math.PI - Math.PI / 2
  const x = 50 + 38 * Math.cos(angle)
  const y = 50 + 22 * Math.sin(angle)
  return { x, y }
}

export function ordinal(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}