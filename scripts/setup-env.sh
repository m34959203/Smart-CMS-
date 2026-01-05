#!/bin/bash

# ==========================================
# AIMAK Environment Setup Script
# ==========================================
# This script helps you set up environment variables for local development
# For production setup, see ENV_SETUP.md
# ==========================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Emojis
CHECK="✅"
CROSS="❌"
WARNING="⚠️"
INFO="ℹ️"
ROCKET="🚀"

echo ""
echo -e "${BLUE}=========================================="
echo "AIMAK Environment Setup"
echo -e "==========================================${NC}"
echo ""

# Check if running from project root
if [ ! -f "package.json" ] || [ ! -d "apps" ]; then
    echo -e "${RED}${CROSS} Error: This script must be run from the project root directory${NC}"
    echo "Please run: cd /path/to/AIMAK && ./scripts/setup-env.sh"
    exit 1
fi

echo -e "${INFO} Setting up environment variables for local development..."
echo ""

# ==========================================
# Setup API .env
# ==========================================
echo -e "${BLUE}[1/2] Setting up Backend (API) environment...${NC}"

if [ -f "apps/api/.env" ]; then
    echo -e "${WARNING} apps/api/.env already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${INFO} Skipping API .env setup"
    else
        cp apps/api/.env.example apps/api/.env
        echo -e "${CHECK} Created apps/api/.env from .env.example"
    fi
else
    cp apps/api/.env.example apps/api/.env
    echo -e "${CHECK} Created apps/api/.env from .env.example"
fi

# ==========================================
# Setup Web .env
# ==========================================
echo ""
echo -e "${BLUE}[2/2] Setting up Frontend (Web) environment...${NC}"

if [ -f "apps/web/.env" ]; then
    echo -e "${WARNING} apps/web/.env already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${INFO} Skipping Web .env setup"
    else
        cp apps/web/.env.example apps/web/.env
        echo -e "${CHECK} Created apps/web/.env from .env.example"
    fi
else
    cp apps/web/.env.example apps/web/.env
    echo -e "${CHECK} Created apps/web/.env from .env.example"
fi

# ==========================================
# AI API Setup Guidance
# ==========================================
echo ""
echo -e "${BLUE}=========================================="
echo "AI API Configuration"
echo -e "==========================================${NC}"
echo ""
echo "The AIMAK application uses AI for translation and content analysis."
echo "You need to set up at least one AI service to enable these features."
echo ""
echo -e "${GREEN}RECOMMENDED: Google Gemini API${NC}"
echo "  ${CHECK} Better rate limits: 15 req/min, 1500 req/day"
echo "  ${CHECK} Faster response times"
echo "  ${CHECK} FREE with generous limits"
echo ""
echo -e "  ${INFO} Get your API key:"
echo "  1. Visit: https://aistudio.google.com/app/apikey"
echo "  2. Sign in with Google account"
echo "  3. Click 'Create API Key'"
echo "  4. Copy the key (starts with AIza...)"
echo ""

read -p "Do you have a Gemini API key? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter your Gemini API key: " GEMINI_KEY
    if [ ! -z "$GEMINI_KEY" ]; then
        # Update .env file with Gemini key
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_KEY/" apps/api/.env
        else
            # Linux
            sed -i "s/GEMINI_API_KEY=.*/GEMINI_API_KEY=$GEMINI_KEY/" apps/api/.env
        fi
        echo -e "${CHECK} Gemini API key saved to apps/api/.env"
    fi
else
    echo ""
    echo -e "${YELLOW}${WARNING} Alternative: OpenRouter API${NC}"
    echo "  ${WARNING} Free tier has VERY strict rate limits"
    echo "  ${WARNING} You may see '429 Rate Limit Exceeded' errors"
    echo ""
    echo "  ${INFO} Get OpenRouter key: https://openrouter.ai/settings/keys"
    echo ""
    read -p "Do you have an OpenRouter API key? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your OpenRouter API key: " OPENROUTER_KEY
        if [ ! -z "$OPENROUTER_KEY" ]; then
            # Update .env file with OpenRouter key
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=$OPENROUTER_KEY/" apps/api/.env
            else
                # Linux
                sed -i "s/OPENROUTER_API_KEY=.*/OPENROUTER_API_KEY=$OPENROUTER_KEY/" apps/api/.env
            fi
            echo -e "${CHECK} OpenRouter API key saved to apps/api/.env"
        fi
    else
        echo ""
        echo -e "${WARNING} No AI API key configured!"
        echo "  Translation and AI features will not work."
        echo "  You can set this up later by editing apps/api/.env"
    fi
fi

# ==========================================
# Next Steps
# ==========================================
echo ""
echo -e "${BLUE}=========================================="
echo "Next Steps"
echo -e "==========================================${NC}"
echo ""
echo "Your environment files are ready! Here's what to do next:"
echo ""
echo -e "${CHECK} 1. Review and customize your .env files:"
echo "     - apps/api/.env"
echo "     - apps/web/.env"
echo ""
echo -e "${CHECK} 2. Start database services:"
echo "     docker-compose up -d postgres redis"
echo ""
echo -e "${CHECK} 3. Run database migrations:"
echo "     cd apps/api && pnpm prisma generate && pnpm prisma migrate dev"
echo ""
echo -e "${CHECK} 4. Start development servers:"
echo "     pnpm dev"
echo ""
echo -e "${INFO} For detailed setup instructions, see:"
echo "  - ENV_SETUP.md (environment variables guide)"
echo "  - SETUP.md (general setup guide)"
echo ""
echo -e "${ROCKET} ${GREEN}Happy coding!${NC}"
echo ""
