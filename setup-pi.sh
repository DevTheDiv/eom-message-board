#!/bin/bash

#####################################################
# EOM Message Board - Raspberry Pi Setup Script
# Installs Node.js, PM2, sets up Next.js message board,
# and configures Chromium in kiosk mode
#####################################################

set -e  # Exit on any error

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

# Function to check if running as root
check_root() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Please run as root (use sudo)"
        exit 1
    fi
}

# Function to get the actual user (not root)
get_actual_user() {
    if [ -n "$SUDO_USER" ]; then
        echo "$SUDO_USER"
    else
        echo "$USER"
    fi
}

# Banner
echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║   EOM Message Board - Raspberry Pi Setup          ║"
echo "║   Installs Node.js + PM2 + Kiosk Mode            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
check_root

ACTUAL_USER=$(get_actual_user)
USER_HOME=$(eval echo ~$ACTUAL_USER)
INSTALL_DIR="$USER_HOME/eom-message-board"
DISPLAY_URL="http://localhost:3000"

print_status "Installation will be performed for user: $ACTUAL_USER"
print_status "Installation directory: $INSTALL_DIR"
echo ""

# Prompt for configuration
read -p "Enter the display URL (default: http://localhost:3000): " INPUT_URL
DISPLAY_URL=${INPUT_URL:-$DISPLAY_URL}

read -p "Auto-start on boot? (y/n, default: y): " AUTO_START
AUTO_START=${AUTO_START:-y}

echo ""
print_status "Starting installation..."
echo ""

#####################################################
# Step 1: System Update
#####################################################
print_status "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
print_success "System updated"
echo ""

#####################################################
# Step 2: Install Node.js
#####################################################
print_status "Checking Node.js installation..."

if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_warning "Node.js already installed: $NODE_VERSION"
    read -p "Reinstall Node.js? (y/n): " REINSTALL_NODE
    
    if [[ $REINSTALL_NODE == "y" || $REINSTALL_NODE == "Y" ]]; then
        print_status "Removing existing Node.js..."
        apt-get remove -y nodejs npm
        rm -rf /usr/local/bin/node
        rm -rf /usr/local/bin/npm
    else
        print_status "Keeping existing Node.js installation"
    fi
fi

if ! command -v node &> /dev/null; then
    print_status "Installing Node.js LTS (via NodeSource)..."
    
    # Install Node.js 20.x LTS
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
    
    NODE_VERSION=$(node -v)
    NPM_VERSION=$(npm -v)
    print_success "Node.js $NODE_VERSION installed"
    print_success "npm $NPM_VERSION installed"
else
    print_success "Node.js is ready"
fi
echo ""

#####################################################
# Step 3: Install Chromium Browser
#####################################################
print_status "Installing Chromium browser..."

# Try chromium first (newer Raspberry Pi OS), fall back to chromium-browser
if apt-cache show chromium &> /dev/null; then
    apt-get install -y chromium x11-xserver-utils unclutter
    CHROMIUM_CMD="chromium"
elif apt-cache show chromium-browser &> /dev/null; then
    apt-get install -y chromium-browser x11-xserver-utils unclutter
    CHROMIUM_CMD="chromium-browser"
else
    print_error "Could not find Chromium package"
    print_status "Trying to install from snap..."
    apt-get install -y snapd
    snap install chromium
    CHROMIUM_CMD="chromium"
fi

print_success "Chromium installed"
echo ""

#####################################################
# Step 4: Setup Message Board Files
#####################################################
print_status "Setting up message board application..."

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Resolve both paths to absolute paths to compare them properly
SCRIPT_DIR_REAL=$(realpath "$SCRIPT_DIR" 2>/dev/null || readlink -f "$SCRIPT_DIR" 2>/dev/null || echo "$SCRIPT_DIR")
INSTALL_DIR_REAL=$(realpath "$INSTALL_DIR" 2>/dev/null || readlink -f "$INSTALL_DIR" 2>/dev/null || echo "$INSTALL_DIR")

print_status "Script directory: $SCRIPT_DIR_REAL"
print_status "Target directory: $INSTALL_DIR_REAL"

# Check if we're already in the target directory or if script is in target dir
if [ "$SCRIPT_DIR_REAL" = "$INSTALL_DIR_REAL" ] || [ "$PWD" = "$INSTALL_DIR_REAL" ]; then
    print_warning "Script is already in target directory, skipping file copy..."
    print_status "Ensuring correct ownership..."
    chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR"
    print_success "Ready to proceed with installation in place"
