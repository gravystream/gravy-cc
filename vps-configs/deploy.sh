#!/bin/bash
# Novaclio Deploy Script
# Usage: ./vps-configs/deploy.sh
set -e

APP_DIR="/var/www/gravy-cc-deploy"
echo "Deploying Novaclio..."

cd $APP_DIR

echo "Pulling latest code..."
git pull origin main

echo "Installing dependencies..."
npm ci --omit=dev

echo "Generating Prisma client..."
npx prisma generate

echo "Running migrations..."
npx prisma migrate deploy

echo "Building app..."
npm run build

echo "Restarting PM2..."
pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js

echo "Deployment complete!"
pm2 status
