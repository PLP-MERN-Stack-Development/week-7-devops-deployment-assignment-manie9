"use client"

import { io } from "socket.io-client"
import { useEffect, useState, useCallback } from "react"

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001"

let socket = null

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect()
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })

  return socket
}

export const getSocket = () => socket

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState([])
  const [users, setUsers] = useState([])
  const [typingUsers, setTypingUsers] = useState([])
  const [currentRoom, setCurrentRoom] = useState("general")
  const [rooms, setRooms] = useState(["general"])
  const [privateMessages, setPrivateMessages] = useState({})
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  // Show browser notification
  const showNotification = useCallback((title, body, icon) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon })
    }
  }, [])

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    const audio = new Audio("/notification.mp3")
    audio.play().catch(() => {}) // Ignore errors if sound file doesn't exist
  }, [])

  // Connect to socket
  const connect = useCallback(
    (token) => {
      const socketInstance = initializeSocket(token)

      socketInstance.on("connect", () => {
        setIsConnected(true)
      })

      socketInstance.on("disconnect", () => {
        setIsConnected(false)
      })

      socketInstance.on("receive_message", (message) => {
        setMessages((prev) => [...prev, message])

        // Show notification for new messages
        if (message.senderId !== socketInstance.id) {
          showNotification(`New message from ${message.sender}`, message.message, "/chat-icon.png")
          playNotificationSound()
          setUnreadCount((prev) => prev + 1)
        }
      })

      socketInstance.on("private_message", (message) => {
        const conversationKey = [message.sender, message.to].sort().join("-")
        setPrivateMessages((prev) => ({
          ...prev,
          [conversationKey]: [...(prev[conversationKey] || []), message],
        }))

        if (message.senderId !== socketInstance.id) {
          showNotification(`Private message from ${message.sender}`, message.message, "/chat-icon.png")
          playNotificationSound()
        }
      })

      socketInstance.on("user_list", (userList) => {
        setUsers(userList)
      })

      socketInstance.on("user_joined", (user) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "user_joined",
            message: `${user.username} joined the chat`,
            timestamp: new Date().toISOString(),
          },
        ])
      })

      socketInstance.on("user_left", (user) => {
        setNotifications((prev) => [
          ...prev,
          {
            id: Date.now(),
            type: "user_left",
            message: `${user.username} left the chat`,
            timestamp: new Date().toISOString(),
          },
        ])
      })

      socketInstance.on("typing_users", (users) => {
        setTypingUsers(users)
      })

      socketInstance.on("message_reaction", ({ messageId, reaction, user }) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? {
                  ...msg,
                  reactions: {
                    ...msg.reactions,
                    [reaction]: [...(msg.reactions[reaction] || []), user],
                  },
                }
              : msg,
          ),
        )
      })

      return socketInstance
    },
    [showNotification, playNotificationSound],
  )

  // Disconnect from socket
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
      socket = null
    }
  }, [])

  // Send message
  const sendMessage = useCallback(
    (message, room = currentRoom) => {
      if (socket) {
        socket.emit("send_message", { message, room })
      }
    },
    [currentRoom],
  )

  // Send private message
  const sendPrivateMessage = useCallback((to, message) => {
    if (socket) {
      socket.emit("private_message", { to, message })
    }
  }, [])

  // Join room
  const joinRoom = useCallback(
    (roomName) => {
      if (socket) {
        socket.emit("join_room", roomName)
        setCurrentRoom(roomName)
        if (!rooms.includes(roomName)) {
          setRooms((prev) => [...prev, roomName])
        }
      }
    },
    [rooms],
  )

  // Leave room
  const leaveRoom = useCallback((roomName) => {
    if (socket) {
      socket.emit("leave_room", roomName)
      setRooms((prev) => prev.filter((room) => room !== roomName))
    }
  }, [])

  // Set typing status
  const setTyping = useCallback(
    (isTyping, room = currentRoom) => {
      if (socket) {
        socket.emit("typing", { isTyping, room })
      }
    },
    [currentRoom],
  )

  // Add reaction to message
  const addReaction = useCallback((messageId, reaction) => {
    if (socket) {
      socket.emit("add_reaction", { messageId, reaction })
    }
  }, [])

  // Mark message as read
  const markMessageRead = useCallback(
    (messageId, room = currentRoom) => {
      if (socket) {
        socket.emit("mark_message_read", { messageId, room })
      }
    },
    [currentRoom],
  )

  // Load message history
  const loadMessageHistory = useCallback(
    async (room = currentRoom, page = 1) => {
      try {
        const response = await fetch(`${SOCKET_URL}/api/messages/${room}?page=${page}&limit=20`)
        const data = await response.json()

        if (page === 1) {
          setMessages(data.messages)
        } else {
          setMessages((prev) => [...data.messages, ...prev])
        }

        return data.hasMore
      } catch (error) {
        console.error("Failed to load message history:", error)
        return false
      }
    },
    [currentRoom],
  )

  // Clear unread count
  const clearUnreadCount = useCallback(() => {
    setUnreadCount(0)
  }, [])

  return {
    socket,
    isConnected,
    messages,
    users,
    typingUsers,
    currentRoom,
    rooms,
    privateMessages,
    notifications,
    unreadCount,
    connect,
    disconnect,
    sendMessage,
    sendPrivateMessage,
    joinRoom,
    leaveRoom,
    setTyping,
    addReaction,
    markMessageRead,
    loadMessageHistory,
    clearUnreadCount,
    setCurrentRoom,
  }
}
