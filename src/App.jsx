import { useState, useEffect } from 'react'
import { subscribeRoom } from './lib/game.js'
import Home from './pages/Home.jsx'
import Lobby from './pages/Lobby.jsx'
import Race from './pages/Race.jsx'
import Finish from './pages/Finish.jsx'

export default function App() {
  const [screen, setScreen] = useState('home')
  const [roomCode, setRoomCode] = useState(null)
  const [playerName, setPlayerName] = useState(null)
  const [isHost, setIsHost] = useState(false)
  const [finishData, setFinishData] = useState(null)

  useEffect(() => {
    if (!roomCode) return
    const unsub = subscribeRoom(roomCode, (room) => {
      if (!room) return
      if (room.status === 'racing' || room.status === 'countdown') {
        setScreen('race')
      }
      if (room.status === 'finished') {
        setFinishData({ winner: room.winner, players: Object.values(room.players || {}) })
        setScreen('finish')
      }
    })
    return unsub
  }, [roomCode])

  const handleEnterGame = (code, name, host) => {
    setRoomCode(code)
    setPlayerName(name)
    setIsHost(host)
    setScreen('lobby')
  }

  const handleFinish = (winner, players) => {
    setFinishData({ winner, players })
    setScreen('finish')
  }

  const handlePlayAgain = () => {
    setRoomCode(null)
    setPlayerName(null)
    setIsHost(false)
    setFinishData(null)
    setScreen('home')
  }

  if (screen === 'home') return <Home onEnterGame={handleEnterGame} />
  if (screen === 'lobby') return <Lobby roomCode={roomCode} playerName={playerName} isHost={isHost} />
  if (screen === 'race') return <Race roomCode={roomCode} playerName={playerName} onFinish={handleFinish} />
  if (screen === 'finish') return <Finish winner={finishData?.winner} players={finishData?.players || []} onPlayAgain={handlePlayAgain} />
  return null
}