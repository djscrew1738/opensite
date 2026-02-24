#!/bin/bash
# Start AECVision Computer Vision Service for Blueprint Analysis

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

AECVISION_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/workers/core/aecvision"
VENV_DIR="$AECVISION_DIR/.venv"
PORT="${AECVISION_PORT:-8002}"

echo -e "${BLUE}=== AECVision CV Service Startup ===${NC}"
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
if [ -f "$AECVISION_DIR/requirements.txt" ]; then
    pip install --quiet -r "$AECVISION_DIR/requirements.txt"
    echo -e "${GREEN}Dependencies installed${NC}"
else
    echo -e "${YELLOW}Warning: requirements.txt not found${NC}"
fi

# Check for CUDA
echo ""
echo -e "${BLUE}Checking GPU support...${NC}"
if python3 -c "import torch; print(torch.cuda.is_available())" 2>/dev/null | grep -q "True"; then
    GPU_NAME=$(python3 -c "import torch; print(torch.cuda.get_device_name(0))" 2>/dev/null)
    echo -e "${GREEN}CUDA available: $GPU_NAME${NC}"
else
    echo -e "${YELLOW}CUDA not available, using CPU${NC}"
fi

# Check for model files
echo ""
echo -e "${BLUE}Checking model files...${NC}"
MODEL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/train_results"
if [ -d "$MODEL_DIR" ]; then
    MODEL_COUNT=$(find "$MODEL_DIR" -name "*.pt" 2>/dev/null | wc -l)
    echo -e "${GREEN}Found $MODEL_COUNT model files${NC}"
else
    echo -e "${YELLOW}Note: Model directory not found at $MODEL_DIR${NC}"
    echo -e "${YELLOW}Using default YOLOv5 pretrained model (limited blueprint detection)${NC}"
fi

# Start the service
echo ""
echo -e "${GREEN}=== Starting AECVision Service ===${NC}"
echo "Port: $PORT"
echo "Directory: $AECVISION_DIR"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "  Health:    http://localhost:$PORT/health"
echo "  Detect:    http://localhost:$PORT/detect"
echo "  Analyze:   http://localhost:$PORT/analyze"
echo "  Models:    http://localhost:$PORT/models/available"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Set environment variables
export AECVISION_PORT="$PORT"
export AECVISION_HOST="0.0.0.0"

# Start the API server
cd "$AECVISION_DIR"
exec python3 api.py