else
    # Check if installation directory already exists
    if [ -d "$INSTALL_DIR" ]; then
        print_warning "Installation directory already exists: $INSTALL_DIR"
        read -p "Overwrite existing installation? (y/n): " OVERWRITE

        if [[ $OVERWRITE == "y" || $OVERWRITE == "Y" ]]; then
            print_status "Backing up existing installation..."
            mv "$INSTALL_DIR" "$INSTALL_DIR.backup.$(date +%Y%m%d_%H%M%S)"
            print_success "Backup created"
        else
            print_error "Installation cancelled"
            exit 1
        fi
    fi

    # Create installation directory
    print_status "Creating installation directory..."
    mkdir -p "$INSTALL_DIR"
    chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR"

    print_status "Copying files from: $SCRIPT_DIR_REAL"

    # Copy all files except node_modules and data
    rsync -av --exclude='node_modules' --exclude='data' --exclude='uploads' --exclude='.git' \
        "$SCRIPT_DIR/" "$INSTALL_DIR/" > /dev/null 2>&1

    chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR"
    print_success "Files copied to $INSTALL_DIR"
fi
echo ""

#####################################################
# Step 5: Install PM2 Process Manager
#####################################################
print_status "Installing PM2 process manager..."

if command -v pm2 &> /dev/null; then
    PM2_VERSION=$(pm2 -v)
    print_warning "PM2 already installed: $PM2_VERSION"
else
    npm install -g pm2
    PM2_VERSION=$(pm2 -v)
    print_success "PM2 $PM2_VERSION installed"
fi
echo ""

#####################################################
# Step 6: Clean up existing services
#####################################################
print_status "Cleaning up any existing services..."

# Check for and remove old systemd service
if systemctl list-units --full -all | grep -q "message-board.service"; then
    print_status "Found old systemd service, removing..."
    systemctl stop message-board.service 2>/dev/null || true
    systemctl disable message-board.service 2>/dev/null || true
    rm -f /etc/systemd/system/message-board.service
    systemctl daemon-reload
    print_success "Old systemd service removed"
fi

# Get list of all PM2 apps before cleanup
print_status "Checking for existing PM2 processes..."
sudo -u $ACTUAL_USER pm2 list 2>/dev/null || true

# Stop and delete all PM2 processes
if sudo -u $ACTUAL_USER pm2 list 2>/dev/null | grep -q "online\|stopped\|errored"; then
    print_status "Stopping all PM2 processes..."
    sudo -u $ACTUAL_USER pm2 stop all 2>/dev/null || true
    sudo -u $ACTUAL_USER pm2 delete all 2>/dev/null || true
    print_success "PM2 processes cleaned up"
fi

# Remove PM2 startup scripts
print_status "Removing old PM2 startup scripts..."
sudo -u $ACTUAL_USER pm2 unstartup 2>/dev/null || true

# Clear PM2 logs
print_status "Clearing PM2 logs..."
sudo -u $ACTUAL_USER pm2 flush 2>/dev/null || true

print_success "Service cleanup complete"
echo ""

#####################################################
# Step 7: Install Dependencies & Build
#####################################################
print_status "Installing application dependencies..."
cd "$INSTALL_DIR"

# Ensure we're in the right directory and show it
print_status "Working in directory: $(pwd)"
print_status "Checking for package.json..."
if [ ! -f "$INSTALL_DIR/package.json" ]; then
    print_error "package.json not found in $INSTALL_DIR"
    ls -la "$INSTALL_DIR"
    exit 1
fi

# Detect which package manager to use
if [ -f "$INSTALL_DIR/yarn.lock" ]; then
    print_status "Detected yarn.lock, using Yarn..."
    PKG_MANAGER="yarn"
    INSTALL_CMD="yarn install"
    BUILD_CMD="yarn build"
elif [ -f "$INSTALL_DIR/package-lock.json" ]; then
    print_status "Detected package-lock.json, using npm..."
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
    BUILD_CMD="npm run build"
else
    print_status "No lock file found, defaulting to npm..."
    PKG_MANAGER="npm"
    INSTALL_CMD="npm install"
    BUILD_CMD="npm run build"
fi

# Check if package manager is installed
if ! command -v $PKG_MANAGER &> /dev/null; then
    if [ "$PKG_MANAGER" = "yarn" ]; then
        print_status "Installing Yarn..."
        npm install -g yarn
    fi
fi

sudo -u $ACTUAL_USER HOME=$USER_HOME bash -c "cd '$INSTALL_DIR' && $INSTALL_CMD"
print_success "Dependencies installed with $PKG_MANAGER"

print_status "Building Next.js application..."
sudo -u $ACTUAL_USER HOME=$USER_HOME bash -c "cd '$INSTALL_DIR' && $BUILD_CMD"
print_success "Application built"
echo ""

#####################################################
# Step 8: Start Application with PM2
#####################################################
print_status "Starting application with PM2..."

# Create logs directory
mkdir -p "$INSTALL_DIR/logs"
chown -R $ACTUAL_USER:$ACTUAL_USER "$INSTALL_DIR/logs"

