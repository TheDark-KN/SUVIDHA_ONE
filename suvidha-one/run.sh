#!/bin/bash

#===============================================================================
# SUVIDHA ONE - Project Runner Script
# Ensures consistent versions across all dependencies
#===============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

# Fixed versions (must match package.json and docker-compose.yml)
NODE_VERSION="20"
NPM_VERSION="10"
NEXT_VERSION="14.2.35"
REACT_VERSION="18"
POSTGRES_VERSION="16-alpine"
REDIS_VERSION="7-alpine"
NGINX_VERSION="alpine"

echo -e "${BLUE}===============================================================================${NC}"
echo -e "${BLUE}                    SUVIDHA ONE - Project Setup & Runner${NC}"
echo -e "${BLUE}===============================================================================${NC}"
echo ""

#-------------------------------------------------------------------------------
# Function: Print status
#-------------------------------------------------------------------------------
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

#-------------------------------------------------------------------------------
# Function: Check prerequisites
#-------------------------------------------------------------------------------
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    echo ""

    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_INSTALLED=$(node -v)
        print_status "Node.js installed: $NODE_INSTALLED"
    else
        print_error "Node.js not found. Please install Node.js $NODE_VERSION"
        exit 1
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        NPM_INSTALLED=$(npm -v)
        print_status "npm installed: $NPM_INSTALLED"
    else
        print_error "npm not found. Please install npm"
        exit 1
    fi

    # Check Docker (optional)
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        print_status "Docker installed: $DOCKER_VERSION"
    else
        print_warning "Docker not found. Docker mode will be unavailable."
    fi

    # Check Docker Compose (optional)
    if command -v docker-compose &> /dev/null || docker compose version &> /dev/null; then
        print_status "Docker Compose installed"
    else
        print_warning "Docker Compose not found. Production mode will be unavailable."
    fi

    echo ""
}

#-------------------------------------------------------------------------------
# Function: Verify package versions
#-------------------------------------------------------------------------------
verify_versions() {
    echo -e "${YELLOW}Verifying package versions...${NC}"
    echo ""

    # Check package.json versions
    if [ -f "package.json" ]; then
        PACKAGE_NEXT=$(node -e "console.log(require('./package.json').dependencies.next)")
        PACKAGE_REACT=$(node -e "console.log(require('./package.json').dependencies.react)")
        PACKAGE_REACT_QUERY=$(node -e "console.log(require('./package.json').dependencies['@tanstack/react-query'])")
        
        print_status "Next.js: $PACKAGE_NEXT (expected: $NEXT_VERSION)"
        print_status "React: $PACKAGE_REACT (expected: ^$REACT_VERSION)"
        print_status "React Query: $PACKAGE_REACT_QUERY"
    else
        print_error "package.json not found!"
        exit 1
    fi

    # Check package-lock.json
    if [ -f "package-lock.json" ]; then
        print_status "package-lock.json found (locked versions)"
    else
        print_warning "package-lock.json not found. Run 'npm install' first."
    fi

    echo ""
}

#-------------------------------------------------------------------------------
# Function: Install dependencies
#-------------------------------------------------------------------------------
install_dependencies() {
    echo -e "${YELLOW}Installing dependencies...${NC}"
    echo ""

    # Clean install
    if [ -d "node_modules" ]; then
        print_warning "Removing existing node_modules..."
        rm -rf node_modules
    fi

    if [ -f "package-lock.json" ]; then
        print_status "Running clean install with locked versions..."
        npm ci
    else
        print_status "Installing dependencies..."
        npm install
    fi

    print_status "Dependencies installed successfully"
    echo ""
}

#-------------------------------------------------------------------------------
# Function: Run development mode
#-------------------------------------------------------------------------------
run_dev() {
    echo -e "${GREEN}===============================================================================${NC}"
    echo -e "${GREEN}                    Starting Development Mode${NC}"
    echo -e "${GREEN}===============================================================================${NC}"
    echo ""

    print_status "Starting Next.js development server..."
    echo ""
    echo -e "${BLUE}Application will be available at: http://localhost:3000${NC}"
    echo ""

    npm run dev
}

#-------------------------------------------------------------------------------
# Function: Build for production
#-------------------------------------------------------------------------------
build_production() {
    echo -e "${GREEN}===============================================================================${NC}"
    echo -e "${GREEN}                    Building for Production${NC}"
    echo -e "${GREEN}===============================================================================${NC}"
    echo ""

    print_status "Building Next.js application..."
    npm run build

    print_status "Build completed successfully"
    echo ""
}

