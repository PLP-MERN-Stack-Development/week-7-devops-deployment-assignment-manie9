import React from 'react'
import { useForm } from 'react-hook-form'
import { X, Hash, Lock } from 'lucide-react'
import { useChatStore } from '../stores/chatStore'
import LoadingSpinner from './LoadingSpinner'

interface CreateRoomModalProps {
  onClose: () => void
}

interface CreateRoomForm {
  name: string
  description: string
  isPrivate: string
  password: string
  maxMembers: number
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ onClose }) => {
  const { createRoom } = useChatStore()
  const [isLoading, setIsLoading] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<CreateRoomForm>({
    defaultValues: {
      maxMembers: 100,
      isPrivate: "false"
    }
  })

  const isPrivate = watch('isPrivate')
  const [, setDummy] = React.useState(false);

  const onSubmit = async (data: CreateRoomForm) => {
    setIsLoading(true)
    const { password, ...roomData } = data;
    const isPrivate = data.isPrivate === "true";
    // Remove password from roomData to avoid TS error
    const roomDataWithoutPassword = { ...roomData } as Omit<typeof roomData, 'password'>;
    const success = await createRoom({
      ...roomDataWithoutPassword,
      isPrivate,
      // @ts-ignore
      password: isPrivate ? password : '',
    })
    setIsLoading(false)
    
    if (success) {
      onClose()
    }
  }

  React.useEffect(() => {
    // Fix for radio button not updating correctly
    const radios = document.querySelectorAll('input[name="isPrivate"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        // Force update by triggering React state update
        setDummy(dummy => !dummy);
      });
    });
  }, []);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create Room</h2>
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter room name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (Optional)
            </label>
            <textarea
              {...register('description', {
                maxLength: {
                  value: 200,
                  message: 'Description cannot exceed 200 characters'
                }
              })}
              rows={3}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Describe what this room is about"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Type
            </label>
            <div className="space-y-2">
            <label className="flex items-center">
              <input
                {...register('isPrivate')}
                type="radio"
                value={"false"}
                className="sr-only"
              />
              <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                !isPrivate 
                  ? 'border-primary-500 bg-primary-500 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}>
                <Hash className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-white font-medium">Public Room</div>
                  <div className="text-sm text-gray-400">Anyone can join</div>
                </div>
              </div>
            </label>

            <label className="flex items-center">
              <input
                {...register('isPrivate')}
                type="radio"
                value={"true"}
                className="sr-only"
              />
              <div className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                isPrivate 
                  ? 'border-primary-500 bg-primary-500 bg-opacity-10' 
                  : 'border-gray-600 hover:border-gray-500'
              }`}>
                <Lock className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-white font-medium">Private Room</div>
                  <div className="text-sm text-gray-400">Requires password to join</div>
                </div>
              </div>
            </label>
            </div>
          </div>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <input
                {...register('password', {
                  required: isPrivate ? 'Password is required for private rooms' : false
                })}
                type="password"
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter room password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
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
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {errors.maxMembers && (
              <p className="mt-1 text-sm text-red-400">{errors.maxMembers.message}</p>
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
              {isLoading ? <LoadingSpinner size="sm" /> : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal