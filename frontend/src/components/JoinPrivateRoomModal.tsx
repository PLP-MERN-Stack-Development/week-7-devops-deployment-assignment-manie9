import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Lock, Eye, EyeOff } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'
import axios from 'axios'

interface JoinPrivateRoomModalProps {
  roomId: string
  onClose: () => void
  onSuccess: (room: any) => void
}

interface JoinRoomForm {
  password: string
}

const JoinPrivateRoomModal: React.FC<JoinPrivateRoomModalProps> = ({ 
  roomId, 
  onClose, 
  onSuccess 
}) => {
  const { rooms } = useChatStore()
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [roomDetails, setRoomDetails] = React.useState<any>(null)

  const room = rooms.find(r => r._id === roomId)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<JoinRoomForm>()

  React.useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rooms/${roomId}`)
        setRoomDetails(response.data)
      } catch (error) {
        console.error('Failed to fetch room details:', error)
      }
    }

    if (!room) {
      fetchRoomDetails()
    } else {
      setRoomDetails(room)
    }
  }, [roomId, room])

  const onSubmit = async (data: JoinRoomForm) => {
    setIsLoading(true)
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/rooms/${roomId}/join`,
        { password: data.password }
      )
      
      toast.success('Successfully joined the room!')
      onSuccess(response.data.room)
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to join room'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!roomDetails) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl max-w-md w-full border border-white/20">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Join Private Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Room info */}
          <div className="mb-6 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex items-center space-x-3 mb-2">
              <Lock className="h-5 w-5 text-yellow-400" />
              <h3 className="font-medium text-white">{roomDetails.name}</h3>
            </div>
            {roomDetails.description && (
              <p className="text-sm text-gray-300">{roomDetails.description}</p>
            )}
            <div className="flex items-center space-x-4 mt-3 text-xs text-gray-400">
              <span>{roomDetails.members.length} members</span>
              <span>Created by {roomDetails.creator.username}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Password
              </label>
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required'
                  })}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-3 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                  placeholder="Enter room password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Join Room'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default JoinPrivateRoomModal