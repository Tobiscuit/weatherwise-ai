# WeatherWise AI - Hybrid Deployment Guide

## 🚀 Overview
This is a **hybrid cloud architecture** that demonstrates:
- **EC2 deployment** with security hardening (infrastructure skills)
- **Cloud Run microservice** for AI processing (serverless skills)
- **Performance optimization** with warm-up strategies
- **Modern cloud architecture** combining traditional and serverless

## 🏗️ Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  EC2 Instance    │───▶│  Cloud Run      │
│                 │    │  (Main App)      │    │  (Gemini API)   │
│                 │    │  - Fastify       │    │  - AI Only      │
│                 │    │  - Templates     │    │  - Warm-up      │
│                 │    │  - Static Files  │    │  - Fast AI      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Weather APIs    │
                       │  (Open-Meteo)    │
                       └──────────────────┘
```

## 📋 Prerequisites
- AWS account with EC2 access
- Google Cloud Platform account
- Google Cloud CLI installed
- Node.js 20+ installed
- Gemini API key

## 🚀 Deployment Steps

### Phase 1: Deploy Cloud Run AI Microservice

#### 1. Set Up Google Cloud
```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project gen-lang-client-0358904502

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

#### 2. Deploy Cloud Run Function
```bash
# Navigate to Cloud Run function directory
cd cloud-run-gemini

# Deploy with environment variables
gcloud run deploy weather-gemini \
  --source . \
  --region us-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_actual_api_key \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60
```

#### 3. Get Cloud Run URL
```bash
# Get the deployed URL
CLOUD_RUN_URL=$(gcloud run services describe weather-gemini --region=us-south1 --format='value(status.url)')
echo "Cloud Run URL: $CLOUD_RUN_URL"
```

### Phase 2: Deploy Main App to EC2

#### 1. Launch EC2 Instance
```bash
# Use Amazon Linux 2023 (latest)
# Instance type: t3.micro (free tier) or t3.small
# Security Group: Allow ports 22 (SSH), 80 (HTTP), 443 (HTTPS)
# Region: us-east-1 (or your preferred region)
```

#### 2. Install Dependencies
```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Install Node.js 24.x (current LTS)
curl -fsSL https://rpm.nodesource.com/setup_24.x | sudo bash -
sudo yum install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo yum install -y nginx
```

#### 3. Deploy Your App
```bash
# Clone your repository
git clone your-repo-url
cd your-weather-app

# Install dependencies
npm install

# Build for production
npm run build

# Create .env file with Cloud Run URL
echo "CLOUD_RUN_URL=$CLOUD_RUN_URL" > .env
echo "GEMINI_API_KEY=your_gemini_api_key" >> .env

# Start with PM2
pm2 start dist/server.js --name "weatherwise-ai"
pm2 startup
pm2 save
```

#### 4. Configure Nginx
```bash
# Create Nginx configuration
sudo nano /etc/nginx/conf.d/weatherwise.conf
```

**Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8089;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Start Nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

#### 5. Security Hardening
```bash
# Configure firewall
sudo yum install -y firewalld
sudo systemctl enable firewalld
sudo systemctl start firewalld
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --reload

# Set up SSL (optional but recommended)
sudo yum install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
CLOUD_RUN_URL=https://weather-gemini-xxxxx-uc.a.run.app
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=production
PORT=8089
```

### Performance Settings
- **EC2**: t3.small (2 vCPU, 2GB RAM)
- **Cloud Run**: 512Mi memory, 1 CPU
- **Nginx**: Reverse proxy with caching
- **PM2**: Process management with auto-restart

## 📊 Performance Optimization

### Warm-up Strategy
- **Landing page**: Triggers Cloud Run warm-up
- **Background warming**: Keeps AI function ready
- **Caching**: 5-minute cache for weather data

### Latency Optimization
- **EC2**: No cold starts for main app
- **Cloud Run**: Optimized for AI processing
- **Geographic**: Both services in optimal regions

## 🔍 Monitoring

### EC2 Monitoring
```bash
# Check app status
pm2 status
pm2 logs weatherwise-ai

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t

# Monitor resources
htop
df -h
```

### Cloud Run Monitoring
```bash
# View Cloud Run logs
gcloud logs read --service=weather-gemini --limit=50

# Check service status
gcloud run services describe weather-gemini --region=us-south1
```

## 💰 Cost Analysis
- **EC2 t3.small**: ~$15/month
- **Cloud Run**: ~$1-5/month (depending on usage)
- **Total**: ~$16-20/month
- **Cost-effective** for portfolio projects

## 🛡️ Security

### EC2 Security
- ✅ Security groups configured
- ✅ Firewall enabled
- ✅ SSH key authentication
- ✅ Regular security updates
- ✅ Nginx reverse proxy

### Cloud Run Security
- ✅ Environment variables for secrets
- ✅ CORS configuration
- ✅ Request validation
- ✅ Timeout protection

## 🎯 Portfolio Benefits

This hybrid deployment demonstrates:
- ✅ **Infrastructure Management**: EC2 setup and hardening
- ✅ **Serverless Architecture**: Cloud Run microservices
- ✅ **Load Balancing**: Nginx reverse proxy
- ✅ **Process Management**: PM2 for Node.js apps
- ✅ **Security**: Firewall, SSL, environment variables
- ✅ **Monitoring**: Logs, health checks, performance metrics
- ✅ **DevOps**: Deployment automation, CI/CD ready

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy to EC2 and Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy-cloud-run:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
    - run: |
        cd cloud-run-gemini
        gcloud run deploy weather-gemini --source . --region us-south1

  deploy-ec2:
    runs-on: ubuntu-latest
    needs: deploy-cloud-run
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to EC2
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.EC2_HOST }}
        username: ec2-user
        key: ${{ secrets.EC2_SSH_KEY }}
        script: |
          cd /path/to/your/app
          git pull
          npm install
          npm run build
          pm2 restart weatherwise-ai
```

## 🧪 Testing

### Local Testing
```bash
# Test Cloud Run function
curl -X POST https://your-cloud-run-url/generateWeather \
  -H 'Content-Type: application/json' \
  -d '{"weatherData":{"temperature":{"value":75,"unit":"°F"},"condition":"Sunny","highTemp":80,"lowTemp":70},"lat":"29.7604","lon":"-95.3698"}'

# Test main app
curl "http://localhost:8089/?location=Houston"
```

### Production Testing
```bash
# Test deployed service
curl "https://your-domain.com/?location=Houston"

# Test warm-up
curl "https://your-domain.com/"
```

## 📈 Scaling

### EC2 Scaling
- **Vertical**: Upgrade instance type
- **Horizontal**: Load balancer + multiple instances
- **Auto-scaling**: AWS Auto Scaling Groups

### Cloud Run Scaling
- **Automatic**: 0 to max instances
- **Manual**: Adjust max instances
- **Cost control**: Set reasonable limits

## 🆘 Troubleshooting

### Common Issues
1. **Cloud Run cold starts**: Normal, mitigated by warm-up
2. **EC2 memory issues**: Monitor with `htop`, upgrade if needed
3. **Nginx errors**: Check config with `nginx -t`
4. **PM2 crashes**: Check logs with `pm2 logs`

### Debug Commands
```bash
# EC2 debugging
pm2 logs weatherwise-ai --lines 100
sudo journalctl -u nginx
sudo systemctl status nginx

# Cloud Run debugging
gcloud logs read --service=weather-gemini --limit=100
gcloud run services describe weather-gemini --region=us-south1
```

---

**🎉 Congratulations!** You now have a production-ready hybrid cloud application that showcases both traditional infrastructure and modern serverless skills. 