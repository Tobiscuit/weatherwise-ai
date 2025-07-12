#!/bin/bash

# Multi-App EC2 Setup Script
# Modern best practices for hosting multiple apps on single EC2 instance

set -e

echo "🚀 Setting up multi-app hosting environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system
print_status "Updating system packages..."
sudo yum update -y

# Install Node.js 24.x
print_status "Installing Node.js 24.x..."
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo yum install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
sudo npm install -g pm2

# Install Nginx
print_status "Installing Nginx..."
sudo yum install -y nginx

# Create application users
print_status "Creating application users..."
sudo useradd -r -s /bin/false weatherwise
sudo useradd -r -s /bin/false yourapp2
sudo useradd -r -s /bin/false yourapp3

# Create application directories
print_status "Creating application directories..."
sudo mkdir -p /opt/weatherwise
sudo mkdir -p /opt/yourapp2
sudo mkdir -p /opt/yourapp3

# Set ownership
sudo chown weatherwise:weatherwise /opt/weatherwise
sudo chown yourapp2:yourapp2 /opt/yourapp2
sudo chown yourapp3:yourapp3 /opt/yourapp3

# Create log directories
print_status "Setting up logging..."
sudo mkdir -p /var/log/pm2
sudo chown ec2-user:ec2-user /var/log/pm2

# Set up resource limits
print_status "Setting up resource limits..."
sudo tee /etc/security/limits.d/app-limits.conf > /dev/null <<EOF
# Resource limits for application users
weatherwise soft nofile 65536
weatherwise hard nofile 65536
yourapp2 soft nofile 65536
yourapp2 hard nofile 65536
yourapp3 soft nofile 65536
yourapp3 hard nofile 65536
EOF

# Configure system limits
sudo tee /etc/sysctl.d/99-app-limits.conf > /dev/null <<EOF
# Increase file descriptor limits
fs.file-max = 2097152
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
EOF

# Apply sysctl changes
sudo sysctl -p /etc/sysctl.d/99-app-limits.conf

# Set up Nginx configuration
print_status "Configuring Nginx..."
sudo cp nginx-multi-app.conf /etc/nginx/conf.d/multi-app.conf

# Test Nginx configuration
if sudo nginx -t; then
    print_status "Nginx configuration is valid"
else
    print_error "Nginx configuration is invalid"
    exit 1
fi

# Start and enable Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Set up firewall
print_status "Configuring firewall..."
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Create deployment script
print_status "Creating deployment script..."
sudo tee /usr/local/bin/deploy-app.sh > /dev/null <<'EOF'
#!/bin/bash

# Usage: deploy-app.sh <app-name> <git-url> <port>

APP_NAME=$1
GIT_URL=$2
PORT=$3

if [ -z "$APP_NAME" ] || [ -z "$GIT_URL" ] || [ -z "$PORT" ]; then
    echo "Usage: deploy-app.sh <app-name> <git-url> <port>"
    exit 1
fi

APP_DIR="/opt/$APP_NAME"
USER_NAME=$APP_NAME

echo "Deploying $APP_NAME to $APP_DIR..."

# Clone or pull repository
if [ -d "$APP_DIR" ]; then
    cd $APP_DIR
    git pull
else
    sudo git clone $GIT_URL $APP_DIR
    sudo chown -R $USER_NAME:$USER_NAME $APP_DIR
fi

# Install dependencies and build
cd $APP_DIR
sudo -u $USER_NAME npm install
sudo -u $USER_NAME npm run build

# Update PM2 ecosystem
echo "Updating PM2 ecosystem..."
pm2 reload ecosystem.config.js

echo "Deployment complete for $APP_NAME"
EOF

sudo chmod +x /usr/local/bin/deploy-app.sh

# Create monitoring script
print_status "Creating monitoring script..."
sudo tee /usr/local/bin/monitor-apps.sh > /dev/null <<'EOF'
#!/bin/bash

echo "=== PM2 Status ==="
pm2 status

echo -e "\n=== System Resources ==="
echo "Memory Usage:"
free -h

echo -e "\nDisk Usage:"
df -h

echo -e "\nCPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1

echo -e "\n=== Application Logs (Last 10 lines) ==="
echo "WeatherWise AI:"
pm2 logs weatherwise-ai --lines 10 --nostream

echo -e "\nApp2:"
pm2 logs yourapp2 --lines 10 --nostream

echo -e "\nApp3:"
pm2 logs yourapp3 --lines 10 --nostream
EOF

sudo chmod +x /usr/local/bin/monitor-apps.sh

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/pm2 > /dev/null <<EOF
/var/log/pm2/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 ec2-user ec2-user
    postrotate
        pm2 reloadLogs
    endscript
}
EOF

# Create health check script
print_status "Creating health check script..."
sudo tee /usr/local/bin/health-check.sh > /dev/null <<'EOF'
#!/bin/bash

# Health check for all applications
APPS=("weatherwise-ai:8089" "yourapp2:8090" "yourapp3:8091")

for app in "${APPS[@]}"; do
    IFS=':' read -r name port <<< "$app"
    if curl -f -s http://localhost:$port/health > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is unhealthy"
        # Restart the app
        pm2 restart $name
    fi
done
EOF

sudo chmod +x /usr/local/bin/health-check.sh

# Set up cron job for health checks
print_status "Setting up automated health checks..."
(crontab -l 2>/dev/null; echo "*/5 * * * * /usr/local/bin/health-check.sh") | crontab -

print_status "Setup complete! 🎉"
echo ""
echo "Next steps:"
echo "1. Copy your app files to /opt/weatherwise"
echo "2. Update ecosystem.config.js with your app details"
echo "3. Run: pm2 start ecosystem.config.js"
echo "4. Update nginx configuration with your domain names"
echo "5. Set up SSL certificates with Let's Encrypt"
echo ""
echo "Useful commands:"
echo "- Monitor apps: /usr/local/bin/monitor-apps.sh"
echo "- Deploy app: /usr/local/bin/deploy-app.sh <app-name> <git-url> <port>"
echo "- Health check: /usr/local/bin/health-check.sh"
echo "- PM2 status: pm2 status"
echo "- PM2 logs: pm2 logs" 