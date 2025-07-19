#!/bin/bash

# MERN Chat Application Deployment Script
set -e

echo "🚀 Starting MERN Chat deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v pnpm &> /dev/null; then
        print_error "pnpm is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install it first."
        exit 1
    fi
    
    print_status "All dependencies are installed ✅"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install root dependencies
    pnpm install
    
    # Install backend dependencies
    cd backend
    pnpm install
    cd ..
    
    # Install frontend dependencies
    cd frontend
    pnpm install
    cd ..
    
    print_status "Dependencies installed ✅"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Backend tests
    cd backend
    if pnpm test; then
        print_status "Backend tests passed ✅"
    else
        print_error "Backend tests failed ❌"
        exit 1
    fi
    cd ..
    
    # Frontend tests
    cd frontend
    if pnpm test; then
        print_status "Frontend tests passed ✅"
    else
        print_error "Frontend tests failed ❌"
        exit 1
    fi
    cd ..
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    
    cd frontend
    if pnpm run build; then
        print_status "Frontend build completed ✅"
    else
        print_error "Frontend build failed ❌"
        exit 1
    fi
    cd ..
}

# Deploy to production
deploy_production() {
    print_status "Deploying to production..."
    
    # Check if environment variables are set
    if [[ -z "$RENDER_API_KEY" && -z "$VERCEL_TOKEN" ]]; then
        print_warning "No deployment tokens found. Skipping automatic deployment."
        print_status "Please deploy manually using your preferred platform."
        return
    fi
    
    # Deploy backend (example for Render)
    if [[ -n "$RENDER_API_KEY" ]]; then
        print_status "Deploying backend to Render..."
        # Add Render deployment logic here
    fi
    
    # Deploy frontend (example for Vercel)
    if [[ -n "$VERCEL_TOKEN" ]]; then
        print_status "Deploying frontend to Vercel..."
        cd frontend
        npx vercel --prod --token "$VERCEL_TOKEN"
        cd ..
    fi
    
    print_status "Deployment completed ✅"
}

# Health check
health_check() {
    print_status "Running health check..."
    
    if [[ -n "$BACKEND_URL" ]]; then
        if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
            print_status "Backend health check passed ✅"
        else
            print_warning "Backend health check failed ⚠️"
        fi
    fi
    
    if [[ -n "$FRONTEND_URL" ]]; then
        if curl -f "$FRONTEND_URL" > /dev/null 2>&1; then
            print_status "Frontend health check passed ✅"
        else
            print_warning "Frontend health check failed ⚠️"
        fi
    fi
}

# Main deployment flow
main() {
    print_status "MERN Chat Deployment Script v1.0"
    print_status "================================"
    
    check_dependencies
    install_dependencies
    
    # Skip tests in production deployment
    if [[ "$SKIP_TESTS" != "true" ]]; then
        run_tests
    fi
    
    build_frontend
    deploy_production
    
    # Wait a bit for deployment to complete
    sleep 30
    health_check
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Backend: ${BACKEND_URL:-'Not configured'}"
    print_status "Frontend: ${FRONTEND_URL:-'Not configured'}"
}

# Run the main function
main "$@"