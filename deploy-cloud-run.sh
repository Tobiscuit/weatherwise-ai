#!/bin/bash

echo "🚀 Deploying Cloud Run function to Houston region..."

# Set variables
PROJECT_ID="your-project-id"  # Replace with your GCP project ID
REGION="us-south1"  # Houston region
SERVICE_NAME="weather-gemini"
GEMINI_API_KEY="your-gemini-api-key"  # Replace with your actual API key

# Navigate to Cloud Run function directory
cd cloud-run-gemini

# Deploy to Cloud Run
gcloud run deploy $SERVICE_NAME \
  --source . \
  --region $REGION \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY=$GEMINI_API_KEY \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --timeout 60

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format='value(status.url)')

echo "✅ Cloud Run function deployed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📝 Add this to your .env file:"
echo "CLOUD_RUN_URL=$SERVICE_URL"
echo ""
echo "🔗 Test the warm-up endpoint:"
echo "curl $SERVICE_URL/warmup"
echo ""
echo "🔗 Test the weather generation:"
echo "curl -X POST $SERVICE_URL/generateWeather \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"weatherData\":{\"temperature\":{\"value\":75,\"unit\":\"°F\"},\"condition\":\"Sunny\",\"highTemp\":80,\"lowTemp\":70},\"lat\":\"29.7604\",\"lon\":\"-95.3698\"}'" 