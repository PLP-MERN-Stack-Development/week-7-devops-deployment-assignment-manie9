const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Room = require('./models/Room');
const Message = require('./models/Message');
const User = require('./models/User');
require('dotenv').config({ path: './.env' });

const MONGODB_URI = process.env.MONGODB_URI;
const JWT_SECRET = process.env.JWT_SECRET;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set');
  process.exit(1);
}

if (!JWT_SECRET) {
  console.error('JWT_SECRET environment variable is not set');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB for socket server'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const server = http.createServer();
const io = new Server(server, {
  cors: {
    origin: '*', // Adjust this to your frontend URL in production
    methods: ['GET', 'POST']
  }
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    socket.user = user;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.user._id})`);

  socket.on('joinRoom', async ({ roomId }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      // Check if user is member for private rooms
      if (room.isPrivate) {
        const isMember = room.members.some(member => member.user.toString() === socket.user._id.toString());
        if (!isMember) {
          socket.emit('error', { message: 'Access denied to private room' });
          return;
        }
      }
      socket.join(roomId);
      io.to(roomId).emit('userJoinedRoom', { userId: socket.user._id, username: socket.user.username, roomId });
      console.log(`${socket.user.username} joined room ${room.name}`);
    } catch (error) {
      console.error('joinRoom error:', error);
      socket.emit('error', { message: 'Server error joining room' });
    }
  });

  socket.on('leaveRoom', ({ roomId }) => {
    socket.leave(roomId);
    io.to(roomId).emit('userLeftRoom', { userId: socket.user._id, username: socket.user.username, roomId });
    console.log(`${socket.user.username} left room ${roomId}`);
  });

  socket.on('sendMessage', async ({ roomId, content, replyTo }) => {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        socket.emit('error', { message: 'Room not found' });
        return;
      }
      // Check if user is member for private rooms
      if (room.isPrivate) {
        const isMember = room.members.some(member => member.user.toString() === socket.user._id.toString());
        if (!isMember) {
          socket.emit('error', { message: 'Access denied to private room' });
          return;
        }
      }
      const message = new Message({
        content,
        sender: socket.user._id,
        room: roomId,
        messageType: 'text',
        replyTo: replyTo || null
      });
      await message.save();
      await message.populate('sender', 'username avatar');
      if (replyTo) {
        await message.populate('replyTo', 'content sender');
      }
      room.lastActivity = new Date();
      await room.save();
      io.to(roomId).emit('newMessage', { message });
      console.log(`Message sent by ${socket.user.username} in room ${room.name}`);
    } catch (error) {
      console.error('sendMessage error:', error);
      socket.emit('error', { message: 'Server error sending message' });
    }
  });

  socket.on('typing', ({ roomId, isTyping }) => {
    socket.to(roomId).emit('userTyping', {
      userId: socket.user._id,
      username: socket.user.username,
      roomId,
      isTyping
    });
  });

  socket.on('reactToMessage', async ({ messageId, emoji }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) {
        socket.emit('error', { message: 'Message not found' });
        return;
      }
      const existingReaction = message.reactions.find(reaction =>
        reaction.user.toString() === socket.user._id.toString() &&
        reaction.emoji === emoji
      );
      if (existingReaction) {
        message.reactions = message.reactions.filter(reaction =>
          !(reaction.user.toString() === socket.user._id.toString() && reaction.emoji === emoji)
        );
      } else {
        message.reactions.push({
          user: socket.user._id,
          emoji
        });
      }
      await message.save();
      io.to(message.room.toString()).emit('messageReactionUpdate', {
        messageId: message._id,
        reactions: message.reactions
      });
    } catch (error) {
      console.error('reactToMessage error:', error);
      socket.emit('error', { message: 'Server error reacting to message' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.user.username}`);
  });
});

const PORT = process.env.SOCKET_PORT || 5000;
server.listen(PORT, () => {
  console.log(`Socket.io server listening on port ${PORT}`);
});
