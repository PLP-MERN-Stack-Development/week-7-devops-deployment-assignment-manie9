import React from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import { Message } from '../types'
import { Download, Eye } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

interface MessageListProps {
  messages: Message[]
}

export default function MessageList({ messages }: MessageListProps) {
  const { user } = useAuthStore()
  const { typingUsers, currentRoom } = useChatStore()
  const { reactToMessage } = useSocket()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState<string | null>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleReaction = (messageId: string, emoji: string) => {
    reactToMessage(messageId, emoji)
    setShowEmojiPicker(null)
  }

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm')
    } else if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`
    } else {
      return format(date, 'MMM dd, HH:mm')
    }
  }

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: Record<string, Message[]> = {}
    
    messages.forEach(message => {
      const date = new Date(message.createdAt)
      let dateKey: string
      
      if (isToday(date)) {
        dateKey = 'Today'
      } else if (isYesterday(date)) {
        dateKey = 'Yesterday'
      } else {
        dateKey = format(date, 'MMMM dd, yyyy')
      }
      
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(message)
    })
    
    return groups
  }

  const messageGroups = groupMessagesByDate(messages)
  const roomTypingUsers = currentRoom ? typingUsers[currentRoom._id] || [] : []

  const renderFileMessage = (message: Message) => {
    if (message.messageType === 'image' && message.fileUrl) {
      return (
        <div className="mt-2">
          <img
            src={`${import.meta.env.VITE_API_URL}${message.fileUrl}`}
            alt={message.fileName}
            className="max-w-xs rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}${message.fileUrl}`, '_blank')}
          />
        </div>
      )
    } else if (message.messageType === 'file' && message.fileUrl) {
      return (
        <div className="mt-2 p-3 bg-black/20 rounded-lg flex items-center space-x-3">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <Download className="h-4 w-4 text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{message.fileName}</p>
            <p className="text-xs opacity-75">
              {message.fileSize ? `${(message.fileSize / 1024 / 1024).toFixed(2)} MB` : 'File'}
            </p>
          </div>
          <button
            onClick={() => window.open(`${import.meta.env.VITE_API_URL}${message.fileUrl}`, '_blank')}
            className="p-2 text-blue-400 hover:text-blue-300 transition-colors"
            title="Download file"
          >
            <Eye className="h-4 w-4" />
          </button>
        </div>
      )
    }
    return null
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4 h-full">
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">No messages yet</p>
            <p className="text-sm">Start a conversation!</p>
          </div>
        </div>
      ) : (
        messages.map((message, index) => {
          const showAvatar = index === 0 || messages[index - 1].sender._id !== message.sender._id
          const isOwn = message.sender._id === user?.id

          return (
            <div
              key={message._id}
              className={`flex items-start space-x-3 ${isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div className={`w-8 h-8 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                {!isOwn && (
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                {/* Sender name and time */}
                {showAvatar && !isOwn && (
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-medium text-sm text-gray-900 dark:text-white">
                      {message.sender.username}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(message.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}

                <div className={`relative group ${isOwn ? 'ml-auto' : ''}`}>
                  <div
                    className={`
                      px-4 py-2 rounded-2xl max-w-xs lg:max-w-md break-words
                      ${isOwn
                        ? 'bg-blue-500 text-white ml-auto'
                        : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-600'
                      }
                    `}
                  >
                    {renderFileMessage(message)}
                    <p className="text-sm">{message.content}</p>
                  </div>

                  {/* Message reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {message.reactions.map((reaction, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleReaction(message._id, reaction.emoji)}
                          className={`
                            px-2 py-1 rounded-full text-xs flex items-center space-x-1
                            ${reaction.user._id === user?.id
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }
                            hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors
                          `}
                        >
                          <span>{reaction.emoji}</span>
                          <span>1</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Message actions */}
                  <div className="absolute right-0 top-0 -mt-2 -mr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                      className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                    >
                      😊
                    </button>
                  </div>

                  {/* Emoji picker */}
                  {showEmojiPicker === message._id && (
                    <div className="absolute top-full right-0 mt-2 z-50">
                      <EmojiPicker
                        onEmojiSelect={(emoji) => {
                          handleReaction(message._id, emoji)
                          setShowEmojiPicker(null)
                        }}
                        onClose={() => setShowEmojiPicker(null)}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}