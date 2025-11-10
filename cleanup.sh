#!/bin/bash

#####################################################
# EOM Message Board - Cleanup Script
# Stops all services associated with the project
# Does NOT delete cached data or dependencies
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
echo "║   EOM Message Board - Cleanup Services            ║"
echo "║   Stops all running services                       ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

#####################################################
# Step 1: Stop Chromium Kiosk
#####################################################
print_status "Stopping Chromium kiosk mode..."

CHROMIUM_PIDS=$(pgrep -f "chromium.*kiosk")
if [ -n "$CHROMIUM_PIDS" ]; then
    pkill -f "chromium.*kiosk"
    print_success "Chromium kiosk stopped"
else
    print_warning "Chromium kiosk not running"
fi

# Also stop any chromium-browser processes
if pgrep -f "chromium-browser" > /dev/null; then
    pkill -f chromium-browser
    print_success "Chromium browser processes stopped"
fi

# Stop unclutter (cursor hider)
if pgrep unclutter > /dev/null; then
    pkill unclutter
    print_success "Unclutter stopped"
fi

echo ""

#####################################################
# Step 2: Stop PM2 Processes
#####################################################
print_status "Stopping PM2 processes..."

if command -v pm2 &> /dev/null; then
    # Check if any PM2 processes are running
    if pm2 list 2>/dev/null | grep -q "online\|stopped\|errored"; then
        pm2 stop all
        print_success "All PM2 processes stopped"

        # Show current PM2 status
        echo ""
        print_status "PM2 Status:"
        pm2 list
    else
        print_warning "No PM2 processes running"
    fi
else
    print_warning "PM2 not installed"
fi

echo ""

#####################################################
# Step 3: Kill any remaining Node processes
#####################################################
print_status "Checking for lingering Node.js processes..."

NODE_PIDS=$(pgrep -f "node.*next")
if [ -n "$NODE_PIDS" ]; then
    print_warning "Found lingering Next.js processes, killing..."
    pkill -f "node.*next"
    sleep 1

    # Force kill if still running
    if pgrep -f "node.*next" > /dev/null; then
        pkill -9 -f "node.*next"
        print_success "Force killed remaining processes"
    else
        print_success "Next.js processes cleaned up"
    fi
else
    print_success "No lingering processes found"
fi

echo ""

#####################################################
# Cleanup Complete
#####################################################

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║            Cleanup Complete! ✓                    ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

print_success "All services stopped"
print_status "To restart the application, use:"
echo "  pm2 start ecosystem.config.js"
echo ""
print_status "To purge all cached data, run:"
echo "  ./purge.sh"
echo ""
