# Avvia Ellis MCP Server + Tunnel pubblico
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "=== ELLIS - Intesa Sanpaolo ===" -ForegroundColor Cyan
Write-Host ""

# Avvia il server Python in background
Write-Host "Avvio server MCP..." -ForegroundColor Yellow
$server = Start-Process -FilePath "$ROOT\venv\Scripts\python.exe" `
    -ArgumentList "$ROOT\server.py", "http" `
    -PassThru -WindowStyle Minimized

Write-Host "Server avviato (PID $($server.Id))" -ForegroundColor Green
Start-Sleep -Seconds 3

# Avvia tunnel localhost.run
Write-Host ""
Write-Host "Apertura tunnel pubblico..." -ForegroundColor Yellow
Write-Host "(Premi CTRL+C per fermare tutto)" -ForegroundColor Gray
Write-Host ""
Write-Host "L'URL MCP apparira' qui sotto in formato:" -ForegroundColor White
Write-Host "https://XXXXXX.lhr.life  ->  usa questo URL + /sse in ChatGPT" -ForegroundColor Cyan
Write-Host ""

try {
    ssh -R 80:localhost:8080 nokey@localhost.run
} finally {
    Write-Host ""
    Write-Host "Fermo il server..." -ForegroundColor Yellow
    Stop-Process -Id $server.Id -ErrorAction SilentlyContinue
    Write-Host "Ellis fermato." -ForegroundColor Red
}
