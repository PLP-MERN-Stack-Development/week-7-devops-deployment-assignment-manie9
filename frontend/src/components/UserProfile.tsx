import React from 'react'
import { useForm } from 'react-hook-form'
import { X, User, Mail, Camera } from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import LoadingSpinner from './LoadingSpinner'

interface UserProfileProps {
  onClose: () => void
}

interface ProfileForm {
  username: string
  email: string
  avatar: string
}

const UserProfile: React.FC<UserProfileProps> = ({ onClose }) => {
  const { user, updateProfile } = useAuthStore()
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ProfileForm>({
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
      avatar: user?.avatar || ''
    }
  })

  const onSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    const success = await updateProfile(data)
    setIsLoading(false)
    
    if (success) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="text-center mb-6">
            <div className="relative inline-block">
              <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto">
                <span className="text-2xl font-medium text-white">
                  {user?.username.charAt(0).toUpperCase()}
                </span>
              </div>
              <button
                type="button"
                className="absolute bottom-0 right-0 p-1 bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                title="Change avatar"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('username', {
                  required: 'Username is required',
                  minLength: {
                    value: 3,
                    message: 'Username must be at least 3 characters'
                  },
                  maxLength: {
                    value: 30,
                    message: 'Username cannot exceed 30 characters'
                  }
                })}
                type="text"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            {errors.username && (
              <p className="mt-1 text-sm text-red-400">{errors.username.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter email"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
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
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserProfile