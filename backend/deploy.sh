#!/bin/bash

# English Learning System - Full Stack Deployment Script
# Usage: ./deploy.sh [production|staging]

set -e

ENVIRONMENT=${1:-production}
DOMAIN="speakeasy.nguyentrungnam.com"

echo "🚀 Deploying English Learning System to $ENVIRONMENT..."

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo "❌ This script should not be run as root"
   exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "🔧 Installing required packages..."
sudo apt install -y curl certbot python3-certbot-nginx nginx

# Create .env file if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# API Keys
OPENAI_API_KEY=your_openai_api_key_here
DEEPGRAM_API_KEY=your_deepgram_api_key_here

# Server Configuration
HOST=0.0.0.0
PORT=1423
DEBUG=false

# Production Settings
ENVIRONMENT=production
LOG_LEVEL=info

# CORS Settings
ALLOWED_ORIGINS=https://${DOMAIN}

# Node.js Gateway URL
PYTHON_BACKEND_URL=http://localhost:1423
EOF
    echo "⚠️  Please update .env file with your API keys before continuing"
    echo "Press Enter to continue..."
    read
fi

# Setup firewall
echo "🔥 Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

# Create directories
echo "📁 Creating directories..."
sudo mkdir -p /opt/english-learning/{frontend,backend-node,backend-python,uploads}
sudo chown -R $USER:$USER /opt/english-learning

# Build and start services
echo "🐳 Building and starting Docker services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
echo "Frontend: $(curl -s http://localhost/health || echo 'Not ready')"
echo "Backend Node: $(curl -s http://localhost:3000/health || echo 'Not ready')"
echo "Backend Python: $(curl -s http://localhost:1423/health || echo 'Not ready')"

# Setup SSL certificate
if [ "$ENVIRONMENT" = "production" ]; then
    echo "🔒 Setting up SSL certificate..."
    echo "Please run: sudo certbot --nginx -d ${DOMAIN}"
fi

echo "✅ Deployment completed successfully!"

echo "📊 Service status:"
docker-compose ps

echo "🌐 Access URLs:"
echo "   - Frontend: https://${DOMAIN}"
echo "   - API Gateway: http://localhost:3000"
echo "   - Python API: http://localhost:1423"

echo "📋 Next steps:"
echo "   1. Update .env file with your API keys"
echo "   2. Run: sudo certbot --nginx -d ${DOMAIN}"
echo "   3. Test the application at https://${DOMAIN}"
echo "   4. Monitor logs: docker-compose logs -f"

echo "🔍 Useful commands:"
echo "   - View logs: docker-compose logs -f [service-name]"
echo "   - Restart services: docker-compose restart"
echo "   - Stop services: docker-compose down"
echo "   - Update services: docker-compose pull && docker-compose up -d" 