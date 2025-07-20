import React from 'react'
import { useParams } from 'react-router-dom'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import RoomHeader from './RoomHeader'
import LoadingSpinner from './LoadingSpinner'


const ChatRoom: React.FC = () => {
  const { roomId } = useParams()
  const { currentRoom, messages, fetchMessages, setCurrentRoom } = useChatStore()
  const { joinRoom } = useSocket()
  const [isLoading, setIsLoading] = React.useState(false)

  React.useEffect(() => {
    if (roomId && (!currentRoom || currentRoom._id !== roomId)) {
      const loadRoom = async () => {
        setIsLoading(true)
        try {
          // Find room in store or fetch it
          // For now, we'll assume the room is in the store
          joinRoom(roomId)
          await fetchMessages(roomId)
        } catch (error) {
          console.error('Failed to load room:', error)
        } finally {
          setIsLoading(false)
        }
      }
      loadRoom()
    }
  }, [roomId, currentRoom, joinRoom, fetchMessages])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!currentRoom) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <p>Room not found</p>
        </div>
      </div>
    )
  }

  const roomMessages = messages[currentRoom._id] || []

  return (
    <div className="flex-1 flex flex-col">
      <RoomHeader room={currentRoom} />
      <MessageList messages={roomMessages} />
      <MessageInput roomId={currentRoom._id} />
    </div>
  )
}

export default ChatRoom