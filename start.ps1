# ValueScope startup script
# Version: 1.0.0
# Date: 2025-12-15

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   ValueScope Startup" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

try {
    Write-Host "[1/6] Installing Node.js dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
    Write-Host "OK Node.js dependencies installed" -ForegroundColor Green
    Write-Host ""

    Write-Host "[2/6] Installing Python dependencies..." -ForegroundColor Yellow
    py -3.10 -m pip install -r scripts/requirements.txt
    if ($LASTEXITCODE -ne 0) { throw "pip install failed" }
    Write-Host "OK Python dependencies installed" -ForegroundColor Green
    Write-Host ""

    Write-Host "[3/6] Creating data directories..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path "data" -Force | Out-Null
    New-Item -ItemType Directory -Path "data/edinet_parsed" -Force | Out-Null
    New-Item -ItemType Directory -Path "public/data" -Force | Out-Null
    Write-Host "OK Data directories created" -ForegroundColor Green
    Write-Host ""

    Write-Host "[4/6] Parsing XBRL data..." -ForegroundColor Yellow
    if (Test-Path "XBRL") {
        py -3.10 scripts/parse_edinet_xbrl.py
        if ($LASTEXITCODE -ne 0) { throw "XBRL parsing failed" }
        Write-Host "OK XBRL parsing completed" -ForegroundColor Green
    } else {
        Write-Host "WARNING: XBRL folder not found. Skipping." -ForegroundColor Yellow
    }
    Write-Host ""

    Write-Host "[5/6] Computing valuation and scores..." -ForegroundColor Yellow
    py -3.10 scripts/build_valuation.py
    if ($LASTEXITCODE -ne 0) { throw "Valuation calculation failed" }
    py -3.10 scripts/compute_scores.py
    if ($LASTEXITCODE -ne 0) { throw "Score computation failed" }
    Copy-Item data/*.json public/data/ -Force
    Write-Host "OK Data processing completed" -ForegroundColor Green
    Write-Host ""

    Write-Host "[6/6] Starting development server..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "   Server running at:" -ForegroundColor Cyan
    Write-Host "   http://localhost:5173/ValueScope/" -ForegroundColor Green
    Write-Host "   Opening browser..." -ForegroundColor Yellow
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host ""
    
    # バックグラウンドで開発サーバーを起動
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
    
    # サーバーの起動を待機（5秒）
    Start-Sleep -Seconds 5
    
    # ブラウザを開く
    Start-Process "http://localhost:5173/ValueScope/"
    
    Write-Host ""
    Write-Host "OK Browser opened. Development server is running in a separate window." -ForegroundColor Green
    Write-Host "This window will close in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
}
catch {
    Write-Host ""
    Write-Host "ERROR: $_" -ForegroundColor Red
    Write-Host ""
    exit 1
}