# Start the app using ecosystem.config.js
sudo -u $ACTUAL_USER bash -c "cd '$INSTALL_DIR' && pm2 start ecosystem.config.js"

# Save PM2 process list
sudo -u $ACTUAL_USER pm2 save

# Configure PM2 to start on boot
sudo -u $ACTUAL_USER pm2 startup systemd -u $ACTUAL_USER --hp $USER_HOME | grep "sudo" | bash || true

print_success "Application started with PM2"
print_status "PM2 status:"
sudo -u $ACTUAL_USER pm2 list
echo ""

#####################################################
# Step 9: Configure Kiosk Mode
#####################################################
print_status "Configuring kiosk mode..."

# Create kiosk startup script
KIOSK_SCRIPT="$USER_HOME/start-kiosk.sh"

cat > "$KIOSK_SCRIPT" << 'EOF'
#!/bin/bash

# Set display if not already set
export DISPLAY=${DISPLAY:-:0}

# Disable screen blanking and power management
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null

# Hide mouse cursor when idle
unclutter -idle 0.5 -root &

# Remove any existing Chromium singleton locks
rm -rf ~/.config/chromium/Singleton* 2>/dev/null
rm -rf ~/.config/chromium/SingletonCookie 2>/dev/null
rm -rf ~/.config/chromium/SingletonLock 2>/dev/null
rm -rf ~/.config/chromium/SingletonSocket 2>/dev/null

# Wait for message board server to start
echo "Waiting for message board server..."
SERVER_READY=false
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo "Server is ready!"
        SERVER_READY=true
        # Extra wait to ensure server is fully initialized
        sleep 3
        break
    fi
    echo -n "."
    sleep 1
done

if [ "$SERVER_READY" = false ]; then
    echo ""
    echo "ERROR: Server not responding after 60 seconds"
    echo "Check: sudo systemctl status message-board"
    exit 1
fi

# Determine which chromium command to use
if command -v chromium &> /dev/null; then
    CHROMIUM_CMD="chromium"
elif command -v chromium-browser &> /dev/null; then
    CHROMIUM_CMD="chromium-browser"
else
    echo "ERROR: Chromium not found!"
    echo "Available browsers:"
    which chrome chromium chromium-browser google-chrome 2>/dev/null || echo "None found"
    exit 1
fi

echo "Starting $CHROMIUM_CMD in kiosk mode..."

# Start Chromium in kiosk mode
$CHROMIUM_CMD \
    --kiosk \
    --password-store=basic \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-features=TranslateUI \
    --disable-translate \
    --disable-session-crashed-bubble \
    --check-for-update-interval=31536000 \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    DISPLAY_URL_PLACEHOLDER 2>&1 | grep -v "libva error"
EOF

# Replace placeholder with actual URL
sed -i "s|DISPLAY_URL_PLACEHOLDER|$DISPLAY_URL|g" "$KIOSK_SCRIPT"

chmod +x "$KIOSK_SCRIPT"
chown $ACTUAL_USER:$ACTUAL_USER "$KIOSK_SCRIPT"

print_success "Kiosk script created: $KIOSK_SCRIPT"

# Configure autostart
AUTOSTART_DIR="$USER_HOME/.config/autostart"
mkdir -p "$AUTOSTART_DIR"
chown -R $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/.config"

cat > "$AUTOSTART_DIR/message-board-kiosk.desktop" << EOF
[Desktop Entry]
Type=Application
Name=Message Board Kiosk
Exec=$KIOSK_SCRIPT
X-GNOME-Autostart-enabled=true
EOF

chown $ACTUAL_USER:$ACTUAL_USER "$AUTOSTART_DIR/message-board-kiosk.desktop"

print_success "Autostart configured"
echo ""

#####################################################
# Step 10: Disable Screen Blanking
#####################################################
print_status "Disabling screen blanking..."

# Add to lightdm config
if [ -f /etc/lightdm/lightdm.conf ]; then
    if ! grep -q "xserver-command=X -s 0 -dpms" /etc/lightdm/lightdm.conf; then
        sed -i '/^\[Seat:\*\]/a xserver-command=X -s 0 -dpms' /etc/lightdm/lightdm.conf
    fi
fi

# Add to user's .bashrc for manual startx
if ! grep -q "xset s off" "$USER_HOME/.bashrc"; then
    echo "" >> "$USER_HOME/.bashrc"
    echo "# Disable screen blanking for kiosk" >> "$USER_HOME/.bashrc"
    echo "xset s off 2>/dev/null" >> "$USER_HOME/.bashrc"
    echo "xset -dpms 2>/dev/null" >> "$USER_HOME/.bashrc"
    echo "xset s noblank 2>/dev/null" >> "$USER_HOME/.bashrc"
fi

print_success "Screen blanking disabled"
echo ""

