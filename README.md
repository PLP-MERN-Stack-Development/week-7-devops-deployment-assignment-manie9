# MERN Chat Application

A modern, real-time multi-room chat application built with the MERN stack (MongoDB, Express.js, React, Node.js) and Socket.io for real-time communication.

## 🚀 Features

- **Real-time messaging** with Socket.io
- **Multi-room support** with public and private rooms
- **User authentication** with JWT
- **Typing indicators** and online status
- **Message reactions** and replies
- **Responsive design** with Tailwind CSS v4
- **Modern UI/UX** with smooth animations
- **Production-ready** with comprehensive error handling
- **CI/CD pipelines** with GitHub Actions
- **Deployment configurations** for multiple platforms

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time communication
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate limiting** and CORS protection

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS v4** for styling
- **Zustand** for state management
- **React Hook Form** for form handling
- **Socket.io Client** for real-time features
- **React Router** for navigation

### DevOps & Deployment
- **GitHub Actions** for CI/CD
- **Docker** support (optional)
- **Render/Railway** for backend hosting
- **Vercel/Netlify** for frontend hosting
- **MongoDB Atlas** for database hosting

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- MongoDB (local or Atlas)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-chat-app
   ```

2. **Install dependencies**
   ```bash
   pnpm run install-deps
   ```

3. **Set up environment variables**
   ```bash
   chmod +x scripts/setup-env.sh
   ./scripts/setup-env.sh
   ```

4. **Update environment files**
   - Edit `backend/.env` with your MongoDB URI and JWT secret
   - Edit `frontend/.env` with your API URLs

5. **Start development servers**
   ```bash
   pnpm run dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## 🔧 Environment Variables

### Backend (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/mern-chat
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
```

## 🚀 Deployment

### Automated Deployment

Use the deployment script:
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

### Manual Deployment

#### Backend (Render/Railway/Heroku)

1. **Render**
   - Connect your GitHub repository
   - Use `backend` as the root directory
   - Set environment variables in dashboard
   - Deploy automatically on push

2. **Railway**
   - Connect GitHub repository
   - Configure environment variables
   - Deploy with one click

#### Frontend (Vercel/Netlify)

1. **Vercel**
   - Connect GitHub repository
   - Set root directory to `frontend`
   - Configure environment variables
   - Deploy automatically

2. **Netlify**
   - Connect GitHub repository
   - Set build directory to `frontend/dist`
   - Configure environment variables

## 🧪 Testing

### Run all tests
```bash
pnpm test
```

### Backend tests only
```bash
cd backend && pnpm test
```

### Frontend tests only
```bash
cd frontend && pnpm test
```

## 📊 Monitoring

### Health Checks
The application includes health check endpoints:
- Backend: `/health`
- API Status: `/api/status`

### Monitoring Setup
1. Configure uptime monitoring (UptimeRobot, Pingdom)
2. Set up error tracking (Sentry)
3. Monitor performance metrics
4. Set up alerts for downtime

## 🔒 Security Features

- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **CORS** configuration
- **JWT** authentication
- **Password hashing** with bcrypt
- **Input validation** and sanitization
- **Environment variable** protection

## 🏗️ Project Structure

```
mern-chat-app/
├── backend/                 # Express.js backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── socket/             # Socket.io handlers
│   └── __tests__/          # Backend tests
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── stores/         # Zustand stores
│   │   ├── contexts/       # React contexts
│   │   └── test/           # Frontend tests
├── .github/workflows/      # GitHub Actions
├── deployment/             # Deployment configs
├── monitoring/             # Monitoring setup
├── scripts/                # Utility scripts
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new features
5. Ensure all tests pass
6. Submit a pull request

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Room Endpoints
- `GET /api/rooms` - Get all rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room by ID
- `POST /api/rooms/:id/join` - Join room
- `POST /api/rooms/:id/leave` - Leave room

### Message Endpoints
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/messages` - Send message
- `PUT /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message
- `POST /api/messages/:id/react` - React to message

## 🔧 Development

### Available Scripts

```bash
# Development
pnpm run dev          # Start both frontend and backend
pnpm run server       # Start backend only
pnpm run client       # Start frontend only

# Building
pnpm run build        # Build frontend for production

# Testing
pnpm test             # Run all tests
pnpm run test:watch   # Run tests in watch mode

# Deployment
pnpm start            # Start production server
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Socket.io for real-time communication
- Tailwind CSS for beautiful styling
- MongoDB Atlas for database hosting
- Vercel/Netlify for frontend hosting
- Render/Railway for backend hosting

## 📞 Support

If you have any questions or need help with deployment, please:
1. Check the documentation
2. Search existing issues
3. Create a new issue with detailed information

---

**Happy Chatting! 🎉**

Render : https://real-time-multi-chat-room.onrender.com

vercel : 