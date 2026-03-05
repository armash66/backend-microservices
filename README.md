# Backend Microservices

A production-grade microservices architecture built with Node.js, featuring distributed event-driven communication, caching, observability, and automated CI/CD.

## 🏗 Architecture

```
                    ┌──────────────┐
                    │    Nginx     │ :80/:443
                    │  (Reverse    │
                    │   Proxy)     │
                    └──────┬───────┘
                           │
                    ┌──────┴───────┐
                    │  API Gateway │ :3000
                    │  (Rate Limit │
                    │   + JWT)     │
                    └──────┬───────┘
              ┌────────────┼────────────┐
              │            │            │
       ┌──────┴──┐  ┌──────┴──┐  ┌─────┴───┐
       │  Auth   │  │  Task   │  │  File   │
       │ Service │  │ Service │  │ Service │
       │  :3001  │  │  :3002  │  │  :3003  │
       └────┬────┘  └───┬──┬──┘  └────┬────┘
            │           │  │          │
       ┌────┴───────────┴──┴──────────┴────┐
       │          PostgreSQL :5432          │
       └───────────────────────────────────┘
            │           │          │
       ┌────┴────┐ ┌────┴────┐    │
       │RabbitMQ │ │  Redis  │    │
       │  :5672  │ │  :6379  │    │
       └─────────┘ └─────────┘    │
                                  │
       ┌──────────┐  ┌────────────┴──┐
       │Prometheus│  │   Grafana     │
       │  :9090   │──│   :3030       │
       └──────────┘  └───────────────┘
```

## 🚀 Features

### Core Services
- **Auth Service** — Registration, login, JWT access + refresh tokens, account deletion
- **Task Service** — CRUD operations with Redis cache-aside pattern
- **File Service** — File upload/download with user isolation
- **API Gateway** — Central routing, JWT validation, rate limiting, circuit breakers

### Infrastructure
- **PostgreSQL** — Primary data store with migrations (node-pg-migrate)
- **RabbitMQ** — Async event-driven communication (user.deleted cascades)
- **Redis** — Cache-aside pattern for task queries
- **Nginx** — Reverse proxy with rate limiting, gzip, security headers

### Observability
- **Prometheus** — Metrics scraping (request duration, cache hits, events)
- **Grafana** — 9-panel dashboard (latency, errors, cache, CPU, memory, health)
- **Pino** — Structured JSON logging with request tracing

### Security
- **bcrypt** password hashing (salt rounds: 10)
- **JWT** access tokens (15min) + refresh tokens (7 days)
- **Input validation** (express-validator)
- **Rate limiting** (100 req/15min global, 10 req/15min on login)
- **Helmet** security headers
- **CORS** configuration

### CI/CD
- **GitHub Actions** — Parallel test jobs + Docker image build verification
- **27 unit tests** across auth-service and task-service

---

## 💻 Local Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/)

### Quick Start (Bare Metal)
```powershell
# 1. Install all dependencies
npm run install:all

# 2. Start everything (API, Auth, Tasks, Files, Frontend)
npm run dev
```

### Quick Start (Docker)
```bash
docker compose up --build -d
```

### Access Points (Development)
| Service    | URL                        |
|------------|----------------------------|
| Frontend   | http://localhost:5173       |
| API Gateway| http://localhost:3000       |
| Grafana    | http://localhost:3030       |
| Prometheus | http://localhost:9090       |
| RabbitMQ   | http://localhost:15672      |

### Run Tests
```bash
# Auth service tests (14 tests)
cd auth-service && npm test

# Task service tests (13 tests)
cd task-service && npm test
```

---

## ☁ Production Deployment (VPS/EC2)

### 1. Provision a Server
- Ubuntu 22.04 LTS (recommended)
- Minimum: 2 vCPU, 4GB RAM, 20GB SSD
- Open ports: 80, 443, 22

### 2. Install Docker
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### 3. Clone & Configure
```bash
git clone https://github.com/armash66/backend-microservices.git
cd backend-microservices

# Create production environment file
cp .env.example .env.production

# Edit with strong passwords
nano .env.production
```

### 4. Deploy
```bash
# Start production stack
docker compose -f docker-compose.prod.yml --env-file .env.production up --build -d

# Verify all containers are running
docker compose -f docker-compose.prod.yml ps
```

### 5. SSL/HTTPS (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot -y

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com

# Certificates will be at:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem

# Auto-renewal
sudo crontab -e
# Add: 0 0 1 * * certbot renew --quiet
```

### 6. Verify Deployment
```bash
# Check all services
curl http://yourdomain.com/api/health/live

# Check Grafana
# Visit: http://yourdomain.com/grafana/

# View logs
docker compose -f docker-compose.prod.yml logs -f
```

---

## 📊 Grafana Dashboard

Login: `admin` / (your GRAFANA_PASSWORD)

### Panels
| Panel | Metric |
|-------|--------|
| Request Rate | `rate(http_request_duration_seconds_count[1m])` |
| Error Rate (5xx) | `rate(http_request_duration_seconds_count{status_code=~"5.."}[1m])` |
| P95 Latency | `histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))` |
| Cache Hit/Miss | `rate(cache_hits_total[1m])` vs `rate(cache_misses_total[1m])` |
| Service Health | `up` |
| Memory (RSS) | `process_resident_memory_bytes` |
| CPU Usage | `rate(process_cpu_seconds_total[1m])` |

---

## 🧪 Test Coverage

| Service | Tests | Coverage |
|---------|-------|----------|
| Auth    | 14    | Registration, Login, Refresh Tokens, Delete Account, Health |
| Task    | 13    | CRUD, Cache Bypass, Validation, Auth Guards, Health |

---

## 📁 Project Structure

```
backend-microservices/
├── api-gateway/          # Central routing + JWT validation
├── auth-service/         # User auth + refresh tokens
├── task-service/         # Task CRUD + Redis caching
├── file-service/         # File upload/download
├── frontend/             # React + Vite dashboard
├── nginx/                # Reverse proxy config
├── grafana/              # Dashboard + provisioning
├── .github/workflows/    # CI/CD pipeline
├── docker-compose.yml    # Development stack
├── docker-compose.prod.yml # Production stack
├── prometheus.yml        # Metrics scraping config
└── .env.example          # Environment template
```

## License

MIT