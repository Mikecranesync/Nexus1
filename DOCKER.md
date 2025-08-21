# Docker Deployment Guide

This guide explains how to deploy the Nexus application using Docker containers.

## Prerequisites

- Docker Engine 20.10+ installed
- Docker Compose 2.0+ installed
- At least 2GB free disk space
- Available ports: 80 (frontend), 5000 (backend), 5432 (database)

## Quick Start

1. **Clone the repository and navigate to the project root:**
   ```bash
   cd Nexus1
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.docker .env
   # Edit .env file with your actual AWS credentials if needed
   ```

3. **Build and start all services:**
   ```bash
   docker-compose up --build
   ```

4. **Access the application:**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - Database: localhost:5432

## Services

### Frontend (Nginx + React)
- **Port:** 80
- **Container:** nexus-frontend
- Serves the built React application
- Includes API proxy to backend
- Gzip compression enabled

### Backend (Node.js + Express)
- **Port:** 5000
- **Container:** nexus-backend
- TypeScript compiled to JavaScript
- Prisma ORM with PostgreSQL
- AWS S3 integration for file uploads

### Database (PostgreSQL)
- **Port:** 5432
- **Container:** nexus-database
- Persistent data storage
- Automatic health checks

## Commands

### Start services (detached mode):
```bash
docker-compose up -d
```

### Stop services:
```bash
docker-compose down
```

### View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

### Rebuild specific service:
```bash
docker-compose up --build backend
```

### Access container shell:
```bash
# Backend container
docker exec -it nexus-backend sh

# Database container
docker exec -it nexus-database psql -U nexus -d nexus
```

## Data Persistence

- **Database data:** Stored in `postgres_data` Docker volume
- **Backend uploads:** Stored in `backend_uploads` Docker volume

## Troubleshooting

### Database Connection Issues
```bash
# Check database health
docker-compose ps
docker-compose logs database

# Reset database
docker-compose down -v
docker-compose up --build
```

### Backend Build Issues
```bash
# View build logs
docker-compose build --no-cache backend

# Check backend logs
docker-compose logs backend
```

### Frontend Not Loading
```bash
# Check nginx configuration
docker exec nexus-frontend cat /etc/nginx/conf.d/default.conf

# View frontend logs
docker-compose logs frontend
```

## Development Mode

For development, continue using:
```bash
# Backend
cd backend && npm run dev

# Frontend
cd client && npm run dev
```

## Production Deployment

1. Update `.env` with production values
2. Consider using external database service
3. Set up SSL/TLS certificates
4. Configure proper domain names
5. Set up monitoring and logging

## Environment Variables

Required environment variables in `.env`:
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY` 
- `AWS_S3_BUCKET_NAME`
- `AWS_REGION`