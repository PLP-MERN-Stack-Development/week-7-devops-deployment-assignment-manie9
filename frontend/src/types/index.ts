export interface User {
  id: string
  username: string
  email: string
  avatar: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: string
}

export interface Room {
  _id: string
  name: string
  description: string
  isPrivate: boolean
  isGeneral?: boolean
  password?: string
  creator: {
    _id: string
    username: string
    avatar: string
  }
  members: Array<{
    user: {
      _id: string
      username: string
      avatar: string
      status: string
    }
    joinedAt: string
    role: 'admin' | 'moderator' | 'member'
  }>
  maxMembers: number
  tags: string[]
  lastActivity: string
  createdAt: string
  updatedAt: string
}

export interface Message {
  _id: string
  content: string
  sender: {
    _id: string
    username: string
    avatar: string
  }
  room: string
  messageType: 'text' | 'image' | 'file' | 'system'
  fileUrl?: string
  fileName?: string
  fileSize?: number
  isEdited: boolean
  editedAt?: string
  replyTo?: {
    _id: string
    content: string
    sender: {
      _id: string
      username: string
    }
  }
  reactions: Array<{
    user: {
      _id: string
      username: string
    }
    emoji: string
    createdAt: string
  }>
  readBy: Array<{
    user: string
    readAt: string
  }>
  createdAt: string
  updatedAt: string
}

export interface ChatState {
  rooms: Room[]
  currentRoom: Room | null
  messages: Record<string, Message[]>
  onlineUsers: Record<string, boolean>
  typingUsers: Record<string, string[]>
  isLoading: boolean
  fetchRooms: () => Promise<void>
  createRoom: (roomData: Partial<Room>) => Promise<boolean>
  joinRoom: (roomId: string, password?: string) => Promise<boolean>
  leaveRoom: (roomId: string) => Promise<boolean>
  setCurrentRoom: (room: Room | null) => void
  fetchMessages: (roomId: string) => Promise<void>
  addMessage: (message: Message) => void
  updateMessage: (messageId: string, updates: Partial<Message>) => void
  deleteMessage: (messageId: string) => void
  setUserOnline: (userId: string, isOnline: boolean) => void
  setUserTyping: (roomId: string, userId: string, username: string, isTyping: boolean) => void
  clearMessages: (roomId: string) => void
  reset: () => void
}