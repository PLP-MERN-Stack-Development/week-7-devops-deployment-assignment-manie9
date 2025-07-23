import { create } from 'zustand'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Room, Message, ChatState } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export const useChatStore = create<ChatState>((set) => ({
  rooms: [],
  currentRoom: null,
  messages: {},
  onlineUsers: {},
  typingUsers: {},
  isLoading: false,

  fetchRooms: async () => {
    set({ isLoading: true })
    try {
      const response = await axios.get(`${API_URL}/api/rooms`)
      set({ rooms: response.data.rooms, isLoading: false })
    } catch (error: any) {
      console.error('Failed to fetch rooms:', error)
      toast.error('Failed to load rooms')
      set({ isLoading: false })
    }
  },

  createRoom: async (roomData: Partial<Room>) => {
    try {
      const response = await axios.post(`${API_URL}/api/rooms`, roomData)
      const newRoom = response.data.room
      
      set(state => ({
        rooms: [newRoom, ...state.rooms]
      }))
      
      toast.success('Room created successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create room'
      toast.error(message)
      return false
    }
  },

  joinRoom: async (roomId: string, password?: string) => {
    try {
      const response = await axios.post(`${API_URL}/api/rooms/${roomId}/join`, {
        password
      })
      
      const updatedRoom = response.data.room
      
      set(state => ({
        rooms: state.rooms.map(room => 
          room._id === roomId ? updatedRoom : room
        )
      }))
      
      toast.success('Joined room successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to join room'
      toast.error(message)
      return false
    }
  },

  leaveRoom: async (roomId: string) => {
    try {
      await axios.post(`${API_URL}/api/rooms/${roomId}/leave`)
      
      set(state => ({
        rooms: state.rooms.filter(room => room._id !== roomId),
        currentRoom: state.currentRoom?._id === roomId ? null : state.currentRoom
      }))
      
      toast.success('Left room successfully!')
      return true
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to leave room'
      toast.error(message)
      return false
    }
  },

  setCurrentRoom: (room: Room | null) => {
    set({ currentRoom: room })
  },

  fetchMessages: async (roomId: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/messages/${roomId}`)
      
      set(state => ({
        messages: {
          ...state.messages,
          [roomId]: response.data.messages
        }
      }))
    } catch (error: any) {
      console.error('Failed to fetch messages:', error)
      toast.error('Failed to load messages')
    }
  },

  addMessage: (message: Message) => {
    set(state => ({
      messages: {
        ...state.messages,
        [message.room]: [
          ...(state.messages[message.room] || []),
          message
        ]
      }
    }))
  },

  updateMessage: (messageId: string, updates: Partial<Message>) => {
    set(state => {
      const newMessages = { ...state.messages }
      
      Object.keys(newMessages).forEach(roomId => {
        newMessages[roomId] = newMessages[roomId].map(message =>
          message._id === messageId ? { ...message, ...updates } : message
        )
      })
      
      return { messages: newMessages }
    })
  },

  deleteMessage: (messageId: string) => {
    set(state => {
      const newMessages = { ...state.messages }
      
      Object.keys(newMessages).forEach(roomId => {
        newMessages[roomId] = newMessages[roomId].filter(
          message => message._id !== messageId
        )
      })
      
      return { messages: newMessages }
    })
  },

  setUserOnline: (userId: string, isOnline: boolean) => {
    set(state => ({
      onlineUsers: {
        ...state.onlineUsers,
        [userId]: isOnline
      }
    }))
  },

  setUserTyping: (roomId: string, _userId: string, username: string, isTyping: boolean) => {
    set(state => {
      const roomTypingUsers = state.typingUsers[roomId] || []
      
      let newTypingUsers: string[]
      if (isTyping) {
        newTypingUsers = roomTypingUsers.includes(username) 
          ? roomTypingUsers 
          : [...roomTypingUsers, username]
      } else {
        newTypingUsers = roomTypingUsers.filter(user => user !== username)
      }
      
      return {
        typingUsers: {
          ...state.typingUsers,
          [roomId]: newTypingUsers
        }
      }
    })
  },

  clearMessages: (roomId: string) => {
    set(state => {
      const newMessages = { ...state.messages }
      delete newMessages[roomId]
      return { messages: newMessages }
    })
  },

  reset: () => {
    set({
      rooms: [],
      currentRoom: null,
      messages: {},
      onlineUsers: {},
      typingUsers: {},
      isLoading: false
    })
  }
}))