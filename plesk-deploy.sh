#!/bin/bash

# ==========================================
# Plesk Deployment Script
# ==========================================
# This script handles deployment on Plesk hosting
# Usage: bash plesk-deploy.sh

set -e  # Exit on any error

echo "🚀 AIMAK Deployment Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored messages
info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    error "package.json not found. Please run this script from the project root."
    exit 1
fi

info "Starting deployment process..."
echo ""

# 1. Check Node.js version
info "Checking Node.js version..."
NODE_VERSION=$(node --version)
info "Node.js version: $NODE_VERSION"

# Check if Node.js version is 18 or higher
NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
    error "Node.js 18 or higher is required. Current version: $NODE_VERSION"
    exit 1
fi

# 2. Install pnpm if not available
if ! command -v pnpm &> /dev/null; then
    info "Installing pnpm..."
    npm install -g pnpm
else
    info "pnpm is already installed: $(pnpm --version)"
fi

# 3. Install dependencies
info "Installing dependencies..."
pnpm install --frozen-lockfile

# 3.1 Install root-level proxy dependencies
info "Installing proxy dependencies..."
npm install http-proxy --save

# 4. Check environment files
info "Checking environment files..."

if [ ! -f "apps/api/.env" ]; then
    warn "apps/api/.env not found, copying from .env.example"
    cp apps/api/.env.example apps/api/.env
    warn "⚠️  Please configure apps/api/.env before running the application!"
fi

if [ ! -f "apps/web/.env" ]; then
    warn "apps/web/.env not found, copying from .env.example"
    cp apps/web/.env.example apps/web/.env
    warn "⚠️  Please configure apps/web/.env before running the application!"
fi

# 5. Generate Prisma client
info "Generating Prisma client..."
cd apps/api
pnpm prisma generate
cd ../..

# 6. Build API
info "Building API..."
pnpm --filter api build

# 7. Build Web
info "Building Web..."
pnpm --filter web build

# 8. Create uploads directory
info "Creating uploads directory..."
mkdir -p uploads
chmod 755 uploads

# 9. Run database migrations (if DB is configured)
info "Running database migrations..."
cd apps/api
if pnpm prisma migrate deploy 2>/dev/null; then
    info "Database migrations completed successfully"
else
    warn "Database migrations failed - make sure DATABASE_URL is configured in apps/api/.env"
fi
cd ../..

echo ""
echo "================================================"
info "✅ Deployment completed successfully!"
echo "================================================"
echo ""
echo "📝 Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit apps/api/.env"
echo "   - Edit apps/web/.env"
echo ""
echo "2. Configure Node.js in Plesk:"
echo "   - Go to: Websites & Domains → Node.js"
echo "   - Set Application mode: production"
echo "   - Set Application root: httpdocs"
echo "   - Set Application startup file: See below"
echo ""
echo "3. Create admin user:"
echo "   cd apps/api && node scripts/create-admin.js"
echo ""
echo "4. Start the application:"
echo "   - API: node apps/api/dist/main.js"
echo "   - Web: cd apps/web && node node_modules/next/dist/bin/next start"
echo ""
echo "5. Or use PM2 (recommended):"
echo "   pm2 start ecosystem.config.js"
echo ""
echo "📚 See PLESK_DEPLOYMENT.md for detailed instructions"
echo ""
