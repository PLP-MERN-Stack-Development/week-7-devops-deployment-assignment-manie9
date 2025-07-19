import React from 'react'
import { Hash, Lock, Users, Settings, Phone, Video } from 'lucide-react'
import { Room } from '../stores/chatStore'

interface RoomHeaderProps {
  room: Room
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ room }) => {
  const onlineMembers = room.members.filter(member => 
    member.user.status === 'online'
  ).length

  return (
    <div className="border-b border-gray-700 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {room.isPrivate ? (
              <Lock className="h-6 w-6 text-gray-400" />
            ) : (
              <Hash className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-semibold text-white">{room.name}</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>{room.members.length} members</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{onlineMembers} online</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Voice call"
          >
            <Phone className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Video call"
          >
            <Video className="h-5 w-5" />
          </button>
          <button
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
            title="Room settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>

      {room.description && (
        <div className="mt-2 text-sm text-gray-400">
          {room.description}
        </div>
      )}
    </div>
  )
}

export default RoomHeader