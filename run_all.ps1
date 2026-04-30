Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "   AI-BASED CYBERSECURITY MONITORING SYSTEM STARTUP      " -ForegroundColor Cyan
Write-Host "=========================================================" -ForegroundColor Cyan

# 1. Start ML Service (Python FastAPI)
Write-Host "[1/3] Starting ML Service (Port 5001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ml-service; .\venv\Scripts\activate; uvicorn app.main:app --reload --port 5001"

# 2. Start Backend (Node.js Express)
Write-Host "[2/3] Starting Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"

# 3. Start Frontend (React Vite)
Write-Host "[3/3] Starting Frontend Dashboard (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "`nAll services are launching in separate windows." -ForegroundColor Green
Write-Host "---------------------------------------------------------"
Write-Host "Frontend:    http://localhost:5173" -ForegroundColor White
Write-Host "Backend:     http://localhost:5000/api" -ForegroundColor White
Write-Host "ML Service:  http://localhost:5001/docs" -ForegroundColor White
Write-Host "---------------------------------------------------------"
Write-Host "To simulate traffic and anomalies, run: cd backend; node simulate_traffic.js" -ForegroundColor Cyan
