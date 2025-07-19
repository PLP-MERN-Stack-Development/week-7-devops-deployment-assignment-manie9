import React, { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import toast from 'react-hot-toast'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  sendMessage: (roomId: string, content: string, replyTo?: string) => void
  joinRoom: (roomId: string) => void
  leaveRoom: (roomId: string) => void
  setTyping: (roomId: string, isTyping: boolean) => void
  reactToMessage: (messageId: string, emoji: string) => void
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

interface SocketProviderProps {
  children: React.ReactNode
}

export const SocketProvider: React.FC<SocketProviderProps> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const { user, token } = useAuthStore()
  const { 
    addMessage, 
    setUserOnline, 
    setUserTyping, 
    updateMessage,
    setCurrentRoom,
    currentRoom 
  } = useChatStore()

  useEffect(() => {
    if (user && token) {
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
      })

      newSocket.on('connect', () => {
        console.log('Connected to server')
        setIsConnected(true)
      })

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error)
        toast.error('Failed to connect to chat server')
      })

      // Message events
      newSocket.on('newMessage', (data) => {
        addMessage(data.message)
      })

      // User status events
      newSocket.on('userStatusUpdate', (data) => {
        setUserOnline(data.userId, data.status === 'online')
      })

      // Typing events
      newSocket.on('userTyping', (data) => {
        if (data.userId !== user.id) {
          setUserTyping(data.roomId || currentRoom?._id || '', data.userId, data.username, data.isTyping)
        }
      })

      // Room events
      newSocket.on('userJoinedRoom', (data) => {
        console.log('User joined room:', data)
      })

      newSocket.on('userLeftRoom', (data) => {
        console.log('User left room:', data)
      })

      // Message reaction events
      newSocket.on('messageReactionUpdate', (data) => {
        updateMessage(data.messageId, { reactions: data.reactions })
      })

      // Error handling
      newSocket.on('error', (data) => {
        toast.error(data.message)
      })

      setSocket(newSocket)

      return () => {
        newSocket.close()
      }
    }
  }, [user, token, addMessage, setUserOnline, setUserTyping, updateMessage, currentRoom])

  const sendMessage = (roomId: string, content: string, replyTo?: string) => {
    if (socket && isConnected) {
      socket.emit('sendMessage', {
        roomId,
        content,
        replyTo
      })
    }
  }

  const joinRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('joinRoom', { roomId })
    }
  }

  const leaveRoom = (roomId: string) => {
    if (socket && isConnected) {
      socket.emit('leaveRoom', { roomId })
    }
  }

  const setTyping = (roomId: string, isTyping: boolean) => {
    if (socket && isConnected) {
      socket.emit('typing', { roomId, isTyping })
    }
  }

  const reactToMessage = (messageId: string, emoji: string) => {
    if (socket && isConnected) {
      socket.emit('reactToMessage', { messageId, emoji })
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    sendMessage,
    joinRoom,
    leaveRoom,
    setTyping,
    reactToMessage
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}