#!/usr/bin/env bash
# STEMSense startup script for macOS / Linux

echo "🚀 Starting STEMSense..."

# Ensure script runs from project root
cd "$(dirname "$0")/.." || exit 1

# Activate Python virtual environment if available
if [ -d ".venv" ]; then
  if [ -f ".venv/bin/activate" ]; then
    source ".venv/bin/activate"
  fi
fi

# Start backend server in a new terminal window if possible
if command -v osascript >/dev/null 2>&1; then
  osascript <<'APPLESCRIPT'
    tell application "Terminal"
      do script "cd \"$(pwd)\"; python backend/server.py"
      activate
    end tell
  APPLESCRIPT
elif command -v gnome-terminal >/dev/null 2>&1; then
  gnome-terminal -- bash -lc "cd \"$(pwd)\" && python backend/server.py; exec bash"
else
  echo "⚠ Could not open server terminal automatically. Run 'python backend/server.py' manually in another window."
fi

# Give backend a moment to start
sleep 3

echo "🎨 Starting frontend dev server..."
npm run dev -- --open

echo "✅ STEMSense is running!"
