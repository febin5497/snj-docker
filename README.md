# Construction ERP - Docker Microservices

## Architecture

```
16 Docker Containers
├── 13 Python/Flask Microservices
├── 1 PostgreSQL Database
├── 1 Redis (Event Bus + Cache)
└── 1 Nginx API Gateway
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| gateway | 8080 | Nginx reverse proxy / API Gateway |
| auth-service | 5001 | Login, JWT, Password management |
| user-service | 5002 | User CRUD, RBAC |
| company-service | 5003 | Company settings |
| staff-service | 5004 | Staff, Expenses |
| project-service | 5005 | Projects, Clients, Tasks, Stages |
| attendance-service | 5006 | Attendance, Photos |
| finance-service | 5007 | Transactions, Invoices, Budgets, CoA |
| payroll-service | 5008 | Payroll Cycles, Records |
| procurement-service | 5009 | Suppliers, Purchases, Indents, GRN |
| inventory-service | 5010 | Materials, Equipment |
| vehicle-service | 5011 | Vehicles, Fuel, Maintenance |
| sales-service | 5012 | Sales, Quotes |
| notification-service | 5013 | Notifications (Redis pub/sub) |
| db | 5432 | PostgreSQL 16 |
| redis | 6379 | Redis 7 |

## Quick Start

```bash
# Start everything
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop everything
docker-compose down

# Check health
bash scripts/health.sh
```

## API Base URL

All API requests go through the gateway:
```
http://localhost:8080/api/
```

## Default Login

```
Username: superadmin
Password: Admin@123
```

## Development

Each service is independent. To work on a single service:

```bash
# Rebuild one service
docker-compose up -d --build auth-service

# View one service's logs
docker-compose logs -f auth-service

# Shell into a service
docker-compose exec auth-service bash
```

## Database

Single shared PostgreSQL database. All services connect to the same DB.
Schema is auto-initialized from `database/init.sql`.

## Event Bus

Redis pub/sub for inter-service events:
- `staff.created` - Staff service publishes, notification service subscribes
- `expense.submitted` - Staff service publishes, notification + finance subscribe
- `payroll.approved` - Payroll service publishes, notification + finance subscribe
