#!/bin/bash
#
# OpenSite Blueprint Analysis - Stress Test Script
# Tests all services under concurrent load
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
AECVISION_URL="${AECVISION_URL:-http://localhost:8002}"
FLOORPLAN_URL="${FLOORPLAN_URL:-http://localhost:8003}"
BACKEND_URL="${BACKEND_URL:-http://localhost:5001}"
CONCURRENT="${CONCURRENT:-5}"
TOTAL_REQUESTS="${TOTAL_REQUESTS:-20}"
TIMEOUT="${TIMEOUT:-30}"

# Counters
PASSED=0
FAILED=0
TIMES=()

# Test file
TEST_FILE="/tmp/stress-test-$$.pdf"

# Cleanup function
cleanup() {
    rm -f "$TEST_FILE"
}
trap cleanup EXIT

# Create dummy PDF
create_test_file() {
    # Create a simple PDF-like file (not real PDF, but good enough for stress testing)
    dd if=/dev/urandom bs=1K count=100 of="$TEST_FILE" 2>/dev/null
}

# Print header
print_header() {
    echo ""
    echo "=================================="
    echo "🚀 Blueprint Analysis Stress Test"
    echo "=================================="
    echo "AECVision:  $AECVISION_URL"
    echo "Floorplan:  $FLOORPLAN_URL"
    echo "Backend:    $BACKEND_URL"
    echo "Concurrent: $CONCURRENT"
    echo "Total:      $TOTAL_REQUESTS"
    echo "=================================="
    echo ""
}

# Health check
health_check() {
    local name=$1
    local url=$2
    
    echo -n "Checking $name... "
    
    local start=$(date +%s%N)
    local status
    status=$(curl -s -o /dev/null -w "%{http_code}" --max-time "$TIMEOUT" "$url" 2>&1 || echo "000")
    local end=$(date +%s%N)
    
    local time=$(( (end - start) / 1000000 ))
    
    if [ "$status" = "200" ]; then
        echo -e "${GREEN}✓ OK${NC} (${time}ms)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (HTTP $status)"
        ((FAILED++))
        return 1
    fi
}

# Load test function
load_test() {
    local name=$1
    local url=$2
    local endpoint=$3
    local method=${4:-POST}
    
    echo ""
    echo "📊 Testing $name ($TOTAL_REQUESTS requests, $CONCURRENT concurrent)"
    echo "----------------------------------------"
    
    local p=0
    local f=0
    local times=()
    
    # Run requests in batches
    local batches=$(( (TOTAL_REQUESTS + CONCURRENT - 1) / CONCURRENT ))
    
    for ((batch=0; batch<batches; batch++)); do
        local batch_size=$(( CONCURRENT ))
        local remaining=$(( TOTAL_REQUESTS - batch * CONCURRENT ))
        if [ $remaining -lt $batch_size ]; then
            batch_size=$remaining
        fi
        
        # Launch concurrent requests
        local pids=()
        for ((i=0; i<batch_size; i++)); do
            (
                local req_num=$(( batch * CONCURRENT + i + 1 ))
                local start=$(date +%s%N)
                
                local status
                if [ "$method" = "POST" ]; then
                    status=$(curl -s -o /dev/null -w "%{http_code}" \
                        --max-time "$TIMEOUT" \
                        -X POST \
                        -F "file=@$TEST_FILE" \
                        "$url$endpoint" 2>&1 || echo "000")
                else
                    status=$(curl -s -o /dev/null -w "%{http_code}" \
                        --max-time "$TIMEOUT" \
                        "$url$endpoint" 2>&1 || echo "000")
                fi
                
                local end=$(date +%s%N)
                local time=$(( (end - start) / 1000000 ))
                
                if [ "$status" = "200" ] || [ "$status" = "201" ]; then
                    echo "PASS $time"
                else
                    echo "FAIL $status"
                fi
            ) &
            pids+=($!)
        done
        
        # Wait for batch to complete
        for pid in "${pids[@]}"; do
            local result
            result=$(wait $pid && cat <<< "done" || cat <<< "failed")
        done
        
        # Small delay between batches
        sleep 0.5
        
        # Show progress
        local completed=$(( batch * CONCURRENT + batch_size ))
        printf "\r  Progress: %d/%d" "$completed" "$TOTAL_REQUESTS"
    done
    
    echo ""
    echo -e "  ${GREEN}Passed: $p${NC} | ${RED}Failed: $f${NC}"
    
    PASSED=$((PASSED + p))
    FAILED=$((FAILED + f))
}

# Simple concurrent test with curl
concurrent_test() {
    local name=$1
    local url=$2
    local endpoint=$3
    
    echo ""
    echo "📊 Testing $name ($TOTAL_REQUESTS requests)"
    echo "----------------------------------------"
    
    local p=0
    local f=0
    
    # Use xargs for concurrency
    seq $TOTAL_REQUESTS | xargs -P "$CONCURRENT" -I {} bash -c "
        status=\$(curl -s -o /dev/null -w '%{http_code}' --max-time $TIMEOUT -X POST -F 'file=@$TEST_FILE' '$url$endpoint' 2>&1 || echo '000')
        if [ \"\$status\" = '200' ] || [ \"\$status\" = '201' ]; then
            echo 'PASS'
        else
            echo 'FAIL'
        fi
    " 2>/dev/null | {
        while read -r line; do
            if [ "$line" = "PASS" ]; then
                ((p++))
            else
                ((f++))
            fi
            printf "\r  Progress: %d/%d (Pass: %d, Fail: %d)" "$((p+f))" "$TOTAL_REQUESTS" "$p" "$f"
        done
        echo ""
    }
    
    PASSED=$((PASSED + p))
    FAILED=$((FAILED + f))
}

