import React from 'react'
import { Plus, Search, LogOut, Settings, Hash, Lock, Users, Crown, Shield } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import CreateRoomModal from './CreateRoomModal'
import UserProfile from './UserProfile'
import JoinPrivateRoomModal from './JoinPrivateRoomModal'

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { rooms, currentRoom, setCurrentRoom, fetchMessages } = useChatStore()
  const { joinRoom } = useSocket()
  const [showCreateRoom, setShowCreateRoom] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)
  const [showJoinPrivate, setShowJoinPrivate] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoomSelect = async (room: any) => {
    if (room.isPrivate && !room.members.some((member: any) => member.user._id === user?.id)) {
      setShowJoinPrivate(room._id)
      return
    }
    
    setCurrentRoom(room)
    joinRoom(room._id)
    await fetchMessages(room._id)
  }

  const handleLogout = () => {
    logout()
  }

  const getRoomIcon = (room: any) => {
    if (room.isGeneral) {
      return <Hash className="h-4 w-4 text-green-400" />
    }
    if (room.isPrivate) {
      return <Lock className="h-4 w-4 text-yellow-400" />
    }
    return <Hash className="h-4 w-4 text-blue-400" />
  }

  const getUserRole = (room: any) => {
    const member = room.members.find((m: any) => m.user._id === user?.id)
    return member?.role || 'member'
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-400" />
      case 'moderator':
        return <Shield className="h-3 w-3 text-blue-400" />
      default:
        return null
    }
  }

  const getOnlineCount = (room: any) => {
    return room.members.filter((member: any) => member.user.status === 'online').length
  }

  return (
    <>
      <div className="w-80 bg-black/20 backdrop-blur-xl border-r border-white/10 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ChatApp
            </h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Profile Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm transition-all duration-200"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Rooms ({filteredRooms.length})
              </h2>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-all duration-200 transform hover:scale-110"
                title="Create Room"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {filteredRooms.map((room) => {
                const isActive = currentRoom?._id === room._id
                const userRole = getUserRole(room)
                const onlineCount = getOnlineCount(room)
                const isMember = room.members.some((member: any) => member.user._id === user?.id)

                return (
                  <button
                    key={room._id}
                    onClick={() => handleRoomSelect(room)}
                    className={`room-card w-full text-left transition-all duration-200 ${
                      isActive
                        ? 'active text-white'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        {getRoomIcon(room)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium truncate">{room.name}</span>
                          {isMember && getRoleIcon(userRole)}
                          {room.isGeneral === true && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              General
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-xs opacity-75">
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{room.members.length}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow"></div>
                            <span>{onlineCount} online</span>
                          </div>
                        </div>
                      </div>
                      {!isMember && room.isPrivate && (
                        <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full">
                          Private
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {filteredRooms.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No rooms found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </div>
            )}

            {filteredRooms.length === 0 && !searchTerm && (
              <div className="text-center py-8 text-gray-400">
                <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No rooms available</p>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="text-blue-400 hover:text-blue-300 text-sm mt-2 transition-colors"
                >
                  Create your first room
                </button>
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 status-online rounded-full border-2 border-gray-900"></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">
                {user?.username}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
            <div className="text-xs text-green-400 font-medium">
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}
      {showProfile && (
        <UserProfile onClose={() => setShowProfile(false)} />
      )}
      {showJoinPrivate && (
        <JoinPrivateRoomModal
          roomId={showJoinPrivate}
          onClose={() => setShowJoinPrivate(null)}
          onSuccess={(room) => {
            setCurrentRoom(room)
            joinRoom(room._id)
            fetchMessages(room._id)
            setShowJoinPrivate(null)
          }}
        />
      )}
    </>
  )
}

export default Sidebar