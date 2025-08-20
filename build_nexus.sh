#!/bin/bash

# Build script for Nexus project
echo "Building Nexus..."

# Install dependencies
echo "Installing backend dependencies..."
cd backend && npm install

echo "Installing frontend dependencies..."
cd ../frontend && npm install

# Generate Prisma client
echo "Generating Prisma client..."
cd ../backend && npx prisma generate

# Build frontend
echo "Building frontend..."
cd ../frontend && npm run build

# Build backend (TypeScript compilation)
echo "Building backend..."
cd ../backend && npm run build

echo "Build complete!"