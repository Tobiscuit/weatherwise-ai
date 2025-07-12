# WeatherWise AI - S3 Deployment Script
# This script packages and uploads the app to S3 for EC2 deployment

Write-Host "🚀 WeatherWise AI - S3 Deployment Script" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

# Check if AWS CLI is installed
try {
    aws --version | Out-Null
    Write-Host "✅ AWS CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ AWS CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "   https://aws.amazon.com/cli/" -ForegroundColor Yellow
    exit 1
}

# Set variables
$BUCKET_NAME = "weatherwise-deployment"
$APP_DIR = "app/weather-ui"
$ARCHIVE_NAME = "weatherwise-clean.tar.gz"

Write-Host "📦 Creating clean archive..." -ForegroundColor Cyan

# Navigate to app directory
Set-Location $APP_DIR

# Create clean archive (exclude node_modules, .env, dist, etc.)
if (Test-Path $ARCHIVE_NAME) {
    Remove-Item $ARCHIVE_NAME -Force
}

# Use tar to create archive (Windows 10+ has tar built-in)
tar -czf $ARCHIVE_NAME --exclude=node_modules --exclude=.env --exclude=dist --exclude=*.log --exclude=.git .

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Archive created: $ARCHIVE_NAME" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create archive" -ForegroundColor Red
    exit 1
}

Write-Host "☁️  Creating S3 bucket if it doesn't exist..." -ForegroundColor Cyan

# Create S3 bucket (if it doesn't exist)
aws s3 mb s3://$BUCKET_NAME --region us-east-1 2>$null

Write-Host "📤 Uploading to S3..." -ForegroundColor Cyan

# Upload to S3
aws s3 cp $ARCHIVE_NAME s3://$BUCKET_NAME/

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Upload successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next Steps:" -ForegroundColor Yellow
    Write-Host "1. Connect to your EC2 instance via AWS SSM Session Manager" -ForegroundColor White
    Write-Host "2. Run these commands on EC2:" -ForegroundColor White
    Write-Host "   aws s3 cp s3://$BUCKET_NAME/$ARCHIVE_NAME ." -ForegroundColor Cyan
    Write-Host "   tar -xzf $ARCHIVE_NAME" -ForegroundColor Cyan
    Write-Host "   npm install" -ForegroundColor Cyan
    Write-Host "   npm run build" -ForegroundColor Cyan
    Write-Host "   npm start" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📋 S3 URL: s3://$BUCKET_NAME/$ARCHIVE_NAME" -ForegroundColor Magenta
} else {
    Write-Host "❌ Upload failed" -ForegroundColor Red
    exit 1
}

# Clean up local archive
Remove-Item $ARCHIVE_NAME -Force
Write-Host "🧹 Cleaned up local archive" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Deployment package ready!" -ForegroundColor Green 