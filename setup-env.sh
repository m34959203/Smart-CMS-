#!/bin/bash
# Configuration setup script for Plesk hosting
# This script copies environment files to the correct locations

echo "Setting up environment files..."

# Create API .env file
cat > apps/api/.env << 'EOF'
# Database - Plesk PostgreSQL
DATABASE_URL="postgresql://aimaqaq1_user:!RtAsH^Hkur8e43w@srv-db-pgsql01.ps.kz:5432/aimaqaq1_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
PORT=4000
NODE_ENV=production

# URLs
APP_URL=https://aimaqaqshamy.kz
FRONTEND_URL=https://aimaqaqshamy.kz

# JWT Secrets
JWT_SECRET=OFvVxx4PkG6oAJEkjFCb0Nhd23yQdBc6yz1Y0B9wyEg=
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=EdTaNNeBcnOEgA/uJ/x7GWxlSogwhMTkMa7/pRHXRH0=
JWT_REFRESH_EXPIRES_IN=7d

# File Upload
UPLOAD_DIR=/var/www/vhosts/aimaqaqshamy.kz/httpdocs/uploads
MAX_FILE_SIZE=5242880

# AI (Optional - add your key if needed)
OPENROUTER_API_KEY=your-openrouter-api-key-here
OPENROUTER_MODEL=qwen/qwen3-32b-128k:free

# Rate Limiting
RATE_LIMIT_PUBLIC=100
RATE_LIMIT_AUTHENTICATED=1000
EOF

# Create Web .env file
cat > apps/web/.env << 'EOF'
# API Configuration
NEXT_PUBLIC_API_URL=https://aimaqaqshamy.kz/api

# Application Info
NEXT_PUBLIC_APP_NAME=Aimak Akshamy
NEXT_PUBLIC_APP_DESCRIPTION=City Newspaper
EOF

echo "Environment files created successfully!"
echo ""
echo "Next steps:"
echo "1. If you need AI features, add your OpenRouter API key to apps/api/.env"
echo "2. Run: bash plesk-deploy.sh"
echo "3. Run: bash start.sh"
