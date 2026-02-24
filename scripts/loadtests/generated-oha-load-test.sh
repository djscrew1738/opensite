#!/bin/bash

# ==============================================================================
# Opensite API Load Testing Script (oha)
# ==============================================================================
# This script uses 'oha' (https://github.com/hatoo/oha) to perform load testing
# on the Opensite API endpoints.
#
# Usage:
#   1. Ensure 'oha' is installed on your system.
#   2. Set the environment variables below or pass them inline.
#   3. Run the script: ./generated-oha-load-test.sh
#
# Example with custom parameters:
#   TARGET_URL="http://localhost:5001" DURATION="15s" CONNECTIONS=100 ./generated-oha-load-test.sh
# ==============================================================================

# Configuration Parameters (with defaults)
TARGET_URL="${TARGET_URL:-http://localhost:5001}"
DURATION="${DURATION:-10s}"         # Duration of the test (e.g., 10s, 1m)
CONNECTIONS="${CONNECTIONS:-50}"    # Number of concurrent connections
RATE="${RATE:-0}"                   # Requests per second (0 means unlimited)

# Build the base oha command arguments
OHA_ARGS="-z $DURATION -c $CONNECTIONS"
if [ "$RATE" -gt 0 ]; then
  OHA_ARGS="$OHA_ARGS -q $RATE"
fi

echo "=============================================================================="
echo "Starting Load Tests"
echo "Target URL:  $TARGET_URL"
echo "Duration:    $DURATION per endpoint"
echo "Connections: $CONNECTIONS"
echo "Rate Limit:  $RATE req/sec (0 = unlimited)"
echo "=============================================================================="
echo ""

# Helper function to run a test
run_test() {
  local endpoint=$1
  local method=${2:-GET}
  
  echo "------------------------------------------------------------------------------"
  echo "Testing Endpoint: [$method] $endpoint"
  echo "------------------------------------------------------------------------------"
  
  # Note: --no-tui is used for clean output in scripts. Remove if you want the interactive UI.
  oha $OHA_ARGS --no-tui -m "$method" "$TARGET_URL$endpoint"
  
  echo ""
  sleep 2 # Brief pause between tests
}

# ------------------------------------------------------------------------------
# Test Scenarios
# ------------------------------------------------------------------------------

# 1. Health Check (Lightweight, good baseline)
run_test "/api/health"

# 2. Dashboard Stats (Aggregations, moderate database load)
run_test "/api/dashboard/stats"

# 3. Leads Listing (Database read)
run_test "/api/leads"

# 4. Permits Summary (Database read, potential aggregations)
run_test "/api/permits/summary"

# 5. Takeoff Materials (Database read, potentially large payload)
run_test "/api/takeoff/materials"

# 6. Projects Listing (Database read)
run_test "/api/projects"

echo "=============================================================================="
echo "Load Tests Completed"
echo "=============================================================================="
