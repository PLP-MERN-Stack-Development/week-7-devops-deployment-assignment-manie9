import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { SocketProvider } from './contexts/SocketContext'
import Login from './pages/Login'
import Register from './pages/Register'
import Chat from './pages/Chat'
import ProtectedRoute from './components/ProtectedRoute'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, isLoading, checkAuth } = useAuthStore()

  React.useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/chat" replace /> : <Login />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/chat" replace /> : <Register />} 
        />
        <Route 
          path="/chat/*" 
          element={
            <ProtectedRoute>
              <SocketProvider>
                <Chat />
              </SocketProvider>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/" 
          element={<Navigate to={user ? "/chat" : "/login"} replace />} 
        />
      </Routes>
    </div>
  )
}

export default App