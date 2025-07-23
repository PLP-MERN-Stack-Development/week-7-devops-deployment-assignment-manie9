import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Save, Trash2, Eye, EyeOff } from 'lucide-react'
import { Room } from '../types'
import LoadingSpinner from './LoadingSpinner'
import toast from 'react-hot-toast'
import axios from 'axios'

interface RoomSettingsModalProps {
  room: Room
  onClose: () => void
}

interface RoomSettingsForm {
  name: string
  description: string
  password: string
  maxMembers: number
}

const RoomSettingsModal: React.FC<RoomSettingsModalProps> = ({ room, onClose }) => {
  const [isLoading, setIsLoading] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [currentPassword, setCurrentPassword] = React.useState('')

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<RoomSettingsForm>({
    defaultValues: {
      name: room.name,
      description: room.description,
      password: '',
      maxMembers: room.maxMembers
    }
  })

  React.useEffect(() => {
    // Fetch current password if user is admin
    const fetchPassword = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/rooms/${room._id}/password`)
        setCurrentPassword(response.data.password)
      } catch (error) {
        console.error('Failed to fetch room password:', error)
      }
    }

    if (room.isPrivate) {
      fetchPassword()
    }
  }, [room._id, room.isPrivate])

  const onSubmit = async (data: RoomSettingsForm) => {
    setIsLoading(true)
    try {
      // Update room settings
      await axios.put(`${import.meta.env.VITE_API_URL}/api/rooms/${room._id}`, {
        name: data.name,
        description: data.description,
        password: data.password || currentPassword,
        maxMembers: data.maxMembers
      })
      
      toast.success('Room settings updated successfully!')
      onClose()
      // Refresh the page to get updated room data
      window.location.reload()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update room settings'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteRoom = async () => {
    if (!confirm('Are you sure you want to delete this room? This action cannot be undone.')) {
      return
    }

    setIsLoading(true)
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/rooms/${room._id}`)
      toast.success('Room deleted successfully!')
      onClose()
      // Redirect to general room or refresh
      window.location.reload()
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to delete room'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white/10 backdrop-blur-xl rounded-xl max-w-md w-full border border-white/20 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-semibold text-white">Room Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Name
            </label>
            <input
              {...register('name', {
                required: 'Room name is required',
                minLength: {
                  value: 1,
                  message: 'Room name must be at least 1 character'
                },
                maxLength: {
                  value: 50,
                  message: 'Room name cannot exceed 50 characters'
                }
              })}
              type="text"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
              placeholder="Enter room name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              {...register('description', {
                maxLength: {
                  value: 200,
                  message: 'Description cannot exceed 200 characters'
                }
              })}
              rows={3}
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm resize-none"
              placeholder="Describe what this room is about"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {room.isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3 py-2 pr-10 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
                  placeholder={currentPassword ? "Leave empty to keep current password" : "Enter new password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {currentPassword && (
                <p className="mt-1 text-xs text-gray-400">
                  Current password: {showPassword ? currentPassword : '••••••••'}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Max Members
            </label>
            <input
              {...register('maxMembers', {
                required: 'Max members is required',
                min: {
                  value: 2,
                  message: 'Minimum 2 members required'
                },
                max: {
                  value: 1000,
                  message: 'Maximum 1000 members allowed'
                }
              })}
              type="number"
              min="2"
              max="1000"
              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent backdrop-blur-sm"
            />
            {errors.maxMembers && (
              <p className="mt-1 text-sm text-red-400">{errors.maxMembers.message}</p>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <button
              type="button"
              onClick={handleDeleteRoom}
              disabled={isLoading || room.isGeneral === true}
              className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Room</span>
            </button>

            <div className="flex space-x-3">
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
                className="flex items-center space-x-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RoomSettingsModal