#####################################################
# Step 11: Configure Raspberry Pi Settings
#####################################################
print_status "Optimizing Raspberry Pi settings..."

# Increase GPU memory for better graphics performance
if ! grep -q "gpu_mem=256" /boot/config.txt; then
    echo "gpu_mem=256" >> /boot/config.txt
    print_success "GPU memory increased to 256MB"
fi

# Disable overscan if needed
if ! grep -q "disable_overscan=1" /boot/config.txt; then
    echo "disable_overscan=1" >> /boot/config.txt
    print_success "Overscan disabled"
fi

echo ""

#####################################################
# Step 12: Create Helper Scripts
#####################################################
print_status "Creating helper scripts..."

# Script to manually start kiosk
cat > "$USER_HOME/kiosk-start.sh" << EOF
#!/bin/bash
echo "Starting message board kiosk mode..."
$KIOSK_SCRIPT
EOF
chmod +x "$USER_HOME/kiosk-start.sh"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/kiosk-start.sh"

# Script to stop kiosk
cat > "$USER_HOME/kiosk-stop.sh" << EOF
#!/bin/bash
echo "Stopping kiosk mode..."
pkill -f chromium-browser
pkill -f chromium
pkill -f unclutter
echo "Kiosk stopped"
EOF
chmod +x "$USER_HOME/kiosk-stop.sh"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/kiosk-stop.sh"

# Script to restart message board service
cat > "$USER_HOME/message-board-restart.sh" << EOF
#!/bin/bash
echo "Restarting message board..."
pm2 restart eom-message-board
echo "Application restarted"
echo "Status:"
pm2 status
EOF
chmod +x "$USER_HOME/message-board-restart.sh"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/message-board-restart.sh"

# Script to view logs
cat > "$USER_HOME/message-board-logs.sh" << EOF
#!/bin/bash
echo "Message Board Logs (PM2):"
echo "==================="
pm2 logs eom-message-board --lines 50 --nostream
EOF
chmod +x "$USER_HOME/message-board-logs.sh"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/message-board-logs.sh"

# Script to check status
cat > "$USER_HOME/message-board-status.sh" << EOF
#!/bin/bash
echo "Message Board Status:"
echo "===================="
pm2 status
echo ""
pm2 describe eom-message-board
EOF
chmod +x "$USER_HOME/message-board-status.sh"
chown $ACTUAL_USER:$ACTUAL_USER "$USER_HOME/message-board-status.sh"

print_success "Helper scripts created in $USER_HOME"
echo ""

#####################################################
# Installation Complete
#####################################################

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║            Installation Complete! 🎉               ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

print_success "Message board installed to: $INSTALL_DIR"
print_success "Service is running on: http://localhost:3000"
print_success "Kiosk will display: $DISPLAY_URL"
echo ""

echo "📋 Quick Reference:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Access URLs:"
echo "  Display:  http://localhost:3000"
echo "  Admin:    http://localhost:3000/admin"
echo "  Login:    admin / admin"
echo ""
echo "Helper Scripts (in $USER_HOME):"
echo "  ./kiosk-start.sh           - Manually start kiosk"
echo "  ./kiosk-stop.sh            - Stop kiosk mode"
echo "  ./message-board-restart.sh - Restart application"
echo "  ./message-board-logs.sh    - View application logs"
echo "  ./message-board-status.sh  - Check application status"
echo ""
echo "PM2 Commands:"
echo "  pm2 status                  - Check status"
echo "  pm2 restart eom-message-board - Restart application"
echo "  pm2 stop eom-message-board    - Stop application"
echo "  pm2 start eom-message-board   - Start application"
echo "  pm2 logs eom-message-board    - View live logs"
echo "  pm2 monit                   - Monitor resources"
echo ""
echo "Keyboard Shortcuts (in kiosk):"
echo "  F11           - Exit fullscreen"
echo "  Alt+F4        - Close browser"
echo "  Ctrl+Alt+F1   - Switch to terminal (login to stop)"
echo "  Ctrl+Alt+F7   - Switch back to GUI"
echo ""

if [[ $AUTO_START == "y" || $AUTO_START == "Y" ]]; then
    print_success "Kiosk mode will start automatically on boot"
    echo ""
    print_warning "REBOOT REQUIRED to apply all changes"
    echo ""
    read -p "Reboot now? (y/n): " REBOOT_NOW
    
    if [[ $REBOOT_NOW == "y" || $REBOOT_NOW == "Y" ]]; then
        print_status "Rebooting in 5 seconds... (Ctrl+C to cancel)"
        sleep 5
        reboot
    else
        print_warning "Please reboot manually when ready: sudo reboot"
    fi
else
    print_status "Auto-start disabled. Run './kiosk-start.sh' to start manually"
fi

echo ""
print_success "Setup complete! Enjoy your message board!"
echo ""