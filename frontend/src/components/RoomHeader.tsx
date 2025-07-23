import React from 'react'
import { Hash, Lock, Users, Settings, Phone, Video, Info, UserPlus } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import RoomSettingsModal from './RoomSettingsModal'
import RoomInfoModal from './RoomInfoModal'
import { Room } from '../types'

interface RoomHeaderProps {
  room: Room
}

const RoomHeader: React.FC<RoomHeaderProps> = ({ room }) => {
  const { user } = useAuthStore()
  const [showSettings, setShowSettings] = React.useState(false)
  const [showInfo, setShowInfo] = React.useState(false)

  const onlineMembers = room.members.filter(member => 
    member.user.status === 'online'
  ).length

  const userMember = room.members.find(member => member.user._id === user?.id)
  const canManageRoom = userMember?.role === 'admin' || userMember?.role === 'moderator'

  const handleVoiceCall = () => {
    // Placeholder for voice call functionality
    alert('Voice call feature coming soon!')
  }

  const handleVideoCall = () => {
    // Placeholder for video call functionality
    alert('Video call feature coming soon!')
  }

  const handleInviteUsers = () => {
    // Placeholder for invite users functionality
    alert('Invite users feature coming soon!')
  }

  return (
    <>
      <div className="border-b border-white/10 bg-black/10 backdrop-blur-sm">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {room.isPrivate ? (
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Lock className="h-6 w-6 text-yellow-400" />
                  </div>
                ) : (
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Hash className="h-6 w-6 text-blue-400" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-semibold text-white">{room.name}</h1>
                  {room.isGeneral === true && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
                      General
                    </span>
                  )}
                  {room.isPrivate && (
                    <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                      Private
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{room.members.length} members</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow"></div>
                    <span>{onlineMembers} online</span>
                  </div>
                  {userMember && (
                    <div className="flex items-center space-x-1">
                      <span className="capitalize text-blue-400">{userMember.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowInfo(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Room info"
              >
                <Info className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleInviteUsers}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Invite users"
              >
                <UserPlus className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleVoiceCall}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Voice call"
              >
                <Phone className="h-5 w-5" />
              </button>
              
              <button
                onClick={handleVideoCall}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Video call"
              >
                <Video className="h-5 w-5" />
              </button>
              
              {canManageRoom && (
                <button
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  title="Room settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {room.description && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-sm text-gray-300">{room.description}</p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showSettings && canManageRoom && (
        <RoomSettingsModal
          room={room}
          onClose={() => setShowSettings(false)}
        />
      )}
      
      {showInfo && (
        <RoomInfoModal
          room={room}
          onClose={() => setShowInfo(false)}
        />
      )}
    </>
  )
}

export default RoomHeader