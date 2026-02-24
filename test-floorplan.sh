#!/bin/bash
# Test script for Floorplan Dimension Extractor integration

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

FLOORPLAN_URL="${FLOORPLAN_URL:-http://localhost:8003}"
API_URL="${API_URL:-http://localhost:5001/api}"

echo -e "${BLUE}=== Floorplan Dimension Extractor Integration Test ===${NC}"
echo ""
echo "Floorplan Service: $FLOORPLAN_URL"
echo "OpenSite API: $API_URL"
echo ""

# Check if Floorplan service is running
echo -e "${BLUE}1. Checking Floorplan service health...${NC}"
if curl -s "$FLOORPLAN_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Floorplan service is running${NC}"
    curl -s "$FLOORPLAN_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$FLOORPLAN_URL/health"
    echo ""
else
    echo -e "${RED}✗ Floorplan service is not running${NC}"
    echo "  Start it with: ./start-floorplan.sh"
    exit 1
fi

# Check OpenSite backend
echo -e "${BLUE}2. Checking OpenSite backend...${NC}"
if curl -s "$API_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ OpenSite backend is running${NC}"
    echo ""
else
    echo -e "${RED}✗ OpenSite backend is not running${NC}"
    echo "  Start it with: ./start.sh"
    exit 1
fi

# Check Floorplan routes
echo -e "${BLUE}3. Checking Floorplan API routes...${NC}"
if curl -s "$API_URL/floorplan/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Floorplan routes are accessible${NC}"
    curl -s "$API_URL/floorplan/health" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/floorplan/health"
    echo ""
else
    echo -e "${YELLOW}⚠ Floorplan routes may not be configured${NC}"
fi

# Get supported patterns
echo -e "${BLUE}4. Fetching supported patterns...${NC}"
PATTERNS=$(curl -s "$FLOORPLAN_URL/patterns")
echo "$PATTERNS" | python3 -m json.tool 2>/dev/null || echo "$PATTERNS"
echo ""

# Test with sample PDF if available
echo -e "${BLUE}5. Looking for test files...${NC}"
TEST_DIR="./test-files"
if [ -d "$TEST_DIR" ]; then
    TEST_FILE=$(find "$TEST_DIR" -name "*.pdf" | head -1)
    if [ -n "$TEST_FILE" ]; then
        echo -e "${GREEN}Found test file: $TEST_FILE${NC}"
        echo ""
        
        echo -e "${BLUE}6. Testing dimension extraction...${NC}"
        DIM_RESULT=$(curl -s -X POST "$FLOORPLAN_URL/extract/dimensions" \
            -F "file=@$TEST_FILE" \
            -F "method=auto" 2>/dev/null || echo '{"error": "Request failed"}')
        echo "$DIM_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DIM_RESULT"
        echo ""
    else
        echo -e "${YELLOW}No PDF test files found in $TEST_DIR${NC}"
        echo "  Add PDF floorplans to test extraction"
    fi
else
    echo -e "${YELLOW}Test directory not found: $TEST_DIR${NC}"
    echo "  Create it and add sample floorplans to test"
fi

echo -e "${GREEN}=== Test Complete ===${NC}"
echo ""
echo "To test with a specific file:"
echo "  curl -X POST $FLOORPLAN_URL/extract -F 'file=@your-floorplan.pdf'"
echo ""
echo "To test pipe estimation:"
echo "  curl -X POST $FLOORPLAN_URL/analyze/pipe-estimate -F 'file=@your-floorplan.pdf'"
echo ""
echo "To test comprehensive analysis:"
echo "  curl -X POST $API_URL/floorplan/comprehensive \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"filePath\":\"/path/to/floorplan.pdf\"}'"
echo ""
