#!/bin/bash

# Environment Setup Script for MERN Chat Application
set -e

echo "🔧 Setting up environment for MERN Chat..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Create backend .env file
setup_backend_env() {
    print_status "Setting up backend environment..."
    
    if [[ ! -f "backend/.env" ]]; then
        cp backend/.env.example backend/.env
        print_status "Created backend/.env from template"
        print_warning "Please update the environment variables in backend/.env"
    else
        print_warning "backend/.env already exists"
    fi
}

# Create frontend .env file
setup_frontend_env() {
    print_status "Setting up frontend environment..."
    
    if [[ ! -f "frontend/.env" ]]; then
        cp frontend/.env.example frontend/.env
        print_status "Created frontend/.env from template"
        print_warning "Please update the environment variables in frontend/.env"
    else
        print_warning "frontend/.env already exists"
    fi
}

# Generate JWT secret
generate_jwt_secret() {
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 32)
        print_status "Generated JWT secret: $JWT_SECRET"
        print_warning "Please add this to your backend/.env file as JWT_SECRET"
    else
        print_warning "OpenSSL not found. Please generate a secure JWT secret manually."
    fi
}

# Setup MongoDB
setup_mongodb() {
    print_status "MongoDB setup instructions:"
    echo "1. Create a MongoDB Atlas account at https://www.mongodb.com/atlas"
    echo "2. Create a new cluster"
    echo "3. Create a database user"
    echo "4. Get your connection string"
    echo "5. Update MONGODB_URI in backend/.env"
    echo ""
    print_warning "For local development, you can use: mongodb://localhost:27017/mern-chat"
}

# Setup deployment platforms
setup_deployment() {
    print_status "Deployment platform setup:"
    echo ""
    echo "Backend deployment options:"
    echo "1. Render: https://render.com"
    echo "2. Railway: https://railway.app"
    echo "3. Heroku: https://heroku.com"
    echo ""
    echo "Frontend deployment options:"
    echo "1. Vercel: https://vercel.com"
    echo "2. Netlify: https://netlify.com"
    echo "3. GitHub Pages: https://pages.github.com"
    echo ""
    print_warning "Create accounts on your preferred platforms and update deployment configs"
}

# Main setup function
main() {
    print_status "MERN Chat Environment Setup"
    print_status "==========================="
    
    setup_backend_env
    setup_frontend_env
    generate_jwt_secret
    setup_mongodb
    setup_deployment
    
    print_status "✅ Environment setup completed!"
    print_status ""
    print_status "Next steps:"
    echo "1. Update environment variables in .env files"
    echo "2. Set up MongoDB database"
    echo "3. Create accounts on deployment platforms"
    echo "4. Run 'pnpm run dev' to start development"
    echo "5. Run deployment script when ready for production"
}

# Run the main function
main "$@"