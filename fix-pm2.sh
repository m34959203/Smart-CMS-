#!/bin/bash

# ==========================================
# PM2 Quick Fix Script
# ==========================================
# Fixes common PM2 errors:
# - aimak-api: "Cannot read properties of undefined (reading 'ADMIN')"
# - aimak-web: "Cannot find module 'next/dist/bin/next'"
#
# Usage: sudo bash fix-pm2.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

echo ""
echo "========================================"
echo "  AIMAK PM2 Quick Fix Script"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "ecosystem.config.js" ]; then
    error "ecosystem.config.js not found!"
    echo "Please run this script from: /var/www/vhosts/aimaqaqshamy.kz/httpdocs"
    exit 1
fi

# Step 1: Stop PM2
info "Step 1/6: Stopping PM2 processes..."
pm2 stop all 2>/dev/null || true

# Step 2: Install dependencies
info "Step 2/6: Reinstalling dependencies..."
pnpm install --force

# Step 3: Generate Prisma client (CRITICAL for Role.ADMIN error)
info "Step 3/6: Regenerating Prisma client..."
cd apps/api
pnpm prisma generate
cd ../..
info "Prisma client generated successfully!"

# Step 4: Rebuild API
info "Step 4/6: Rebuilding API..."
pnpm --filter api build

# Step 5: Rebuild Web
info "Step 5/6: Rebuilding Web..."
pnpm --filter web build

# Step 6: Restart PM2
info "Step 6/6: Restarting PM2..."
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================"
info "Fix completed!"
echo "========================================"
echo ""

# Show status
pm2 status

echo ""
info "Checking logs (last 10 lines)..."
echo ""
pm2 logs --lines 10 --nostream 2>/dev/null || true

echo ""
echo "If apps are still errored, check full logs with:"
echo "  pm2 logs aimak-api --lines 50"
echo "  pm2 logs aimak-web --lines 50"
echo ""
