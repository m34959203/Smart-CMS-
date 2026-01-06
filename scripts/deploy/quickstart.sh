#!/bin/bash

# ==========================================
# AIMAK Quick Start Script for PS.kz
# ==========================================
# One-command deployment for PS.kz hosting
# Usage:
#   bash quickstart.sh           # Interactive mode
#   bash quickstart.sh -y        # Auto mode (skip prompts)
#   sudo bash quickstart.sh -y   # Run as root with auto mode

set -e  # Exit on any error

# Check for auto mode
AUTO_MODE=false
if [ "$1" == "-y" ] || [ "$1" == "--yes" ] || [ "$1" == "--auto" ]; then
    AUTO_MODE=true
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to print colored messages
print_header() {
    echo ""
    echo -e "${BOLD}${CYAN}========================================${NC}"
    echo -e "${BOLD}${CYAN}$1${NC}"
    echo -e "${BOLD}${CYAN}========================================${NC}"
    echo ""
}

info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

step() {
    echo -e "${BLUE}▶${NC} ${BOLD}$1${NC}"
}

# Print welcome message
clear
echo ""
echo -e "${BOLD}${CYAN}"
cat << "EOF"
   ___    ____  __  ___    __ __
  / _ |  /  _/ /  |/  /   / // /
 / __ | _/ /  / /|_/ /   / _  /
/_/ |_|/___/ /_/  /_/   /_//_/

Quick Start for PS.kz Hosting
EOF
echo -e "${NC}"

print_header "AIMAK Quick Start - PS.kz"

info "Server: 82.115.49.251"
info "Domain: aimaqaqshamy.kz"
info "Location: Astana, Kazakhstan"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Ask for confirmation (unless auto mode)
echo -e "${YELLOW}This script will:${NC}"
echo "  1. Install all dependencies"
echo "  2. Setup environment configuration"
echo "  3. Build the application"
echo "  4. Initialize database"
echo "  5. Start the application with PM2"
echo ""

if [ "$AUTO_MODE" = true ]; then
    info "Auto mode enabled - skipping confirmation"
else
    read -p "Continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        warn "Installation cancelled."
        exit 0
    fi
fi

# ==========================================
# Step 1: Check Node.js version
# ==========================================
print_header "Step 1: Checking Node.js"

step "Checking Node.js version..."
NODE_VERSION=$(node --version)
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')

if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 18 or higher is required. Current version: $NODE_VERSION"
    error "Please upgrade Node.js and try again."
    exit 1
fi

info "Node.js version: $NODE_VERSION ✓"

# ==========================================
# Step 2: Install pnpm
# ==========================================
print_header "Step 2: Installing pnpm"

step "Checking for pnpm..."
if ! command -v pnpm &> /dev/null; then
    step "Installing pnpm globally..."
    npm install -g pnpm
    info "pnpm installed successfully"
else
    info "pnpm is already installed: $(pnpm --version)"
fi

# ==========================================
# Step 3: Install PM2
# ==========================================
print_header "Step 3: Installing PM2"

step "Checking for PM2..."
if ! command -v pm2 &> /dev/null; then
    step "Installing PM2 globally..."
    npm install -g pm2
    info "PM2 installed successfully"
else
    info "PM2 is already installed: $(pm2 --version)"
fi

# ==========================================
# Step 4: Install dependencies
# ==========================================
print_header "Step 4: Installing dependencies"

step "Installing project dependencies..."
pnpm install --frozen-lockfile

step "Installing root-level proxy dependencies..."
npm install http-proxy --save

info "Dependencies installed successfully"

# ==========================================
# Step 5: Setup environment
# ==========================================
print_header "Step 5: Setting up environment"

step "Creating environment files..."
bash setup-env.sh

info "Environment files created"

# Ask if user wants to add OpenRouter API key (unless auto mode)
if [ "$AUTO_MODE" = true ]; then
    warn "AI features disabled (auto mode). Add key later in apps/api/.env"
else
    echo ""
    warn "AI features require an OpenRouter API key"
    read -p "Do you have an OpenRouter API key? (y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenRouter API key: " OPENROUTER_KEY
        if [ ! -z "$OPENROUTER_KEY" ]; then
            # Update the API key in .env file
            sed -i "s|OPENROUTER_API_KEY=your-openrouter-api-key-here|OPENROUTER_API_KEY=$OPENROUTER_KEY|g" apps/api/.env
            info "OpenRouter API key configured"
        fi
    else
        warn "Skipping OpenRouter configuration. AI features will be disabled."
        warn "You can add the key later in apps/api/.env"
    fi
