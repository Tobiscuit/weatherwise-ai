# WeatherWise AI - Serverless Deployment Guide

## 🚀 Overview
This is a **serverless AI microservice** that demonstrates:
- **Cloud Run** deployment (Houston region for optimal performance)
- **AI/ML integration** with Google Gemini
- **Performance optimization** with warm-up strategies
- **Modern cloud-native** architecture

## 📋 Prerequisites
- Google Cloud Platform account
- Google Cloud CLI installed
- Node.js 20+ installed
- Gemini API key

## 🏗️ Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │───▶│  Cloud Run App   │───▶│  Gemini API     │
│                 │    │  (Houston)       │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  Weather APIs    │
                       │  (Open-Meteo)    │
                       └──────────────────┘
```

## 🚀 Deployment Steps

### 1. Set Up Google Cloud
```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Authenticate
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Prepare Your App
```bash
# Build for production
npm run build

# Test locally
npm start
```

### 3. Deploy to Cloud Run
```bash
# Deploy with environment variables
gcloud run deploy weatherwise-ai \
  --source . \
  --region us-south1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=your_actual_api_key \
  --memory 1Gi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60 \
  --port 8089
```

### 4. Get Your Service URL
```bash
# Get the deployed URL
gcloud run services describe weatherwise-ai --region=us-south1 --format='value(status.url)'
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key_here

# Optional
NODE_ENV=production
PORT=8089
```

### Performance Settings
- **Memory**: 1Gi (sufficient for AI processing)
- **CPU**: 1 (good balance of cost/performance)
- **Max Instances**: 10 (prevents runaway costs)
- **Timeout**: 60 seconds (for AI generation)

## 📊 Performance Optimization

### Warm-up Strategy
The app automatically warms up the Cloud Run function when users visit the landing page, reducing cold start latency.

### Caching
- **In-memory cache**: 5-minute cache for weather data
- **Automatic cleanup**: Prevents memory leaks
- **Cache size limits**: Maximum 100 entries

### API Timeouts
- **Geocoding API**: 5 seconds
- **Weather API**: 5 seconds  
- **Gemini API**: 8 seconds

## 🔍 Monitoring

### Health Check
```bash
curl https://your-service-url/health
```

### Performance Metrics
The app logs performance metrics for each request:
```json
{
  "location": "Houston",
  "performance": {
    "locationTime": "228ms",
    "weatherTime": "549ms", 
    "geminiTime": "5317ms",
    "totalTime": "6094ms"
  }
}
```

## 💰 Cost Analysis
- **Cloud Run**: ~$0.00002400 per 100ms
- **Typical request**: ~6 seconds = ~$0.00144 per request
- **1000 requests/month**: ~$1.44
- **Very cost-effective** for personal projects

## 🛡️ Security

### Best Practices
- ✅ Environment variables for secrets
- ✅ Input validation with Zod
- ✅ Request timeouts
- ✅ Error handling
- ✅ CORS configuration

### API Key Security
- Store Gemini API key in Cloud Run environment variables
- Never commit API keys to version control
- Use `.gitignore` to exclude sensitive files

## 🔄 CI/CD Pipeline

### GitHub Actions (Optional)
```yaml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - uses: google-github-actions/setup-gcloud@v0
    - run: |
        gcloud run deploy weatherwise-ai \
          --source . \
          --region us-south1 \
          --platform managed \
          --allow-unauthenticated
```

## 🧪 Testing

### Local Testing
```bash
# Start development server
npm run dev

# Test weather endpoint
curl "http://localhost:8089/?location=Houston"

# Test health endpoint
curl "http://localhost:8089/health"
```

### Production Testing
```bash
# Test deployed service
curl "https://your-service-url/?location=Houston"

# Test warm-up
curl "https://your-service-url/"
```

## 📈 Scaling

### Automatic Scaling
- Cloud Run automatically scales from 0 to max instances
- Handles traffic spikes gracefully
- Cost-effective for variable workloads

### Manual Scaling
```bash
# Update max instances
gcloud run services update weatherwise-ai \
  --region us-south1 \
  --max-instances 20
```

## 🎯 Portfolio Benefits

This deployment demonstrates:
- ✅ **Serverless Architecture**: Modern cloud-native approach
- ✅ **AI/ML Integration**: Real-world AI application
- ✅ **Performance Optimization**: Caching, timeouts, warm-up
- ✅ **DevOps Skills**: Cloud deployment, monitoring, scaling
- ✅ **Security**: Environment variables, input validation
- ✅ **Cost Management**: Efficient resource usage

## 🆘 Troubleshooting

### Common Issues
1. **Cold Start Latency**: Normal for serverless, mitigated by warm-up
2. **API Timeouts**: Check network connectivity and API limits
3. **Memory Issues**: Increase memory allocation if needed
4. **Cost Concerns**: Monitor usage and adjust max instances

### Debug Commands
```bash
# View logs
gcloud logs read --service=weatherwise-ai --limit=50

# Check service status
gcloud run services describe weatherwise-ai --region=us-south1

# Update environment variables
gcloud run services update weatherwise-ai \
  --region us-south1 \
  --set-env-vars GEMINI_API_KEY=new_key
```

---

**🎉 Congratulations!** You now have a production-ready serverless AI microservice that showcases modern cloud development skills. 