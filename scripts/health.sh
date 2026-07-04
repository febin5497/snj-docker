#!/bin/bash
# Check health of all services
echo "=== Service Health Check ==="
echo ""

services=(
    "auth-service:5001"
    "user-service:5002"
    "company-service:5003"
    "staff-service:5004"
    "project-service:5005"
    "attendance-service:5006"
    "finance-service:5007"
    "payroll-service:5008"
    "procurement-service:5009"
    "inventory-service:5010"
    "vehicle-service:5011"
    "sales-service:5012"
    "notification-service:5013"
)

for svc in "${services[@]}"; do
    name="${svc%%:*}"
    port="${svc##*:}"
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:${port}/api/health" 2>/dev/null)
    if [ "$status" = "200" ]; then
        echo "  [OK] $name (port $port)"
    else
        echo "  [FAIL] $name (port $port) - Status: $status"
    fi
done

echo ""
echo "=== Infrastructure ==="
db_status=$(docker-compose ps db --format "{{.State}}" 2>/dev/null)
redis_status=$(docker-compose ps redis --format "{{.State}}" 2>/dev/null)
echo "  PostgreSQL: $db_status"
echo "  Redis: $redis_status"
