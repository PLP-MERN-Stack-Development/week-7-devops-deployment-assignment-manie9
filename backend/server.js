const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Socket.io configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? [process.env.FRONTEND_URL, process.env.FRONTEND_URL_ALT]
      : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "ws:", "wss:"],
    },
  },
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL, process.env.FRONTEND_URL_ALT]
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Logging
if (process.env.NODE_ENV === 'production') {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Database connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
      bufferMaxEntries: 0,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Create general room after DB connection
    await createGeneralRoom();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create general room function
const createGeneralRoom = async () => {
  try {
    const Room = require('./models/Room');
    const User = require('./models/User');

    // Check if general room already exists
    const existingRoom = await Room.findOne({ isGeneral: true });
    if (existingRoom) {
      return;
    }

    // Create a system user if it doesn't exist
    let systemUser = await User.findOne({ email: 'system@chatapp.com' });
    if (!systemUser) {
      systemUser = new User({
        username: 'System',
        email: 'system@chatapp.com',
        password: 'system123456'
      });
      await systemUser.save();
    }

    // Create general room
    const generalRoom = new Room({
      name: 'General',
      description: 'Welcome to the general chat room! This is where everyone can chat together.',
      isPrivate: false,
      creator: systemUser._id,
      isGeneral: true,
      maxMembers: 1000,
      members: [{
        user: systemUser._id,
        role: 'admin'
      }]
    });

    await generalRoom.save();
    console.log('General room created successfully');
  } catch (error) {
    console.error('Error creating general room:', error);
  }
};

// Socket.io connection handling
require('./socket/socketHandlers')(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/users', require('./routes/users'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    message: 'Chat API is running',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      rooms: '/api/rooms',
      messages: '/api/messages',
      users: '/api/users',
      health: '/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Something went wrong!' });
  } else {
    res.status(500).json({ 
      message: err.message,
      stack: err.stack 
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    process.exit(0);
  });
});

// Start server
const startServer = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

startServer();

module.exports = { app, server, io };