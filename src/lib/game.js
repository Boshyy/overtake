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
  await update(ref(db, `rooms/${code}`), {
    status: 'racing',
    questionPhase: 'active',
    questionStartTime: Date.now(),
  })
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
        await update(ref(db, `rooms/${code}/players/${leader.name}`), { position: newLeaderPos })
        advance += steal
      }
    }
  }

  const newPos = Math.min(100, (player.position || 0) + advance)
  const newScore = (player.score || 0) + (correct ? 1 : 0)

  await update(ref(db, `rooms/${code}/players/${playerName}`), {
    position: newPos,
    score: newScore,
  })

  if (newPos >= 100) {
    await update(ref(db, `rooms/${code}`), { status: 'finished', winner: playerName })
    return
  }

  await advanceTurn(code, room)
}

async function advanceTurn(code, room) {
  const playerNames = Object.keys(room.players || {})
  const nextPlayerIndex = ((room.currentPlayerIndex || 0) + 1) % playerNames.length
  const nextQuestionIndex = (room.currentQuestionIndex || 0) + 1

  const spawnPowerup = Math.random() < 0.25
  const puKeys = Object.keys(POWERUPS)
  const spawnedPU = spawnPowerup ? puKeys[Math.floor(Math.random() * puKeys.length)] : null

  if (spawnedPU) {
    const nextPlayer = playerNames[nextPlayerIndex]
    const currentPUs = room.players[nextPlayer]?.powerups || []
    if (currentPUs.length < 2) {
      await update(ref(db, `rooms/${code}/players/${nextPlayer}`), {
        powerups: [...currentPUs, spawnedPU]
      })
    }
  }

  await update(ref(db, `rooms/${code}`), {
    currentPlayerIndex: nextPlayerIndex,
    currentQuestionIndex: nextQuestionIndex,
    questionPhase: 'active',
    questionStartTime: Date.now(),
    roundNumber: nextPlayerIndex === 0 ? (room.roundNumber || 1) + 1 : (room.roundNumber || 1),
  })
}

export async function usePowerup(code, playerName, powerupId) {
  const snap = await get(ref(db, `rooms/${code}/players/${playerName}`))
  const player = snap.val()
  const idx = (player.powerups || []).indexOf(powerupId)
  if (idx > -1) {
    const arr = [...(player.powerups || [])]
    arr.splice(idx, 1)
    await update(ref(db, `rooms/${code}/players/${playerName}`), { powerups: arr })
  }
}