import { ref, set, update, get, onValue, off } from 'firebase/database'
import { db } from './firebase.js'
import { generateRoomCode, BASE_ADVANCE, POWERUPS } from './constants.js'

export async function createRoom(hostName, questions) {
  const code = generateRoomCode()
  const roomRef = ref(db, `rooms/${code}`)
  await set(roomRef, {
    code,
    status: 'lobby',
    hostId: hostName,
    createdAt: Date.now(),
    questions,
    currentQuestionIndex: 0,
    currentPlayerIndex: 0,
    roundNumber: 1,
    questionPhase: 'waiting',
    questionStartTime: null,
    players: {},
    log: [],
  })
  return code
}

export async function joinRoom(code, playerName) {
  const roomRef = ref(db, `rooms/${code}`)
  const snap = await get(roomRef)
  if (!snap.exists()) throw new Error('Room not found')
  const room = snap.val()
  if (room.status !== 'lobby') throw new Error('Game already started')

  const playersCount = Object.keys(room.players || {}).length
  if (playersCount >= 4) throw new Error('Room is full')

  const playerRef = ref(db, `rooms/${code}/players/${playerName}`)
  await set(playerRef, {
    name: playerName,
    position: 0,
    score: 0,
    powerups: [],
    ready: false,
    slotIndex: playersCount,
    connected: true,
  })
  return room
}

export async function setReady(code, playerName) {
  await update(ref(db, `rooms/${code}/players/${playerName}`), { ready: true })
}

export async function startGame(code) {
  await update(ref(db, `rooms/${code}`), { status: 'countdown' })
  setTimeout(async () => {
    await update(ref(db, `rooms/${code}`), {
      status: 'racing',
      questionPhase: 'active',
      questionStartTime: Date.now(),
    })
  }, 3000)
}

export function subscribeRoom(code, cb) {
  const roomRef = ref(db, `rooms/${code}`)
  onValue(roomRef, snap => cb(snap.val()))
  return () => off(roomRef)
}

export async function submitAnswer(code, playerName, correct, activePowerup) {
  const snap = await get(ref(db, `rooms/${code}`))
  const room = snap.val()
  const players = room.players || {}
  const player = players[playerName]
  let advance = 0

  if (correct) {
    advance = BASE_ADVANCE + Math.floor(Math.random() * 6)
    if (activePowerup === 'DRS') advance = Math.round(advance * 2)

    if (activePowerup === 'SLIP') {
      const others = Object.values(players).filter(p => p.name !== playerName)
      const leader = others.sort((a, b) => b.position - a.position)[0]
      if (leader) {
        const steal = Math.round(advance * 0.5)
        const newLeaderPos = Math.max(0, leader.position - steal)
        await update(ref(db, `rooms/${code}/players/${leader.nam