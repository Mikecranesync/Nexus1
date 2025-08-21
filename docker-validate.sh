#!/bin/bash

echo "🐋 Docker Configuration Validation"
echo "=================================="

# Check if Docker files exist
echo "📋 Checking Docker files..."

files=("docker-compose.yml" "backend/Dockerfile" "client/Dockerfile" "backend/.dockerignore" "client/.dockerignore")

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file exists"
    else
        echo "❌ $file missing"
    fi
done

echo ""
echo "📋 Checking Docker Compose syntax..."
if command -v docker-compose >/dev/null 2>&1; then
    if docker-compose config >/dev/null 2>&1; then
        echo "✅ docker-compose.yml syntax is valid"
    else
        echo "❌ docker-compose.yml syntax error"
        docker-compose config
    fi
else
    echo "⚠️  docker-compose not available"
fi

echo ""
echo "📋 Checking environment files..."
if [ -f ".env" ]; then
    echo "✅ .env file exists"
else
    echo "⚠️  .env file not found (copy from .env.docker)"
fi

echo ""
echo "📋 Container Architecture:"
echo "  🗄️  PostgreSQL Database (port 5432)"
echo "  🔧 Node.js Backend API (port 5000)"
echo "  🌐 React Frontend + Nginx (port 80)"

echo ""
echo "🚀 To start the application:"
echo "  1. Start Docker Desktop"
echo "  2. Copy .env.docker to .env"
echo "  3. Run: docker-compose up --build"
echo ""
echo "✅ Docker configuration validation complete!"