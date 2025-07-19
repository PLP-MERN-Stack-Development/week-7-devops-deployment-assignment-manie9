import React from 'react'
import { format } from 'date-fns'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import { Message } from '../stores/chatStore'
import { MoreVertical, Reply, Smile } from 'lucide-react'

interface MessageListProps {
  messages: Message[]
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const { user } = useAuthStore()
  const { typingUsers, currentRoom } = useChatStore()
  const { reactToMessage } = useSocket()
  const messagesEndRef = React.useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleReaction = (messageId: string, emoji: string) => {
    reactToMessage(messageId, emoji)
  }

  const roomTypingUsers = currentRoom ? typingUsers[currentRoom._id] || [] : []

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = message.sender._id === user?.id
        const messageTime = format(new Date(message.createdAt), 'HH:mm')

        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {!isOwnMessage && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-white">
                      {message.sender.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-300">
                    {message.sender.username}
                  </span>
                  <span className="text-xs text-gray-500">{messageTime}</span>
                </div>
              )}

              <div
                className={`relative group px-4 py-2 rounded-lg ${
                  isOwnMessage
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-700 text-gray-100'
                }`}
              >
                {message.replyTo && (
                  <div className="mb-2 p-2 bg-black bg-opacity-20 rounded border-l-2 border-gray-400">
                    <div className="text-xs text-gray-300 mb-1">
                      Replying to {message.replyTo.sender.username}
                    </div>
                    <div className="text-sm opacity-75 truncate">
                      {message.replyTo.content}
                    </div>
                  </div>
                )}

                <div className="break-words">{message.content}</div>

                {message.isEdited && (
                  <div className="text-xs opacity-75 mt-1">(edited)</div>
                )}

                {message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {message.reactions.map((reaction, index) => (
                      <button
                        key={index}
                        onClick={() => handleReaction(message._id, reaction.emoji)}
                        className="flex items-center space-x-1 px-2 py-1 bg-black bg-opacity-20 rounded-full text-xs hover:bg-opacity-30 transition-colors"
                      >
                        <span>{reaction.emoji}</span>
                        <span>{reaction.user.username}</span>
                      </button>
                    ))}
                  </div>
                )}

                {isOwnMessage && (
                  <div className="text-xs opacity-75 mt-1 text-right">
                    {messageTime}
                  </div>
                )}

                {/* Message actions */}
                <div className="absolute top-0 right-0 transform translate-x-full opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1 ml-2">
                    <button
                      onClick={() => handleReaction(message._id, '👍')}
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="React"
                    >
                      <Smile className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="Reply"
                    >
                      <Reply className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="More"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}

      {/* Typing indicator */}
      {roomTypingUsers.length > 0 && (
        <div className="flex justify-start">
          <div className="max-w-xs lg:max-w-md">
            <div className="bg-gray-700 text-gray-300 px-4 py-2 rounded-lg">
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