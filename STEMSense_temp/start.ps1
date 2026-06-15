# STEMSense Startup Script - Launches Server & Frontend

Write-Host "🚀 Starting STEMSense..." -ForegroundColor Cyan

# Activate virtual environment
Write-Host "📦 Activating Python virtual environment..." -ForegroundColor Yellow
& .\.venv\Scripts\Activate.ps1

# Start the backend server in a new window
Write-Host "🔧 Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python backend/server.py" -WindowStyle Normal

# Give server time to start
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Start the frontend dev server
Write-Host "🎨 Starting frontend dev server..." -ForegroundColor Yellow
npm run dev -- --open

Write-Host "✅ STEMSense is running!" -ForegroundColor Green
