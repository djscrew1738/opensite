#!/bin/bash
# Install packages using Taobao mirror (faster in many regions)

cd "$(dirname "$0")/frontend"

echo "Configuring npm to use Taobao mirror..."
npm config set registry https://registry.npmmirror.com

echo "Installing packages..."
npm install recharts react-markdown remark-gfm html2canvas jspdf

echo ""
echo "Restoring default npm registry..."
npm config set registry https://registry.npmjs.org

echo ""
echo "Verifying installation..."
npm list recharts react-markdown html2canvas jspdf --depth=0

echo ""
echo "Done! If successful, you can now start testing Phase 1."
