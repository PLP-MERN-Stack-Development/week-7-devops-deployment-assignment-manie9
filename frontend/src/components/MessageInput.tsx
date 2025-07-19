import React from 'react'
import { Send, Paperclip, Smile } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'

interface MessageInputProps {
  roomId: string
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const [message, setMessage] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const { sendMessage, setTyping } = useSocket()
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      sendMessage(roomId, message.trim())
      setMessage('')
      handleStopTyping()
    }
  }

  const handleTyping = () => {
    if (!isTyping) {
      setIsTyping(true)
      setTyping(roomId, true)
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      handleStopTyping()
    }, 1000)
  }

  const handleStopTyping = () => {
    if (isTyping) {
      setIsTyping(false)
      setTyping(roomId, false)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value)
    handleTyping()
  }

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="border-t border-gray-700 p-4">
      <form onSubmit={handleSubmit} className="flex items-center space-x-3">
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Attach file"
        >
          <Paperclip className="h-5 w-5" />
        </button>

        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            maxLength={1000}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors"
            title="Add emoji"
          >
            <Smile className="h-5 w-5" />
          </button>
        </div>

        <button
          type="submit"
          disabled={!message.trim()}
          className="p-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  )
}

export default MessageInput