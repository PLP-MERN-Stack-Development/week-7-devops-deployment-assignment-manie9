import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'
import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000'

export interface User {
  id: string
  username: string
  email: string
  avatar: string
  status: 'online' | 'offline' | 'away'
  lastSeen?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (username: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  checkAuth: () => Promise<void>
  updateProfile: (data: Partial<User>) => Promise<boolean>
  updateStatus: (status: User['status']) => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await axios.post(`${API_URL}/api/auth/login`, {
            email,
            password
          })

          const { token, user } = response.data
          
          set({ user, token, isLoading: false })
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          toast.success('Login successful!')
          return true
        } catch (error: any) {
          const message = error.response?.data?.message || 'Login failed'
          toast.error(message)
          return false
        }
      },

      register: async (username: string, email: string, password: string) => {
        try {
          const response = await axios.post(`${API_URL}/api/auth/register`, {
            username,
            email,
            password
          })

          const { token, user } = response.data
          
          set({ user, token, isLoading: false })
          
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          toast.success('Registration successful!')
          return true
        } catch (error: any) {
          const message = error.response?.data?.message || 'Registration failed'
          toast.error(message)
          return false
        }
      },

      logout: async () => {
        const { token } = get()
        
        if (token) {
          try {
            await axios.post(`${API_URL}/api/auth/logout`, {}, {
              headers: { Authorization: `Bearer ${token}` }
            })
          } catch (error) {
            console.error('Logout error:', error)
          }
        }

        set({ user: null, token: null, isLoading: false })
        delete axios.defaults.headers.common['Authorization']
        toast.success('Logged out successfully')
      },

      checkAuth: async () => {
        const { token } = get()
        
        if (!token) {
          set({ isLoading: false })
          return
        }

        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
          
          const response = await axios.get(`${API_URL}/api/auth/me`)
          const { user } = response.data
          
          set({ user, isLoading: false })
        } catch (error) {
          console.error('Auth check failed:', error)
          set({ user: null, token: null, isLoading: false })
          delete axios.defaults.headers.common['Authorization']
        }
      },

      updateProfile: async (data: Partial<User>) => {
        const { token } = get()
        
        if (!token) return false

        try {
          const response = await axios.put(`${API_URL}/api/users/profile`, data, {
            headers: { Authorization: `Bearer ${token}` }
          })

          const { user } = response.data
          set(state => ({ user: { ...state.user!, ...user } }))
          
          toast.success('Profile updated successfully!')
          return true
        } catch (error: any) {
          const message = error.response?.data?.message || 'Failed to update profile'
          toast.error(message)
          return false
        }
      },

      updateStatus: async (status: User['status']) => {
        const { token } = get()
        
        if (!token) return

        try {
          await axios.put(`${API_URL}/api/users/status`, { status }, {
            headers: { Authorization: `Bearer ${token}` }
          })

          set(state => ({ 
            user: state.user ? { ...state.user, status } : null 
          }))
        } catch (error) {
          console.error('Failed to update status:', error)
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        token: state.token,
        user: state.user 
      })
    }
  )
)