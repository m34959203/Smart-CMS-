#!/bin/bash

# ==================================================
# AIMAK Domain Accessibility Diagnostic Script
# ==================================================
# This script checks common issues preventing domain access
# Run on the server: bash diagnose-domain.sh
# ==================================================

echo "=========================================="
echo "AIMAK Domain Diagnostic Tool"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Domain and IP
DOMAIN="aimaqaqshamy.kz"
IP="82.115.49.251"

# ==================================================
# 1. DNS Check
# ==================================================
echo "1. Checking DNS resolution..."
DNS_IP=$(nslookup $DOMAIN 2>/dev/null | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)

if [ -z "$DNS_IP" ]; then
    echo -e "${RED}❌ DNS resolution failed${NC}"
    echo "   Domain does not resolve to any IP"
    echo "   ACTION: Configure DNS A-record to point to $IP"
    DNS_OK=false
elif [ "$DNS_IP" = "$IP" ]; then
    echo -e "${GREEN}✅ DNS is correctly configured${NC}"
    echo "   $DOMAIN → $IP"
    DNS_OK=true
else
    echo -e "${YELLOW}⚠️  DNS points to different IP${NC}"
    echo "   Current: $DOMAIN → $DNS_IP"
    echo "   Expected: $DOMAIN → $IP"
    echo "   ACTION: Update DNS A-record to $IP"
    DNS_OK=false
fi
echo ""

# ==================================================
# 2. PM2 Status Check
# ==================================================
echo "2. Checking PM2 application status..."

if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed${NC}"
    echo "   ACTION: Install PM2 with: npm install -g pm2"
    PM2_OK=false
else
    PM2_LIST=$(pm2 jlist 2>/dev/null)

    API_STATUS=$(echo $PM2_LIST | jq -r '.[] | select(.name=="aimak-api") | .pm2_env.status' 2>/dev/null)
    WEB_STATUS=$(echo $PM2_LIST | jq -r '.[] | select(.name=="aimak-web") | .pm2_env.status' 2>/dev/null)

    if [ "$API_STATUS" = "online" ] && [ "$WEB_STATUS" = "online" ]; then
        echo -e "${GREEN}✅ Both applications are running${NC}"
        echo "   aimak-api: $API_STATUS"
        echo "   aimak-web: $WEB_STATUS"
        PM2_OK=true
    elif [ -z "$API_STATUS" ] || [ -z "$WEB_STATUS" ]; then
        echo -e "${RED}❌ Applications not found in PM2${NC}"
        echo "   aimak-api: ${API_STATUS:-not found}"
        echo "   aimak-web: ${WEB_STATUS:-not found}"
        echo "   ACTION: Start PM2 with: pm2 start ecosystem.config.js"
        PM2_OK=false
    else
        echo -e "${RED}❌ Applications are not running${NC}"
        echo "   aimak-api: ${API_STATUS:-unknown}"
        echo "   aimak-web: ${WEB_STATUS:-unknown}"
        echo "   ACTION: Restart PM2 with: pm2 restart all"
        PM2_OK=false
    fi
fi
echo ""

# ==================================================
# 3. Local Port Check
# ==================================================
echo "3. Checking local application ports..."

# Check API port 4000
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api/health 2>/dev/null)
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ API is responding on port 4000${NC}"
    echo "   HTTP Status: $API_RESPONSE"
    API_PORT_OK=true
else
    echo -e "${RED}❌ API is not responding on port 4000${NC}"
    echo "   HTTP Status: ${API_RESPONSE:-no response}"
    echo "   ACTION: Check PM2 logs with: pm2 logs aimak-api"
    API_PORT_OK=false
fi

# Check Web port 3000
WEB_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null)
if [ "$WEB_RESPONSE" = "200" ] || [ "$WEB_RESPONSE" = "404" ]; then
    echo -e "${GREEN}✅ Web is responding on port 3000${NC}"
    echo "   HTTP Status: $WEB_RESPONSE"
    WEB_PORT_OK=true
else
    echo -e "${RED}❌ Web is not responding on port 3000${NC}"
    echo "   HTTP Status: ${WEB_RESPONSE:-no response}"
    echo "   ACTION: Check PM2 logs with: pm2 logs aimak-web"
    WEB_PORT_OK=false
fi
echo ""

# ==================================================
# 4. Nginx Configuration Check
# ==================================================
echo "4. Checking Nginx configuration..."

# Check if nginx is installed
if ! command -v nginx &> /dev/null; then
    echo -e "${RED}❌ Nginx is not installed${NC}"
    echo "   ACTION: Install nginx with: sudo apt install nginx"
    NGINX_OK=false
