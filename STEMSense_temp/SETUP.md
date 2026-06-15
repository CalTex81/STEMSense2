# STEMSense Setup & Running Guide

## Quick Start

### **Option 1: Automatic Startup (Recommended)**

**On Windows, run ONE of these:**

```bash
# Using PowerShell
npm start

# OR directly run the batch file
start.bat

# OR using PowerShell script
powershell -ExecutionPolicy Bypass -File start.ps1
```

This will:
1. ✅ Start the Python backend server (auto-detects available port)
2. ✅ Start the frontend dev server with Vite
3. ✅ Automatically open the app in your browser

### **Option 2: Manual Startup**

**Terminal 1 - Backend (Python server):**
```bash
# Windows
.\.venv\Scripts\activate
python backend/server.py

# Or use uvicorn directly:
uvicorn backend.server:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Then open `http://localhost:5173` in your browser.

---

## How It Works

- **Backend Server** (`backend/server.py`):
  - Runs on port 8000 (or 8001, 8002, etc. if 8000 is taken)
  - Automatically finds an available port if there's a conflict
  - Exposes `/detect` endpoint for image processing

- **Frontend** (`frontend/app.jsx`):
  - Runs on `http://localhost:5173` (Vite default)
  - Auto-detects which port the backend is running on
  - Tries ports 8000-8005 automatically

---

## Available Commands

```bash
npm start        # Launch everything (recommended)
npm run dev      # Frontend only
npm run server   # Backend server only
```

---

## Troubleshooting

### **❌ "Backend not reachable" error on scan page**

1. **Check if server is running:**
   ```bash
   # Open browser and try:
   http://localhost:8000/health
   http://localhost:8001/health
   http://localhost:8002/health
   ```

2. **Use the debug page** to diagnose:
   - Open `frontend/debug.html` in your browser
   - It will scan all common ports and show which one the backend is on

3. **Start server manually:**
   ```bash
   python backend/server.py
   ```
   The output should show:
   ```
   🚀 STEMSense Backend Server
   📍 Running on: http://localhost:8000
   ```

4. **Check venv is activated:**
   ```bash
   # Windows - should show (.venv) at start of prompt
   .\.venv\Scripts\activate
   pip list | findstr uvicorn
   ```

### **❌ "Port 8000 already in use"**
- The server should automatically try port 8001, 8002, etc.
- If it fails, manually specify a port:
  ```bash
  uvicorn backend.server:app --port 8001
  ```

### **❌ Camera not working**
- Make sure HTTPS is enabled (dev server includes it)
- Check browser permissions for camera access
- Refresh the page after granting permissions

### **❌ "No module named uvicorn"**
- Install it: 
  ```bash
  pip install uvicorn
  ```

---

## Dependencies

Ensure your venv has these installed:
```bash
pip install fastapi uvicorn pillow numpy ultralytics
```

Frontend requires Node 14+ and npm.

---

## Quick Debug Checklist

- [ ] Is the backend server running? (Check terminal for output)
- [ ] What port is it running on? (Should print in console)
- [ ] Can you reach `/health` endpoint in browser?
- [ ] Is the venv activated? (Check prompt shows `.venv`)
- [ ] Does npm run dev work without errors?
- [ ] Open `frontend/debug.html` to test connection

---

## File Structure

```
STEMSense/
├── backend/
│   └── server.py          ← FastAPI backend
├── frontend/
│   ├── app.jsx            ← React app
│   ├── scan.html          ← Camera page
│   ├── index.html         ← Main page
│   ├── debug.html         ← Diagnostic tool ⭐
│   └── styles.css
├── package.json
├── start.ps1              ← PowerShell launcher
├── start.bat              ← Batch launcher
├── SETUP.md               ← This file
└── .venv/                 ← Python venv
```

