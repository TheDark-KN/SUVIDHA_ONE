#!/bin/bash
# SUVIDHA ONE Kiosk Deployment Script
# Builds and deploys the kiosk application for Windows/Android tablets

set -e

echo "🇮🇳 SUVIDHA ONE - Kiosk Deployment"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Please run this script from the frontend directory${NC}"
    exit 1
fi

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps || yarn install || pnpm install

# Build the application
echo -e "${YELLOW}Building application...${NC}"
npm run build || yarn build

echo -e "${GREEN}✓ Build complete!${NC}"

# Output deployment instructions
echo ""
echo "=================================="
echo "📱 DEPLOYMENT INSTRUCTIONS"
echo "=================================="
echo ""
echo "For Windows Kiosk Mode:"
echo "------------------------"
echo "1. Copy the 'out' folder to your kiosk tablet"
echo "2. Create a shortcut with these Chrome flags:"
echo ""
echo '   chrome.exe --kiosk --disable-infobars --start-fullscreen --app=file:///C:/path/to/out/index.html'
echo ""
echo "3. Additional recommended flags:"
echo "   --disable-pinch              # Disable pinch-to-zoom"
echo "   --disable-new-tab-first-run  # Skip first-run experience"
echo "   --no-first-run              # Skip first-run experience"
echo "   --disable-component-update  # Disable auto-updates in kiosk mode"
echo "   --disable-background-networking"
echo ""
echo "For Android Tablet:"
echo "-------------------"
echo "1. Install 'Fully Kiosk Browser' or similar app"
echo "2. Set start URL to: file:///sdcard/out/index.html"
echo "3. Enable 'Kiosk Mode' in settings"
echo ""
echo "For Linux Kiosk (Raspberry Pi):"
echo "--------------------------------"
echo "1. Copy 'out' folder to /var/www/suvidha-one"
echo "2. Start Chromium in kiosk mode:"
echo ""
echo '   chromium-browser --kiosk --start-fullscreen --app=http://localhost/suvidha-one'
echo ""
echo "=================================="
echo -e "${GREEN}✓ Deployment ready!${NC}"
echo "=================================="
