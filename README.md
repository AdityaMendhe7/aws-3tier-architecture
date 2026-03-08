# 🏗️ AWS 3-Tier Architecture — Production-Ready Project

> **Stack:** Node.js · React · MySQL (RDS Aurora) · Docker · Nginx · AWS VPC · EC2 · ALB · S3 · ECR · GitHub Actions

A fully containerized, production-grade 3-tier web application deployed on AWS — demonstrating real-world backend engineering and cloud architecture patterns.

---

## 📐 Architecture Overview

```
Internet
    │
    ▼
[Internet Gateway]
    │
    ▼
[External ALB] ── Public Subnet AZ-1 & AZ-2
    │
    ├── EC2 / ECS (Web Tier) ── Nginx + React  [Public Subnet]
    │         │ (proxies /api/* calls)
    ▼
[Internal ALB] ── Private Subnet AZ-1 & AZ-2
    │
    ├── EC2 / ECS (App Tier) ── Node.js REST API  [Private Subnet]
    │         │
    ▼
[Amazon Aurora MySQL]  [Private Subnet — DB only]
    ├── Primary DB (Writer)
    └── Read Replica
```

**Key AWS Services Used:**
| Service | Purpose |
|---------|---------|
| VPC + Subnets | Network isolation (public/private/db) |
| EC2 / ECS | Compute for web & app tier |
| ALB (External) | Internet-facing load balancer for web tier |
| ALB (Internal) | Private load balancer between web → app tier |
| Amazon RDS Aurora | Managed MySQL with read replica |
| Amazon S3 | Application code + static asset storage |
| Amazon ECR | Docker image registry |
| IAM | Least-privilege roles for EC2/ECS |
| Security Groups | Layer-by-layer traffic rules |
| Auto Scaling Groups | Elastic scaling for both web & app tiers |

---

## 🗂️ Project Structure

```
aws-3tier-project/
├── app-tier/
│   ├── index.js          # Express REST API (CRUD)
│   ├── package.json
│   └── Dockerfile        # Multi-stage build (non-root user)
├── web-tier/
│   ├── App.jsx           # React frontend
│   ├── package.json
│   └── Dockerfile        # Multi-stage: build → Nginx
├── nginx/
│   └── nginx.conf        # Reverse proxy + security headers
├── scripts/
│   └── init.sql          # DB schema + seed data
├── .github/workflows/
│   └── ci-cd.yml         # GitHub Actions → ECR pipeline
├── docker-compose.yml    # Full local dev environment
└── README.md
```

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Docker & Docker Compose installed
- Node.js 18+ (for local development without Docker)

### Run everything locally with Docker Compose

```bash
# Clone the repo
git clone https://github.com/YOUR_USERNAME/aws-3tier-project.git
cd aws-3tier-project

# Start all 3 tiers
docker-compose up --build

# App is live at:
# Web Tier  → http://localhost:80
# App Tier  → http://localhost:4000
# DB        → localhost:3306
```

### Verify health checks

```bash
# App tier health
curl http://localhost:4000/health

# Web tier health
curl http://localhost:80/health

# Books API
curl http://localhost:4000/api/books
```

---

## 🔌 REST API Reference

Base URL: `http://<internal-alb-dns>/api`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/books` | List all books |
| GET | `/api/books/:id` | Get single book |
| POST | `/api/books` | Create book |
| PUT | `/api/books/:id` | Update book |
| DELETE | `/api/books/:id` | Delete book |

**POST /api/books — Request Body:**
```json
{
  "amount": "49.99",
  "description": "Designing Data-Intensive Applications"
}
```

---

## ☁️ AWS Deployment Guide

### 1. VPC Setup

Create a VPC with:
- **CIDR:** `10.0.0.0/16`
- **Public Subnets:** `10.0.1.0/24`, `10.0.2.0/24` (AZ-1, AZ-2)
- **Private Subnets:** `10.0.3.0/24`, `10.0.4.0/24` (App tier)
- **DB Subnets:** `10.0.5.0/24`, `10.0.6.0/24` (DB tier, no route to internet)

### 2. Security Groups

| SG Name | Inbound Rule | Source |
|---------|-------------|--------|
| `web-external-alb-sg` | 443, 80 | 0.0.0.0/0 |
| `web-tier-sg` | 80 | web-external-alb-sg |
| `app-internal-alb-sg` | 4000 | web-tier-sg |
| `app-tier-sg` | 4000 | app-internal-alb-sg |
| `rds-sg` | 3306 | app-tier-sg |

### 3. Push Docker Images to ECR

```bash
# Authenticate
aws ecr get-login-password --region ap-south-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.ap-south-1.amazonaws.com

# Create ECR repos
aws ecr create-repository --repository-name 3tier-app
aws ecr create-repository --repository-name 3tier-web

# Build and push
docker build -t 3tier-app ./app-tier
docker tag  3tier-app <account-id>.dkr.ecr.ap-south-1.amazonaws.com/3tier-app:latest
docker push <account-id>.dkr.ecr.ap-south-1.amazonaws.com/3tier-app:latest
```

### 4. RDS Aurora Setup

```sql
-- After RDS is running, connect and initialize:
mysql -h <rds-endpoint> -u admin -p
SOURCE scripts/init.sql;
```

### 5. Environment Variables (App Tier EC2/ECS)

```env
DB_HOST=<rds-cluster-endpoint>
DB_USER=admin
DB_PASSWORD=<your-password>
DB_NAME=webappdb
PORT=4000
NODE_ENV=production
```

---

## 🔒 Security Best Practices Implemented

- **Multi-stage Docker builds** — minimal final image, no dev dependencies
- **Non-root container user** — `nodeuser` runs the app, not root
- **Helmet.js** — sets secure HTTP headers (X-Frame-Options, HSTS, etc.)
- **Nginx security headers** — XSS protection, MIME sniffing prevention
- **Private subnets** — App and DB tiers have no direct internet access
- **Security groups** — strictly scoped: each tier only accepts traffic from the tier above
- **IAM least privilege** — EC2 role only has `s3:GetObject` + `ecr:GetAuthorizationToken`
- **Connection pooling** — mysql2 pool prevents DB overload

---

## 📈 Scalability & HA Patterns

- **Multi-AZ deployment** — all tiers span 2 Availability Zones
- **Auto Scaling Groups** — web & app tiers scale based on CPU/request metrics
- **Aurora Read Replica** — offloads read queries, stays in sync with primary
- **ALB health checks** — unhealthy instances are automatically replaced
- **Docker HEALTHCHECK** — containers self-report readiness

---

## 💡 Interview Talking Points

**"Walk me through your architecture decisions:"**
1. *Why separate web and app tiers?* → Security (web tier is public-facing, app never is) and independent scaling.
2. *Why Docker?* → Environment parity between local dev and EC2/ECS. Makes deploys reproducible.
3. *Why an Internal ALB between web and app?* → The web tier never talks directly to app instances — the ALB handles health checks, retries, and routes across AZs.
4. *Why Aurora over standard RDS MySQL?* → Aurora offers automatic failover, up to 15 read replicas, and storage auto-scaling.
5. *How do you handle DB credentials?* → AWS Secrets Manager (or Parameter Store) — never hardcoded, injected as environment variables at runtime.

---

## 📄 License

MIT — feel free to fork, extend, and use in your portfolio.
