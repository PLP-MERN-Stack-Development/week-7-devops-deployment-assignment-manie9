import React from 'react'
import { format, isToday, isYesterday } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import { Message } from '../stores/chatStore'
import { MoreVertical, Reply, Smile, Download, Eye } from 'lucide-react'
import EmojiPicker from './EmojiPicker'

interface MessageListProps {
  messages: Message[]
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { user } = useAuthStore()
  const { typingUsers, currentRoom } = useChatStore()
  const { reactToMessage } = useSocket()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState<string | null>(null)
  const [replyingTo, setReplyingTo] = React.useState<Message | null>(null)

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
    const groups: { [key: string]: Message[] } = {}
    
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
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {Object.entries(messageGroups).map(([dateKey, dateMessages]) => (
        <div key={dateKey}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-6">
            <div className="px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-sm text-gray-300 border border-white/20">
              {dateKey}
            </div>
          </div>

          {/* Messages for this date */}
          <div className="space-y-4">
            {dateMessages.map((message, index) => {
              const isOwnMessage = message.sender._id === user?.id
              const messageTime = formatMessageTime(new Date(message.createdAt))
              const showAvatar = index === 0 || dateMessages[index - 1].sender._id !== message.sender._id
              const isLastFromSender = index === dateMessages.length - 1 || dateMessages[index + 1].sender._id !== message.sender._id

              return (
                <div
                  key={message._id}
                  className={`flex items-end space-x-2 group ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-8 h-8 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                    {!isOwnMessage && (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-white">
                          {message.sender.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Message content */}
                  <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} max-w-xs lg:max-w-md`}>
                    {/* Sender name and time */}
                    {showAvatar && !isOwnMessage && (
                      <div className="flex items-center space-x-2 mb-1 px-1">
                        <span className="text-sm font-medium text-white">
                          {message.sender.username}
                        </span>
                        <span className="text-xs text-gray-400">{messageTime}</span>
                      </div>
                    )}

                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 bg-black/20 rounded-lg border-l-2 border-blue-400 max-w-full">
                        <div className="text-xs text-blue-400 mb-1">
                          Replying to {message.replyTo.sender.username}
                        </div>
                        <div className="text-sm opacity-75 truncate">
                          {message.replyTo.content}
                        </div>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`message-bubble ${isOwnMessage ? 'own' : 'other'} ${isLastFromSender ? 'mb-2' : 'mb-1'}`}
                    >
                      <div className="break-words">{message.content}</div>
                      
                      {/* File content */}
                      {renderFileMessage(message)}

                      {/* Message reactions */}
                      {message.reactions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.reactions.reduce((acc: any[], reaction) => {
                            const existing = acc.find(r => r.emoji === reaction.emoji)
                            if (existing) {
                              existing.count++
                              existing.users.push(reaction.user.username)
                            } else {
                              acc.push({
                                emoji: reaction.emoji,
                                count: 1,
                                users: [reaction.user.username]
                              })
                            }
                            return acc
                          }, []).map((reaction, index) => (
                            <button
                              key={index}
                              onClick={() => handleReaction(message._id, reaction.emoji)}
                              className="flex items-center space-x-1 px-2 py-1 bg-black/20 rounded-full text-xs hover:bg-black/30 transition-colors"
                              title={reaction.users.join(', ')}
                            >
                              <span>{reaction.emoji}</span>
                              <span>{reaction.count}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Edit indicator */}
                      {message.isEdited && (
                        <div className="text-xs opacity-50 mt-1">(edited)</div>
                      )}

                      {/* Time for own messages */}
                      {isOwnMessage && isLastFromSender && (
                        <div className="text-xs opacity-75 mt-1 text-right">
                          {messageTime}
                        </div>
                      )}
                    </div>

                    {/* Message actions */}
                    <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
                      <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-lg p-1 border border-white/20">
                        <div className="relative">
                          <button
                            onClick={() => setShowEmojiPicker(showEmojiPicker === message._id ? null : message._id)}
                            className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                            title="React"
                          >
                            <Smile className="h-4 w-4" />
                          </button>
                          
                          {showEmojiPicker === message._id && (
                            <div className="absolute bottom-full mb-2 right-0 z-50">
                              <EmojiPicker
                                onEmojiSelect={(emoji) => handleReaction(message._id, emoji)}
                                onClose={() => setShowEmojiPicker(null)}
                                position="top"
                              />
                            </div>
                          )}
                        </div>
                        
                        <button
                          onClick={() => setReplyingTo(message)}
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="Reply"
                        >
                          <Reply className="h-4 w-4" />
                        </button>
                        
                        <button
                          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                          title="More"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {roomTypingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-white/10 backdrop-blur-sm text-gray-300 px-4 py-3 rounded-2xl border border-white/20">
              <div className="flex items-center space-x-2">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
                <span className="text-sm">
                  {roomTypingUsers.length === 1
                    ? `${roomTypingUsers[0]} is typing...`
                    : `${roomTypingUsers.length} people are typing...`}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}

export default MessageList