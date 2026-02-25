# Production Deployment Guide

Complete guide for deploying the OpenSite Blueprint Analysis system to production.

## Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Python 3.11+
- NVIDIA GPU (optional, for AECVision)
- 8GB+ RAM
- 50GB+ disk space

## Deployment Options

### Option 1: Docker Compose (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd opensite

# Start all services
docker-compose -f docker-compose.blueprint.yml up -d

# Verify services
./blueprint-cli.js health
```

### Option 2: Manual Deployment

#### Step 1: AECVision Service

```bash
./start-aecvision.sh
# Or with Docker:
docker-compose -f docker-compose.blueprint.yml up -d aecvision
```

#### Step 2: Floorplan Service

```bash
./start-floorplan.sh
# Or with Docker:
docker-compose -f docker-compose.blueprint.yml up -d floorplan
```

#### Step 3: Backend

```bash
cd backend
npm install
npm start
```

#### Step 4: Frontend

```bash
cd frontend
npm install
npm run build
# Serve with nginx or:
npm run preview
```

## Configuration

### Environment Variables

Create `.env` file in backend directory:

```bash
# AI Providers
ANTHROPIC_API_KEY=sk-ant-...
GROQ_API_KEY=gsk_...
OPENAI_API_KEY=sk-...

# Service URLs
AECVISION_URL=http://localhost:8002
FLOORPLAN_URL=http://localhost:8003

# Database
DATABASE_URL=sqlite://./data/opensite.db
# Or PostgreSQL:
# DATABASE_URL=postgresql://user:pass@localhost/opensite

# Security
JWT_SECRET=your-secret-key
ADMIN_TOKEN=atk_...

# Export
EXPORT_DIR=./exports
```

### GPU Configuration (AECVision)

For NVIDIA GPU support:

```bash
# Install NVIDIA Docker runtime
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-docker2
sudo systemctl restart docker

# Test GPU
docker run --rm --gpus all nvidia/cuda:11.0-base nvidia-smi
```

## Health Checks

```bash
# Check all services
./blueprint-cli.js health

# Individual service checks
curl http://localhost:8002/health  # AECVision
curl http://localhost:8003/health  # Floorplan
curl http://localhost:5001/api/health  # Backend
```

## Monitoring

### Enable GPU Monitoring

```bash
docker-compose -f docker-compose.blueprint.yml --profile monitoring up -d

# View GPU metrics
curl http://localhost:9400/metrics
```

### Logs

```bash
# All services
docker-compose -f docker-compose.blueprint.yml logs -f

# Specific service
docker-compose -f docker-compose.blueprint.yml logs -f aecvision
```

## Backup and Recovery

### Database Backup

```bash
# SQLite
sqlite3 data/opensite.db ".backup 'backup.db'"

# PostgreSQL
pg_dump opensite > backup.sql
```

### Export Directory Backup

```bash
tar -czf exports-backup.tar.gz exports/
```

## Scaling

### Horizontal Scaling

For high traffic, run multiple backend instances:

```bash
# With PM2
npm install -g pm2
pm2 start backend/src/server.js -i 4  # 4 instances
```

### Redis Cluster (Optional)

For distributed caching:

```bash
docker run -d --name redis-cluster -p 6379:6379 redis:7-alpine
```

## Security

### HTTPS Setup

```bash
# Using Let's Encrypt
certbot certonly --standalone -d your-domain.com

# Update nginx config to use SSL certificates
```

### Rate Limiting

Already configured in backend. Adjust limits in:
- `backend/src/middleware/security.js`

### Authentication

CLI tool requires API token:

```bash
export API_TOKEN=your-jwt-token
./blueprint-cli.js analyze blueprint.pdf
```

## Troubleshooting

### AECVision Service Won't Start

```bash
# Check GPU availability
nvidia-smi

# Check CUDA version
python -c "import torch; print(torch.version.cuda)"

# View logs
docker-compose logs aecvision
```

### Floorplan Service Errors

```bash
# Check PDF dependencies
docker-compose exec floorplan python -c "import fitz; print('PyMuPDF OK')"
docker-compose exec floorplan python -c "import pdfplumber; print('pdfplumber OK')"
```

### High Memory Usage

```bash
# Monitor memory
docker stats

# Adjust limits in docker-compose.blueprint.yml
services:
  aecvision:
    deploy:
      resources:
        limits:
          memory: 4G
```

## Updates

### Update Services

```bash
# Pull latest code
git pull

# Rebuild containers
docker-compose -f docker-compose.blueprint.yml build --no-cache

# Restart
docker-compose -f docker-compose.blueprint.yml up -d
```

### Database Migrations

```bash
cd backend
npm run migrate
```

## Performance Tuning

### AECVision

- Use GPU for faster inference
- Adjust batch size in `workers/core/aecvision/detector.py`
- Enable model caching

### Floorplan

- Use `pymupdf` method for faster processing
- Cache dimension patterns

### Backend

- Enable Redis caching
- Use connection pooling
- Enable gzip compression

## Support

For issues:
1. Check logs: `docker-compose logs`
2. Run health check: `./blueprint-cli.js health`
3. Review documentation: `AGENTS.md`

## License

See LICENSE file for details.
