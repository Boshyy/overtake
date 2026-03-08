import { useState, useEffect, useRef } from 'react'
import { subscribeRoom } from './lib/game.js'
import Home from './pages/Home.jsx'
import Lobby from './pages/Lobby.jsx'
import Race from './pages/Race.jsx'
import Finish from './pages/Finish.jsx'

export default function App() {
  const [gameState, setGameState] = useState({
    screen: 'home',
    roomCode: null,
    playerName: null,
    isHost: false,
    finishData: null,
  })

  useEffect(() => {
    if (!gameState.roomCode) return
    const unsub = subscribeRoom(gameState.roomCode, (room) => {
      if (!room) return
      if (room.status === 'racing' || room.status === 'countdown') {
        setGameState(prev => {
          if (prev.screen === 'lobby' || prev.screen === 'home') return { ...prev, screen: 'race' }
          return prev
        })
      }
      if (room.status === 'finished') {
        setGameState(prev => ({
          ...prev,
          screen: 'finish',
          finishData: { winner: room.winner, players: Object.values(room.players || {}) }
        }))
      }
    })
    return unsub
  }, [gameState.roomCode])

  const handleEnterGame = (code, name, host) => {
    console.log('handleEnterGame called with code:', code)
    setGameState({ screen: 'lobby', roomCode: code, playerName: name, isHost: host, finishData: null })
  }

  const handleFinish = (winner, players) => {
    setGameState(prev => ({ ...prev, screen: 'finish', finishData: { winner, players } }))
  }

  const handlePlayAgain = () => {
    setGameState({ screen: 'home', roomCode: null, playerName: null, isHost: false, finishData: null })
  }

  const { screen, roomCode, playerName, isHost, finishData } = gameState

  if (screen === 'home') return <Home onEnterGame={handleEnterGame} />
  if (screen === 'lobby') return <Lobby roomCode={roomCode} playerName={playerName} isHost={isHost} onStartRace={() => setGameState(prev => ({ ...prev, screen: 'race' }))} />
  if (screen === 'race') return <Race roomCode={roomCode} playerName={playerName} onFinish={handleFinish} />
  if (screen === 'finish') return <Finish winner={finishData?.winner} players={finishData?.players || []} onPlayAgain={handlePlayAgain} />
  return null
}