import React from 'react'
import { Plus, Search, LogOut, Settings, Hash, Lock } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useChatStore } from '../stores/chatStore'
import { useSocket } from '../contexts/SocketContext'
import CreateRoomModal from './CreateRoomModal'
import UserProfile from './UserProfile'

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore()
  const { rooms, currentRoom, setCurrentRoom, fetchMessages } = useChatStore()
  const { joinRoom } = useSocket()
  const [showCreateRoom, setShowCreateRoom] = React.useState(false)
  const [showProfile, setShowProfile] = React.useState(false)
  const [searchTerm, setSearchTerm] = React.useState('')

  const filteredRooms = rooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRoomSelect = async (room: any) => {
    setCurrentRoom(room)
    joinRoom(room._id)
    await fetchMessages(room._id)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <>
      <div className="w-80 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-bold text-white">ChatApp</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowProfile(true)}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                title="Profile Settings"
              >
                <Settings className="h-5 w-5" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
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
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Rooms */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">
                Rooms
              </h2>
              <button
                onClick={() => setShowCreateRoom(true)}
                className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                title="Create Room"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1">
              {filteredRooms.map((room) => (
                <button
                  key={room._id}
                  onClick={() => handleRoomSelect(room)}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    currentRoom?._id === room._id
                      ? 'bg-primary-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {room.isPrivate ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Hash className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{room.name}</div>
                      <div className="text-xs opacity-75 truncate">
                        {room.members.length} members
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {filteredRooms.length === 0 && searchTerm && (
              <div className="text-center py-8 text-gray-400">
                <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No rooms found</p>
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-white truncate">
                {user?.username}
              </div>
              <div className="text-xs text-gray-400 truncate">
                {user?.email}
              </div>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
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
    </>
  )
}

export default Sidebar