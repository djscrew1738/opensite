#!/bin/bash
# Start Floorplan Dimension Extractor Service

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FLOORPLAN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/workers/core/floorplan"
VENV_DIR="$FLOORPLAN_DIR/.venv"
PORT="${FLOORPLAN_PORT:-8003}"

echo -e "${BLUE}=== Floorplan Dimension Extractor Service Startup ===${NC}"
echo ""

# Check Python version
echo -e "${BLUE}Checking Python...${NC}"
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    exit 1
fi

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "Python version: $PYTHON_VERSION"

# Check Python >= 3.9
REQUIRED_VERSION="3.9"
CURRENT_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo -e "${RED}Error: Python $REQUIRED_VERSION or higher is required${NC}"
    exit 1
fi

# Create virtual environment if it doesn't exist
echo ""
echo -e "${BLUE}Setting up virtual environment...${NC}"
if [ ! -d "$VENV_DIR" ]; then
    echo "Creating virtual environment..."
    python3 -m venv "$VENV_DIR"
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --quiet --upgrade pip

# Install requirements
echo ""
echo -e "${BLUE}Installing dependencies...${NC}"
if [ -f "$FLOORPLAN_DIR/requirements.txt" ]; then
    pip install --quiet -r "$FLOORPLAN_DIR/requirements.txt"
    echo -e "${GREEN}Dependencies installed${NC}"
else
    echo -e "${YELLOW}Warning: requirements.txt not found${NC}"
fi

# Start the service
echo ""
echo -e "${GREEN}=== Starting Floorplan Dimension Extractor Service ===${NC}"
echo "Port: $PORT"
echo "Directory: $FLOORPLAN_DIR"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "  Health:     http://localhost:$PORT/health"
echo "  Extract:    http://localhost:$PORT/extract"
echo "  Dimensions: http://localhost:$PORT/extract/dimensions"
echo "  Codes:      http://localhost:$PORT/extract/codes"
echo "  Visualize:  http://localhost:$PORT/visualize"
echo "  Patterns:   http://localhost:$PORT/patterns"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Set environment variables
export FLOORPLAN_PORT="$PORT"
export FLOORPLAN_HOST="0.0.0.0"

# Start the API server
cd "$FLOORPLAN_DIR"
exec python3 -m api