fi

# ==========================================
# Step 6: Generate Prisma client
# ==========================================
print_header "Step 6: Generating Prisma client"

step "Generating Prisma client..."
cd apps/api
pnpm prisma generate
cd ../..

info "Prisma client generated"

# ==========================================
# Step 7: Build applications
# ==========================================
print_header "Step 7: Building applications"

step "Building API..."
pnpm --filter api build

step "Building Web..."
pnpm --filter web build

info "Applications built successfully"

# ==========================================
# Step 8: Setup directories
# ==========================================
print_header "Step 8: Creating directories"

step "Creating required directories..."
mkdir -p uploads logs
chmod 755 uploads logs

info "Directories created"

# ==========================================
# Step 9: Initialize database
# ==========================================
print_header "Step 9: Initializing database"

step "Running database migrations..."
cd apps/api
if pnpm prisma migrate deploy 2>/dev/null; then
    info "Database migrations completed successfully"
else
    warn "Database migrations failed"
    warn "This is normal if the database is not yet configured"
    warn "You can run migrations later with: cd apps/api && pnpm prisma migrate deploy"
fi
cd ../..

# ==========================================
# Step 10: Start applications
# ==========================================
print_header "Step 10: Starting applications"

step "Stopping any existing PM2 processes..."
pm2 delete all 2>/dev/null || true

step "Starting applications with PM2..."
pm2 start ecosystem.config.js

step "Saving PM2 configuration..."
pm2 save

step "Setting up PM2 to start on boot..."
pm2 startup 2>/dev/null || warn "Could not setup PM2 startup (may require sudo)"

info "Applications started successfully"

# ==========================================
# Success message
# ==========================================
print_header "Installation Complete!"

info "AIMAK has been successfully deployed!"
echo ""
echo -e "${BOLD}${CYAN}Your application is running:${NC}"
echo ""
echo -e "  ${BOLD}Web:${NC}       http://localhost:3000"
echo -e "  ${BOLD}API:${NC}       http://localhost:4000"
echo -e "  ${BOLD}Public:${NC}    https://aimaqaqshamy.kz"
echo -e "  ${BOLD}Admin:${NC}     https://aimaqaqshamy.kz/admin"
echo ""
echo -e "${BOLD}${CYAN}Default admin credentials:${NC}"
echo -e "  ${BOLD}Email:${NC}     admin@aimakakshamy.kz"
echo -e "  ${BOLD}Password:${NC}  admin123"
echo ""
warn "IMPORTANT: Change the admin password immediately!"
echo ""

# ==========================================
# Next steps
# ==========================================
echo -e "${BOLD}${CYAN}Next steps:${NC}"
echo ""
echo "1. Configure Nginx proxy in Plesk:"
echo "   - Go to: Websites & Domains → Apache & nginx Settings"
echo "   - Add the nginx directives from PS_KZ_QUICKSTART.md"
echo ""
echo "2. Setup SSL certificate:"
echo "   - Go to: SSL/TLS Certificates → Install (Let's Encrypt)"
echo ""
echo "3. Access admin panel:"
echo "   - Open: https://aimaqaqshamy.kz/admin"
echo "   - Login with credentials above"
echo "   - Change password immediately"
echo ""
echo "4. Check application status:"
echo "   pm2 status"
echo "   pm2 logs"
echo ""

# ==========================================
# Useful commands
# ==========================================
echo -e "${BOLD}${CYAN}Useful PM2 commands:${NC}"
echo ""
echo "  pm2 status          # Check application status"
echo "  pm2 logs            # View logs"
echo "  pm2 restart all     # Restart applications"
echo "  pm2 stop all        # Stop applications"
echo "  pm2 monit           # Real-time monitoring"
echo ""

# ==========================================
# Display application status
# ==========================================
print_header "Application Status"
pm2 status

echo ""
info "Setup completed successfully!"
echo ""
echo -e "${CYAN}For more information, see:${NC}"
echo "  - PS_KZ_DEPLOYMENT.md (Full deployment guide)"
echo "  - plesk-nginx.conf (Nginx configuration for Plesk)"
echo "  - fix-pm2.sh (Troubleshooting script)"
echo ""
echo -e "${YELLOW}IMPORTANT: Configure nginx in Plesk!${NC}"
echo "  Copy content from plesk-nginx.conf to:"
echo "  Plesk -> Apache & nginx Settings -> Additional nginx directives"
echo ""
