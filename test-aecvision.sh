#!/bin/bash
# Test script for AECVision integration

set -e

BLUE='\033[0;34m'
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

AECVISION_URL="${AECVISION_URL:-http://localhost:8002}"
API_URL="${API_URL:-http://localhost:5001/api}"

echo -e "${BLUE}=== AECVision Integration Test ===${NC}"
echo ""
echo "AECVision Service: $AECVISION_URL"
echo "OpenSite API: $API_URL"
echo ""

# Check if AECVision service is running
echo -e "${BLUE}1. Checking AECVision service health...${NC}"
if curl -s "$AECVISION_URL/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AECVision service is running${NC}"
    curl -s "$AECVISION_URL/health" | python3 -m json.tool 2>/dev/null || curl -s "$AECVISION_URL/health"
    echo ""
else
    echo -e "${RED}✗ AECVision service is not running${NC}"
    echo "  Start it with: ./start-aecvision.sh"
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

# Check AECVision routes
echo -e "${BLUE}3. Checking AECVision API routes...${NC}"
if curl -s "$API_URL/aecvision/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ AECVision routes are accessible${NC}"
    curl -s "$API_URL/aecvision/health" | python3 -m json.tool 2>/dev/null || curl -s "$API_URL/aecvision/health"
    echo ""
else
    echo -e "${YELLOW}⚠ AECVision routes may not be configured${NC}"
fi

# Get available models
echo -e "${BLUE}4. Fetching available detection classes...${NC}"
MODELS=$(curl -s "$AECVISION_URL/models/available")
echo "$MODELS" | python3 -m json.tool 2>/dev/null || echo "$MODELS"
echo ""

# Test with sample image if available
echo -e "${BLUE}5. Looking for test files...${NC}"
TEST_DIR="./test-files"
if [ -d "$TEST_DIR" ]; then
    TEST_FILE=$(find "$TEST_DIR" -name "*.pdf" -o -name "*.jpg" -o -name "*.png" | head -1)
    if [ -n "$TEST_FILE" ]; then
        echo -e "${GREEN}Found test file: $TEST_FILE${NC}"
        echo ""
        
        echo -e "${BLUE}6. Testing object detection...${NC}"
        DETECT_RESULT=$(curl -s -X POST "$AECVISION_URL/detect" \
            -F "file=@$TEST_FILE" \
            -F "confidence=0.5" 2>/dev/null || echo '{"error": "Request failed"}')
        echo "$DETECT_RESULT" | python3 -m json.tool 2>/dev/null || echo "$DETECT_RESULT"
        echo ""
    else
        echo -e "${YELLOW}No test files found in $TEST_DIR${NC}"
        echo "  Add PDF or image files to test detection"
    fi
else
    echo -e "${YELLOW}Test directory not found: $TEST_DIR${NC}"
    echo "  Create it and add sample blueprints to test"
fi

echo -e "${GREEN}=== Test Complete ===${NC}"
echo ""
echo "To test with a specific file:"
echo "  curl -X POST $AECVISION_URL/detect -F 'file=@your-blueprint.pdf'"
echo ""
echo "To test enhanced analysis:"
echo "  curl -X POST $API_URL/aecvision/enhanced-analysis \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"filePath\":\"/path/to/blueprint.pdf\"}'"
echo ""
