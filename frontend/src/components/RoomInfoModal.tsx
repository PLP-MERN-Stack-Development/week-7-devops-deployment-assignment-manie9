import React from 'react'
import { X, Hash, Lock, Users, Calendar, Crown, Shield, User } from 'lucide-react'
import { Room } from '../stores/chatStore'
import { format } from 'date-fns'

interface RoomInfoModalProps {
  room: Room
  onClose: () => void
}

const RoomInfoModal: React.FC<RoomInfoModalProps> = ({ room, onClose }) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4 text-yellow-400" />
      case 'moderator':
        return <Shield className="h-4 w-4 text-blue-400" />
      default:
        return <User className="h-4 w-4 text-gray-400" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'text-yellow-400'
      case 'moderator':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  }

  const onlineMembers = room.members.filter(member => member.user.status === 'online')
  const offlineMembers = room.members.filter(member => member.user.status !== 'online')

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Room Information</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Room Details */}
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                {room.isPrivate ? (
                  <Lock className="h-6 w-6 text-yellow-400" />
                ) : (
                  <Hash className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{room.name}</h3>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                  {room.isGeneral && (
                    <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
                      General
                    </span>
                  )}
                  {room.isPrivate && (
                    <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-full text-xs">
                      Private
                    </span>
                  )}
                </div>
              </div>
            </div>

            {room.description && (
              <div className="p-3 bg-white/5 rounded-lg border border-white/10 mb-4">
                <p className="text-sm text-gray-300">{room.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </div>
                <p className="text-white font-medium">{room.members.length} / {room.maxMembers}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-2 text-gray-400 mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Created</span>
                </div>
                <p className="text-white font-medium">
                  {format(new Date(room.createdAt), 'MMM dd, yyyy')}
                </p>
              </div>
            </div>
          </div>

          {/* Creator */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-3">Created by</h4>
            <div className="flex items-center space-x-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {room.creator.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-white font-medium">{room.creator.username}</p>
                <p className="text-xs text-gray-400">Room Creator</p>
              </div>
            </div>
          </div>

          {/* Online Members */}
          {onlineMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Online ({onlineMembers.length})
              </h4>
              <div className="space-y-2">
                {onlineMembers.map((member) => (
                  <div
                    key={member.user._id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {member.user.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.user.username}</p>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span className={`text-xs capitalize ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Offline Members */}
          {offlineMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-3">
                Offline ({offlineMembers.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {offlineMembers.map((member) => (
                  <div
                    key={member.user._id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors opacity-60"
                  >
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {member.user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{member.user.username}</p>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(member.role)}
                        <span className={`text-xs capitalize ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomInfoModal