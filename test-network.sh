#!/bin/bash
# Test network connectivity and npm registry access

echo "Testing network connectivity for npm installation..."
echo ""

echo "1. Testing DNS resolution..."
if host registry.npmjs.org > /dev/null 2>&1; then
    echo "   ✓ DNS resolution working"
else
    echo "   ✗ DNS resolution failed"
fi

echo ""
echo "2. Testing HTTPS connectivity to npm registry..."
if curl -I -s --connect-timeout 5 https://registry.npmjs.org/ | head -1 | grep -q "200"; then
    echo "   ✓ Can connect to npm registry"
else
    echo "   ✗ Cannot connect to npm registry"
fi

echo ""
echo "3. Testing package availability..."
if curl -s --connect-timeout 5 https://registry.npmjs.org/recharts | head -c 100 | grep -q "name"; then
    echo "   ✓ Can fetch package data"
else
    echo "   ✗ Cannot fetch package data (timeout?)"
fi

echo ""
echo "4. Current npm configuration:"
echo "   Registry: $(npm config get registry)"
echo "   Timeout: $(npm config get fetch-timeout)"
echo "   Retries: $(npm config get fetch-retries)"

echo ""
echo "5. Recommended actions:"
if ! curl -I -s --connect-timeout 5 https://registry.npmjs.org/ | head -1 | grep -q "200"; then
    echo "   → Try using mirror registry: ./install-with-mirror.sh"
    echo "   → Check firewall/proxy settings"
    echo "   → Try from different network (mobile hotspot)"
else
    echo "   → Network seems OK, try: npm install recharts"
    echo "   → Or increase timeout: npm config set fetch-timeout 600000"
fi

