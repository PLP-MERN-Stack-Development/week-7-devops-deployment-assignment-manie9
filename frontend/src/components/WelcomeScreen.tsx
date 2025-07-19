import React from 'react'
import { MessageCircle, Users, Hash, Zap } from 'lucide-react'

const WelcomeScreen: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-900">
      <div className="text-center max-w-md mx-auto px-6">
        <div className="mb-8">
          <MessageCircle className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome to ChatApp
          </h1>
          <p className="text-gray-400">
            Select a room from the sidebar to start chatting with others
          </p>
        </div>

        <div className="space-y-4 text-left">
          <div className="flex items-start space-x-3">
            <Hash className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Join Public Rooms</h3>
              <p className="text-sm text-gray-400">
                Discover and join public chat rooms on various topics
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Users className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Create Private Rooms</h3>
              <p className="text-sm text-gray-400">
                Set up private rooms with password protection
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Zap className="h-5 w-5 text-primary-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-white font-medium">Real-time Messaging</h3>
              <p className="text-sm text-gray-400">
                Experience instant messaging with typing indicators
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-gray-800 rounded-lg border border-gray-700">
          <p className="text-sm text-gray-300">
            <strong>Tip:</strong> Use the <span className="text-primary-400">+</span> button 
            in the sidebar to create a new room and start your own conversation!
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomeScreen