#!/bin/bash
# Script to install Phase 1 visualization packages
# Run this script from the frontend directory

set -e

echo "Installing Phase 1 visualization packages..."
echo "This may take several minutes depending on your network speed."
echo ""

cd "$(dirname "$0")/frontend"

# Install packages one by one to avoid timeouts
packages=(
  "recharts@2.12.7"
  "react-markdown@9.0.1"
  "remark-gfm@4.0.0"
  "framer-motion@11.0.28"
  "react-countup@6.5.0"
  "html2canvas@1.4.1"
  "jspdf@2.5.2"
)

failed_packages=()

for package in "${packages[@]}"; do
  echo "Installing $package..."
  if npm install --no-audit --no-fund --timeout=180000 "$package"; then
    echo "✓ $package installed successfully"
  else
    echo "✗ $package failed to install"
    failed_packages+=("$package")
  fi
  echo ""
done

echo ""
echo "======================================"
echo "Installation Summary"
echo "======================================"

if [ ${#failed_packages[@]} -eq 0 ]; then
  echo "✓ All packages installed successfully!"
  echo ""
  echo "Next steps:"
  echo "1. Start the development server: npm run dev"
  echo "2. Navigate to the Pricing page"
  echo "3. Upload a blueprint to test the new visualizations"
else
  echo "⚠ Some packages failed to install:"
  for package in "${failed_packages[@]}"; do
    echo "  - $package"
  done
  echo ""
  echo "You can try installing them manually:"
  for package in "${failed_packages[@]}"; do
    echo "  npm install $package"
  done
fi

echo ""
echo "For troubleshooting, see: PHASE1_IMPLEMENTATION.md"