#-------------------------------------------------------------------------------
# Function: Run production mode (standalone)
#-------------------------------------------------------------------------------
run_production() {
    echo -e "${GREEN}===============================================================================${NC}"
    echo -e "${GREEN}                    Starting Production Mode${NC}"
    echo -e "${GREEN}===============================================================================${NC}"
    echo ""

    # Build first if not already built
    if [ ! -d ".next/standalone" ]; then
        print_warning "Production build not found. Building first..."
        build_production
    fi

    print_status "Starting Next.js production server..."
    echo ""
    echo -e "${BLUE}Application will be available at: http://localhost:3000${NC}"
    echo ""

    npm run start
}

#-------------------------------------------------------------------------------
# Function: Run with Docker Compose (development)
#-------------------------------------------------------------------------------
run_docker_dev() {
    echo -e "${GREEN}===============================================================================${NC}"
    echo -e "${GREEN}                    Starting Docker Development Mode${NC}"
    echo -e "${GREEN}===============================================================================${NC}"
    echo ""

    print_status "Building and starting Docker containers..."
    echo ""
    echo -e "${BLUE}Application will be available at: http://localhost:3000${NC}"
    echo ""

    docker-compose up --build
}

#-------------------------------------------------------------------------------
# Function: Run with Docker Compose (production)
#-------------------------------------------------------------------------------
run_docker_prod() {
    echo -e "${GREEN}===============================================================================${NC}"
    echo -e "${GREEN}                    Starting Docker Production Mode${NC}"
    echo -e "${GREEN}===============================================================================${NC}"
    echo ""

    print_status "Building and starting production containers..."
    echo ""
    echo -e "${BLUE}Application will be available at: http://localhost:3000${NC}"
    echo -e "${BLUE}API Gateway will be available at: http://localhost:80${NC}"
    echo -e "${BLUE}PostgreSQL will be available at: localhost:5432${NC}"
    echo -e "${BLUE}Redis will be available at: localhost:6379${NC}"
    echo ""

    docker-compose -f docker-compose.production.yml up --build -d
}

#-------------------------------------------------------------------------------
# Function: Stop Docker containers
#-------------------------------------------------------------------------------
stop_docker() {
    echo -e "${YELLOW}Stopping Docker containers...${NC}"
    
    docker-compose -f docker-compose.production.yml down
    docker-compose down 2>/dev/null || true
    
    print_status "All containers stopped"
}

#-------------------------------------------------------------------------------
# Function: Show usage
#-------------------------------------------------------------------------------
show_usage() {
    echo "SUVIDHA ONE - Project Runner"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  dev         Run in development mode (default)"
    echo "  build       Build for production"
    echo "  prod        Run in production mode (standalone)"
    echo "  docker-dev  Run with Docker Compose (development)"
    echo "  docker-prod Run with Docker Compose (production)"
    echo "  stop        Stop Docker containers"
    echo "  clean       Clean node_modules and build artifacts"
    echo "  verify      Verify installed versions"
    echo "  help        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 dev          # Start development server"
    echo "  $0 build        # Build production bundle"
    echo "  $0 docker-prod  # Start full production stack"
    echo ""
}

#-------------------------------------------------------------------------------
# Function: Clean build artifacts
#-------------------------------------------------------------------------------
clean() {
    echo -e "${YELLOW}Cleaning build artifacts...${NC}"
    
    if [ -d "node_modules" ]; then
        print_warning "Removing node_modules..."
        rm -rf node_modules
    fi
    
    if [ -d ".next" ]; then
        print_warning "Removing .next..."
        rm -rf .next
    fi
    
    if [ -d "out" ]; then
        print_warning "Removing out..."
        rm -rf out
    fi

    print_status "Clean completed"
}

#-------------------------------------------------------------------------------
# Main execution
#-------------------------------------------------------------------------------

# Parse command line arguments
COMMAND="${1:-dev}"

case "$COMMAND" in
    dev)
        check_prerequisites
        verify_versions
        install_dependencies
        run_dev
        ;;
    build)
        check_prerequisites
        verify_versions
        install_dependencies
        build_production
        ;;
    prod)
        check_prerequisites
        verify_versions
        install_dependencies
        build_production
        run_production
        ;;
    docker-dev)
        check_prerequisites
        run_docker_dev
        ;;
    docker-prod)
        check_prerequisites
        run_docker_prod
        ;;
    stop)
        stop_docker
        ;;
    clean)
        clean
        ;;
    verify)
        check_prerequisites
        verify_versions
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        print_error "Unknown command: $COMMAND"
        echo ""
        show_usage
        exit 1
        ;;
esac
