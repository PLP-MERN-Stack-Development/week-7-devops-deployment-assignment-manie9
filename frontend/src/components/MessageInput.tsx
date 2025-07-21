import React from 'react'
import { Send, Paperclip, Smile, X, Image } from 'lucide-react'
import { useSocket } from '../contexts/SocketContext'
import EmojiPicker from './EmojiPicker'
import toast from 'react-hot-toast'

interface MessageInputProps {
  roomId: string
}

const MessageInput: React.FC<MessageInputProps> = ({ roomId }) => {
  const [message, setMessage] = React.useState('')
  const [isTyping, setIsTyping] = React.useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = React.useState(false)
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const { sendMessage, setTyping } = useSocket()
  const typingTimeoutRef = React.useRef<NodeJS.Timeout>()
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const emojiPickerRef = React.useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedFile) {
      await handleFileUpload()
    } else if (message.trim()) {
      sendMessage(roomId, message.trim())
      setMessage('')
      handleStopTyping()
    }
  }

  const handleFileUpload = async () => {
    if (!selectedFile) return

    const formData = new FormData()
    formData.append('file', selectedFile)
    formData.append('room', roomId)

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/messages/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      if (response.ok) {
        toast.success('File uploaded successfully!')
        setSelectedFile(null)
        if (message.trim()) {
          sendMessage(roomId, message.trim())
          setMessage('')
        }
      } else {
        toast.error('Failed to upload file')
      }
    } catch (error) {
      console.error('File upload error:', error)
      toast.error('Failed to upload file')
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

  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const removeSelectedFile = () => {
    setSelectedFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Close emoji picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className="border-t border-white/20 bg-white/5 backdrop-blur-sm">
      {/* File preview */}
      {selectedFile && (
        <div className="p-3 border-b border-white/10">
          <div className="flex items-center justify-between bg-white/10 rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="h-5 w-5 text-blue-400" />
                ) : (
                  <Paperclip className="h-5 w-5 text-blue-400" />
                )}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{selectedFile.name}</p>
                <p className="text-gray-400 text-xs">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeSelectedFile}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div 
        className={`p-4 ${isDragging ? 'bg-blue-500/10' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <form onSubmit={handleSubmit} className="flex items-end space-x-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 group"
            title="Attach file"
          >
            <Paperclip className="h-5 w-5 group-hover:rotate-12 transition-transform" />
          </button>

          <div className="flex-1 relative">
            <div className="relative">
              <input
                type="text"
                value={message}
                onChange={handleInputChange}
                placeholder={selectedFile ? "Add a caption..." : "Type a message..."}
                className="w-full px-4 py-3 pr-12 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
                maxLength={1000}
              />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Add emoji"
                >
                  <Smile className="h-5 w-5" />
                </button>
                
                {showEmojiPicker && (
                  <EmojiPicker
                    onEmojiSelect={handleEmojiSelect}
                    onClose={() => setShowEmojiPicker(false)}
                    position="top"
                  />
                )}
              </div>
            </div>
            
            {isDragging && (
              <div className="absolute inset-0 border-2 border-dashed border-blue-400 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <p className="text-blue-400 font-medium">Drop file here to upload</p>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!message.trim() && !selectedFile}
            className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            title="Send message"
          >
            <Send className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default MessageInput