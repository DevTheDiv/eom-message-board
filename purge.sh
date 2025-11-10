#!/bin/bash

#####################################################
# EOM Message Board - Purge Script
# Stops all services AND deletes all cached data
# WARNING: This will delete build artifacts and logs
#####################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   EOM Message Board - PURGE Script                ║"
echo "║   Stops services + Deletes cached data            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

print_warning "This will delete:"
echo "  • Build artifacts (.next)"
echo "  • PM2 logs and saved processes"
echo "  • Application logs"
echo "  • Node modules (optional)"
echo ""

# Confirm before proceeding
read -p "Continue with purge? (y/n): " CONFIRM
if [[ $CONFIRM != "y" && $CONFIRM != "Y" ]]; then
    print_error "Purge cancelled"
    exit 0
fi

echo ""

#####################################################
# Step 1: Stop all services (using cleanup.sh logic)
#####################################################
print_status "Stopping all services..."

# Stop Chromium kiosk
if pgrep -f "chromium.*kiosk" > /dev/null; then
    pkill -f "chromium.*kiosk"
    print_success "Chromium kiosk stopped"
fi

if pgrep -f "chromium-browser" > /dev/null; then
    pkill -f chromium-browser
    print_success "Chromium browser stopped"
fi

if pgrep unclutter > /dev/null; then
    pkill unclutter
    print_success "Unclutter stopped"
fi

# Stop PM2 processes
if command -v pm2 &> /dev/null; then
    if pm2 list 2>/dev/null | grep -q "online\|stopped\|errored"; then
        pm2 stop all
        pm2 delete all
        print_success "PM2 processes stopped and deleted"
    fi
fi

# Kill any remaining Node processes
if pgrep -f "node.*next" > /dev/null; then
    pkill -9 -f "node.*next"
    print_success "Remaining Node.js processes killed"
fi

echo ""

#####################################################
# Step 2: Delete PM2 data
#####################################################
print_status "Cleaning PM2 data..."

if command -v pm2 &> /dev/null; then
    # Flush PM2 logs
    pm2 flush 2>/dev/null
    print_success "PM2 logs flushed"

    # Delete saved PM2 processes
    rm -f ~/.pm2/dump.pm2 2>/dev/null
    print_success "PM2 saved processes deleted"

    # Optional: Clear all PM2 logs
    rm -rf ~/.pm2/logs/* 2>/dev/null
    print_success "PM2 log directory cleared"
fi

echo ""

#####################################################
# Step 3: Delete build artifacts
#####################################################
print_status "Deleting build artifacts..."

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Delete .next build directory
if [ -d ".next" ]; then
    rm -rf .next
    print_success "Deleted .next build directory"
else
    print_warning ".next directory not found"
fi

# Delete out directory (if it exists)
if [ -d "out" ]; then
    rm -rf out
    print_success "Deleted out directory"
fi

echo ""

#####################################################
# Step 4: Delete logs
#####################################################
print_status "Deleting application logs..."

if [ -d "logs" ]; then
    rm -rf logs
    print_success "Deleted logs directory"
else
    print_warning "logs directory not found"
fi

echo ""

#####################################################
# Step 5: Delete uploads (optional)
#####################################################
if [ -d "uploads" ]; then
    print_warning "Found uploads directory with user content"
    read -p "Delete uploads directory? (y/n): " DELETE_UPLOADS

    if [[ $DELETE_UPLOADS == "y" || $DELETE_UPLOADS == "Y" ]]; then
        rm -rf uploads
        print_success "Deleted uploads directory"
    else
        print_status "Keeping uploads directory"
    fi
fi

echo ""

#####################################################
# Step 6: Delete data directory (optional)
#####################################################
if [ -d "data" ]; then
    print_warning "Found data directory (may contain database)"
    read -p "Delete data directory? (y/n): " DELETE_DATA

    if [[ $DELETE_DATA == "y" || $DELETE_DATA == "Y" ]]; then
        rm -rf data
        print_success "Deleted data directory"
    else
        print_status "Keeping data directory"
    fi
fi

echo ""

#####################################################
# Step 7: Delete node_modules (optional)
#####################################################
if [ -d "node_modules" ]; then
    print_warning "Found node_modules directory"
    read -p "Delete node_modules? (y/n): " DELETE_MODULES

    if [[ $DELETE_MODULES == "y" || $DELETE_MODULES == "Y" ]]; then
        print_status "Deleting node_modules (this may take a while)..."
        rm -rf node_modules
        print_success "Deleted node_modules directory"
    else
        print_status "Keeping node_modules directory"
    fi
fi

echo ""

#####################################################
# Step 8: Clear temporary files
#####################################################
print_status "Clearing temporary files..."

# Clear yarn/npm cache in project
rm -rf .yarn/cache 2>/dev/null
rm -rf .npm 2>/dev/null

# Clear Next.js cache
rm -rf .next/cache 2>/dev/null

# Clear any lock files from Chromium
rm -rf ~/.config/chromium/Singleton* 2>/dev/null

print_success "Temporary files cleared"

echo ""

#####################################################
# Purge Complete
#####################################################

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║            Purge Complete! ✓                      ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

print_success "All services stopped and cached data removed"
echo ""
print_status "To reinstall and start the application:"
echo "  1. Install dependencies:  yarn install (or npm install)"
echo "  2. Build application:     yarn build (or npm run build)"
echo "  3. Start with PM2:        pm2 start ecosystem.config.js"
echo ""
print_status "Or run the setup script again:"
echo "  sudo ./setup-pi.sh"
echo ""
