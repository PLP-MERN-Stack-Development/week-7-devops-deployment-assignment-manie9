import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import Sidebar from '../components/Sidebar'
import ChatRoom from '../components/ChatRoom'
import WelcomeScreen from '../components/WelcomeScreen'

const Chat: React.FC = () => {
  const { fetchRooms, currentRoom } = useChatStore()
  const { isConnected } = useSocket()

  React.useEffect(() => {
    fetchRooms()
  }, [fetchRooms])

  return (
    <div className="flex h-screen bg-gray-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        {/* Connection status */}
        {!isConnected && (
          <div className="bg-yellow-600 text-white px-4 py-2 text-sm text-center">
            Connecting to chat server...
          </div>
        )}
        
        <Routes>
          <Route 
            path="/" 
            element={currentRoom ? <ChatRoom /> : <WelcomeScreen />} 
          />
          <Route 
            path="/room/:roomId" 
            element={<ChatRoom />} 
          />
        </Routes>
      </div>
    </div>
  )
}

export default Chat