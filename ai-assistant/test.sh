#!/bin/bash

# AI Assistant - Quick Test Script

API_URL="${API_URL:-http://localhost:3210}"
API_KEY="${API_KEY:-dev-key-change-me}"

echo "=========================================="
echo "🤖 AI Assistant API Tests"
echo "API: $API_URL"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    
    echo -n "Testing $name... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$API_URL$endpoint")
    fi
    
    if [ "$response" -eq 200 ] || [ "$response" -eq 401 ]; then
        echo -e "${GREEN}OK${NC} ($response)"
        return 0
    else
        echo -e "${RED}FAIL${NC} ($response)"
        return 1
    fi
}

# Health check (no auth)
echo "1. Health Check"
curl -s "$API_URL/health" | head -c 200
echo ""
echo ""

# Status (no auth)
echo "2. Status Check"
curl -s "$API_URL/status" | head -c 200
echo ""
echo ""

# API endpoints (require auth)
echo "3. API Endpoints (with auth)"
test_endpoint "Projects" "GET" "/api/projects?api_key=$API_KEY"
test_endpoint "Sessions" "GET" "/api/sessions?api_key=$API_KEY"
test_endpoint "Chat" "POST" "/api/chat?api_key=$API_KEY"

echo ""
echo "=========================================="
echo "Tests complete!"
echo "=========================================="