else
    # Check if nginx is running
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo -e "${GREEN}✅ Nginx is installed and running${NC}"
        echo "   Version: $(nginx -v 2>&1 | cut -d'/' -f2)"

        # Check environment type
        if [ -d "/var/www/vhosts/$DOMAIN" ]; then
            echo -e "${CYAN}ℹ  Environment: Plesk VPS${NC}"
            echo "   Domain directory: /var/www/vhosts/$DOMAIN"
            echo ""
            echo -e "${YELLOW}⚠️  Manual check required:${NC}"
            echo "   Verify Plesk nginx configuration:"
            echo "   1. Login to Plesk panel"
            echo "   2. Go to: Websites & Domains → $DOMAIN → Apache & nginx Settings"
            echo "   3. Check 'Additional nginx directives' section"
            echo "   4. Ensure proxy configuration is present (see plesk-nginx.conf)"
            NGINX_OK=true
        else
            echo -e "${CYAN}ℹ  Environment: Standard VPS (no Plesk)${NC}"

            # Check for nginx config file
            if [ -f "/etc/nginx/sites-available/aimaqaqshamy" ]; then
                echo -e "${GREEN}✅ Nginx config file exists${NC}"
                echo "   Config: /etc/nginx/sites-available/aimaqaqshamy"

                # Check if enabled
                if [ -L "/etc/nginx/sites-enabled/aimaqaqshamy" ]; then
                    echo -e "${GREEN}✅ Configuration is enabled${NC}"
                    NGINX_OK=true
                else
                    echo -e "${YELLOW}⚠️  Configuration exists but not enabled${NC}"
                    echo "   ACTION: Enable with: sudo ln -s /etc/nginx/sites-available/aimaqaqshamy /etc/nginx/sites-enabled/"
                    NGINX_OK=false
                fi
            else
                echo -e "${RED}❌ Nginx config file not found${NC}"
                echo "   Expected: /etc/nginx/sites-available/aimaqaqshamy"
                echo "   ACTION: Run setup script: sudo bash setup-vps-nginx.sh"
                echo "   OR: See VPS_SETUP_GUIDE.md for manual setup"
                NGINX_OK=false
            fi
        fi
    else
        echo -e "${RED}❌ Nginx is installed but not running${NC}"
        echo "   ACTION: Start nginx with: sudo systemctl start nginx"
        NGINX_OK=false
    fi
fi
echo ""

# ==================================================
# 5. SSL Certificate Check
# ==================================================
echo "5. Checking SSL certificate..."

if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
    echo -e "${GREEN}✅ SSL certificate exists${NC}"
    echo "   Location: /etc/letsencrypt/live/$DOMAIN/"

    # Check expiration
    EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/$DOMAIN/fullchain.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$EXPIRY" ]; then
        echo "   Expires: $EXPIRY"
    fi
    SSL_OK=true
else
    echo -e "${YELLOW}⚠️  SSL certificate not found${NC}"
    echo "   Expected: /etc/letsencrypt/live/$DOMAIN/"
    echo "   ACTION: Install Let's Encrypt certificate via Plesk"
    SSL_OK=false
fi
echo ""

# ==================================================
# 6. External HTTPS Check
# ==================================================
echo "6. Checking external HTTPS access..."

HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://$DOMAIN 2>/dev/null)
if [ "$HTTPS_RESPONSE" = "200" ] || [ "$HTTPS_RESPONSE" = "301" ] || [ "$HTTPS_RESPONSE" = "302" ]; then
    echo -e "${GREEN}✅ Domain is accessible via HTTPS${NC}"
    echo "   HTTP Status: $HTTPS_RESPONSE"
    HTTPS_OK=true
else
    echo -e "${RED}❌ Domain is NOT accessible via HTTPS${NC}"
    echo "   HTTP Status: ${HTTPS_RESPONSE:-timeout/error}"
    HTTPS_OK=false
fi
echo ""

# ==================================================
# Summary
# ==================================================
echo "=========================================="
echo "DIAGNOSTIC SUMMARY"
echo "=========================================="

ISSUES=0

echo -n "DNS Resolution:        "
if [ "$DNS_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo -n "PM2 Applications:      "
if [ "$PM2_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo -n "API Port 4000:         "
if [ "$API_PORT_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo -n "Web Port 3000:         "
if [ "$WEB_PORT_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo -n "Nginx Service:         "
if [ "$NGINX_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo -n "SSL Certificate:       "
if [ "$SSL_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${YELLOW}⚠️  WARNING${NC}"; fi

echo -n "HTTPS Accessibility:   "
if [ "$HTTPS_OK" = true ]; then echo -e "${GREEN}✅ OK${NC}"; else echo -e "${RED}❌ FAILED${NC}"; ((ISSUES++)); fi

echo ""
echo "=========================================="

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo "If domain still doesn't work, check Plesk nginx configuration manually."
else
    echo -e "${RED}❌ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Read DOMAIN_FIX_GUIDE.md for detailed solutions"
    echo "2. Fix the issues marked as ❌ FAILED"
    echo "3. Run this diagnostic script again"
fi

echo "=========================================="
echo ""
echo "For detailed troubleshooting:"
echo "  - VPS without Plesk: VPS_SETUP_GUIDE.md"
echo "  - VPS with Plesk:    DOMAIN_FIX_GUIDE.md"
echo ""
