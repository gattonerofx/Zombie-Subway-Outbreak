#!/usr/bin/env bash
# ============================================================
#  ZOMBIE: TOKYO SUBWAY OUTBREAK — One-Click Launcher
# ============================================================
#  Usage:  ./start.sh
#
#  Prerequisites:
#    • Node.js 18+ (https://nodejs.org)
#    • Your zombie 3D model placed at:  public/models/zombie.glb
#
#  This script installs dependencies and launches the dev server.
# ============================================================

set -e
cd "$(dirname "$0")"

echo ""
echo "  🧟  ZOMBIE: TOKYO SUBWAY OUTBREAK"
echo "  ───────────────────────────────────"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "  ❌ Node.js not found. Install it from https://nodejs.org"
  exit 1
fi
echo "  ✓ Node.js $(node -v)"

# Check zombie model
if [ ! -f "public/models/zombie.glb" ]; then
  echo ""
  echo "  ⚠️  Zombie model not found at: public/models/zombie.glb"
  echo "      Copy your zombie.glb file there, then re-run this script."
  echo ""
  echo "      Example:  cp ~/zombie.glb public/models/zombie.glb"
  echo ""
  exit 1
fi
echo "  ✓ Zombie model found ($(du -h public/models/zombie.glb | cut -f1))"

# Install dependencies (skip if node_modules is fresh)
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules/.package-lock.json" ]; then
  echo ""
  echo "  📦 Installing dependencies..."
  npm install
  echo "  ✓ Dependencies installed"
else
  echo "  ✓ Dependencies up to date"
fi

echo ""
echo "  🎮 Starting game server..."
echo "     Open http://localhost:3000 in your browser"
echo "     Press Ctrl+C to stop"
echo ""

npx next dev --turbopack
