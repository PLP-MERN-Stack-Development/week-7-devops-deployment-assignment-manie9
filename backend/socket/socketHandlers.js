const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');

const connectedUsers = new Map();

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error'));
    }

    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
};

const handleConnection = (io) => {
  // Authentication middleware
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log(`User ${socket.user.username} connected`);

    // Store user connection
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      user: socket.user,
      rooms: new Set()
    });

    // Update user status to online
    await User.findByIdAndUpdate(socket.userId, {
      status: 'online',
      lastSeen: new Date()
    });

    // Emit user online status to all connected users
    socket.broadcast.emit('userStatusUpdate', {
      userId: socket.userId,
      status: 'online',
      username: socket.user.username
    });

    // Join user to their rooms
    const userRooms = await Room.find({
      'members.user': socket.userId
    }).select('_id name');

    for (const room of userRooms) {
      socket.join(room._id.toString());
      connectedUsers.get(socket.userId).rooms.add(room._id.toString());
      
      // Notify room members that user is online
      socket.to(room._id.toString()).emit('userJoinedRoom', {
        roomId: room._id,
        user: {
          id: socket.userId,
          username: socket.user.username,
          avatar: socket.user.avatar,
          status: 'online'
        }
      });
    }

    // Handle joining a room
    socket.on('joinRoom', async (data) => {
      try {
        const { roomId } = data;
        const room = await Room.findById(roomId);
        
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        // Check if user is a member
        const isMember = room.members.some(member => 
          member.user.toString() === socket.userId
        );

        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        socket.join(roomId);
        connectedUsers.get(socket.userId).rooms.add(roomId);

        // Notify other users in the room
        socket.to(roomId).emit('userJoinedRoom', {
          roomId,
          user: {
            id: socket.userId,
            username: socket.user.username,
            avatar: socket.user.avatar,
            status: 'online'
          }
        });

        socket.emit('joinedRoom', { roomId, roomName: room.name });
      } catch (error) {
        console.error('Join room error:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Handle leaving a room
    socket.on('leaveRoom', (data) => {
      const { roomId } = data;
      socket.leave(roomId);
      connectedUsers.get(socket.userId).rooms.delete(roomId);

      // Notify other users in the room
      socket.to(roomId).emit('userLeftRoom', {
        roomId,
        user: {
          id: socket.userId,
          username: socket.user.username
        }
      });

      socket.emit('leftRoom', { roomId });
    });

    // Handle sending messages
    socket.on('sendMessage', async (data) => {
      try {
        const { roomId, content, messageType = 'text', replyTo } = data;

        // Validate input
        if (!content || content.trim().length === 0) {
          socket.emit('error', { message: 'Message content is required' });
          return;
        }

        if (content.length > 1000) {
          socket.emit('error', { message: 'Message too long' });
          return;
        }

        // Check if room exists and user is a member
        const room = await Room.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Room not found' });
          return;
        }

        const isMember = room.members.some(member => 
          member.user.toString() === socket.userId
        );

        if (!isMember) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Create and save message
        const message = new Message({
          content: content.trim(),
          sender: socket.userId,
          room: roomId,
          messageType,
          replyTo: replyTo || null
        });

        await message.save();
        await message.populate('sender', 'username avatar');
        if (replyTo) {
          await message.populate('replyTo', 'content sender');
        }

        // Update room's last activity
        room.lastActivity = new Date();
        await room.save();

        // Emit message to all users in the room
        io.to(roomId).emit('newMessage', {
          message: {
            _id: message._id,
            content: message.content,
            sender: message.sender,
            room: message.room,
            messageType: message.messageType,
            replyTo: message.replyTo,
            reactions: message.reactions,
            isEdited: message.isEdited,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt
          }
        });
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { roomId, isTyping } = data;
      socket.to(roomId).emit('userTyping', {
        userId: socket.userId,
        username: socket.user.username,
        isTyping
      });
    });

    // Handle message reactions
    socket.on('reactToMessage', async (data) => {
      try {
        const { messageId, emoji } = data;
        const message = await Message.findById(messageId);

        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(reaction => 
          reaction.user.toString() === socket.userId && 
          reaction.emoji === emoji
        );

        if (existingReaction) {
          // Remove reaction
          message.reactions = message.reactions.filter(reaction => 
            !(reaction.user.toString() === socket.userId && reaction.emoji === emoji)
          );
        } else {
          // Add reaction
          message.reactions.push({
            user: socket.userId,
            emoji
          });
        }

        await message.save();
        await message.populate('reactions.user', 'username');

        // Emit reaction update to all users in the room
        io.to(message.room.toString()).emit('messageReactionUpdate', {
          messageId,
          reactions: message.reactions
        });
      } catch (error) {
        console.error('React to message error:', error);
        socket.emit('error', { message: 'Failed to react to message' });
      }
    });

    // Handle user status updates
    socket.on('updateStatus', async (data) => {
      try {
        const { status } = data;
        
        if (!['online', 'away', 'offline'].includes(status)) {
          socket.emit('error', { message: 'Invalid status' });
          return;
        }

        await User.findByIdAndUpdate(socket.userId, {
          status,
          lastSeen: new Date()
        });

        // Update connected users map
        if (connectedUsers.has(socket.userId)) {
          connectedUsers.get(socket.userId).user.status = status;
        }

        // Broadcast status update to all connected users
        socket.broadcast.emit('userStatusUpdate', {
          userId: socket.userId,
          status,
          username: socket.user.username
        });
      } catch (error) {
        console.error('Update status error:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user.username} disconnected`);

      // Remove user from connected users
      connectedUsers.delete(socket.userId);

      // Update user status to offline
      await User.findByIdAndUpdate(socket.userId, {
        status: 'offline',
        lastSeen: new Date()
      });

      // Notify all connected users
      socket.broadcast.emit('userStatusUpdate', {
        userId: socket.userId,
        status: 'offline',
        username: socket.user.username
      });
    });
  });
};

module.exports = handleConnection;