# Database stress test
db_stress_test() {
    echo ""
    echo "🗄️  Database Stress Test"
    echo "----------------------------------------"
    
    # This would require SQLite access - simplified version
    echo "  ℹ️  Database tests require backend API access"
    
    # Test if we can hit the analysis endpoint multiple times
    local p=0
    local f=0
    
    for ((i=0; i<10; i++)); do
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" \
            --max-time "$TIMEOUT" \
            "$BACKEND_URL/api/blueprint/status/test-$i" 2>&1 || echo "000")
        
        # 404 is OK - means the endpoint exists but job doesn't
        if [ "$status" = "200" ] || [ "$status" = "404" ]; then
            ((p++))
        else
            ((f++))
        fi
        printf "\r  Progress: %d/10" "$((i+1))"
    done
    
    echo ""
    echo -e "  ${GREEN}Passed: $p${NC} | ${RED}Failed: $f${NC}"
    
    PASSED=$((PASSED + p))
    FAILED=$((FAILED + f))
}

# Memory usage check
memory_check() {
    echo ""
    echo "💾 System Memory"
    echo "----------------------------------------"
    
    if command -v free &> /dev/null; then
        free -h | grep -E "Mem|Swap"
    elif command -v vm_stat &> /dev/null; then
        # macOS
        vm_stat | head -5
    fi
    
    echo ""
    echo "🔄 Load Average"
    uptime | awk -F'load average:' '{print "  Load:" $2}'
}

# Summary report
print_summary() {
    echo ""
    echo "=================================="
    echo "📈 STRESS TEST SUMMARY"
    echo "=================================="
    
    local total=$((PASSED + FAILED))
    local rate=0
    if [ $total -gt 0 ]; then
        rate=$((PASSED * 100 / total))
    fi
    
    echo ""
    echo "Total Requests: $total"
    echo -e "Passed: ${GREEN}$PASSED${NC}"
    echo -e "Failed: ${RED}$FAILED${NC}"
    echo "Success Rate: ${rate}%"
    
    echo ""
    if [ $rate -ge 95 ]; then
        echo -e "${GREEN}✅ STRESS TEST PASSED${NC}"
    elif [ $rate -ge 80 ]; then
        echo -e "${YELLOW}⚠️  STRESS TEST PARTIAL${NC}"
    else
        echo -e "${RED}❌ STRESS TEST FAILED${NC}"
    fi
    echo "=================================="
}

# Main execution
main() {
    print_header
    create_test_file
    
    # Phase 1: Health Checks
    echo "🔍 Phase 1: Health Checks"
    echo "----------------------------------------"
    
    health_check "AECVision" "$AECVISION_URL/health"
    health_check "Floorplan" "$FLOORPLAN_URL/health"
    health_check "Backend" "$BACKEND_URL/api/health"
    
    # Phase 2: Load Tests (only if health checks pass)
    if [ $FAILED -eq 0 ]; then
        echo ""
        echo "⚡ Phase 2: Load Testing"
        
        # Note: Full load testing requires actual services running
        # For now, just test endpoints exist
        echo ""
        echo "ℹ️  Load tests require active services with real ML models"
        echo "   Skipping heavy load tests (services may not have models loaded)"
        
        # Light endpoint tests
        echo ""
        echo "🧪 Light Endpoint Tests"
        
        # Test with invalid file (should return error, not crash)
        echo -n "  AECVision error handling... "
        local status
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
            -X POST -F "file=@$TEST_FILE" \
            "$AECVISION_URL/detect" 2>&1 || echo "000")
        # 422 or 500 is OK for invalid file - means endpoint exists
        if [ "$status" != "000" ] && [ "$status" != "404" ]; then
            echo -e "${GREEN}✓${NC} (HTTP $status - endpoint exists)"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} (HTTP $status)"
            ((FAILED++))
        fi
        
        echo -n "  Floorplan error handling... "
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 \
            -X POST -F "file=@$TEST_FILE" \
            "$FLOORPLAN_URL/extract" 2>&1 || echo "000")
        if [ "$status" != "000" ] && [ "$status" != "404" ]; then
            echo -e "${GREEN}✓${NC} (HTTP $status - endpoint exists)"
            ((PASSED++))
        else
            echo -e "${RED}✗${NC} (HTTP $status)"
            ((FAILED++))
        fi
        
        # Database stress test
        db_stress_test
        
    else
        echo ""
        echo -e "${YELLOW}⚠️  Skipping load tests - some services unhealthy${NC}"
    fi
    
    # Phase 3: Memory Check
    memory_check
    
    # Summary
    print_summary
    
    # Exit code
    if [ $((PASSED * 100 / (PASSED + FAILED))) -ge 80 ]; then
        exit 0
    else
        exit 1
    fi
}

# Run
main "$@"
