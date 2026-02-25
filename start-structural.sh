#!/bin/bash
# Start Structural Element Detection Service (YOLOv8 Floor Plan Analysis)

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

STRUCTURAL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/workers/core/structural-detector"
VENV_DIR="$STRUCTURAL_DIR/.venv"
PORT="${STRUCTURAL_PORT:-8004}"

echo -e "${BLUE}=== Structural Element Detector Startup ===${NC}"
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
if [ -f "$STRUCTURAL_DIR/requirements.txt" ]; then
    pip install --quiet -r "$STRUCTURAL_DIR/requirements.txt"
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

# Check for model file
echo ""
echo -e "${BLUE}Checking model file...${NC}"
MODEL_PATH="$STRUCTURAL_DIR/models/best.pt"
if [ -f "$MODEL_PATH" ]; then
    MODEL_SIZE=$(du -h "$MODEL_PATH" | cut -f1)
    echo -e "${GREEN}Model found: $MODEL_PATH ($MODEL_SIZE)${NC}"
else
    echo -e "${YELLOW}Warning: Model not found at $MODEL_PATH${NC}"
    echo -e "${YELLOW}Using YOLOv8n pretrained fallback (limited floor plan detection)${NC}"
fi

# Start the service
echo ""
echo -e "${GREEN}=== Starting Structural Detector Service ===${NC}"
echo "Port: $PORT"
echo "Directory: $STRUCTURAL_DIR"
echo ""
echo -e "${BLUE}API Endpoints:${NC}"
echo "  Health:    http://localhost:$PORT/health"
echo "  Detect:    http://localhost:$PORT/detect"
echo "  Analyze:   http://localhost:$PORT/analyze"
echo "  Classes:   http://localhost:$PORT/models/classes"
echo ""
echo -e "${BLUE}Detection Classes:${NC}"
echo "  Wall, Curtain Wall, Column, Door, Sliding Door,"
echo "  Window, Stair Case, Railing, Dimension"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Set environment variables
export STRUCTURAL_PORT="$PORT"
export STRUCTURAL_HOST="0.0.0.0"
export STRUCTURAL_MODEL_PATH="models/best.pt"

# Start the API server
cd "$STRUCTURAL_DIR"
exec python3 api.py
