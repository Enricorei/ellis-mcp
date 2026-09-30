@echo off
title Ellis - Intesa Sanpaolo MCP Server
color 0B
echo.
echo  ====================================
echo   ELLIS - Intesa Sanpaolo
echo   MCP Server + Tunnel pubblico
echo  ====================================
echo.
echo  Avvio server...
start /min "" "%~dp0venv\Scripts\python.exe" "%~dp0server.py" http
timeout /t 3 /nobreak > nul

echo  Server avviato su porta 8080
echo.
echo  Apertura tunnel pubblico...
echo  (L'URL apparira' tra pochi secondi)
echo.
echo  *** Copia l'URL che appare sotto ***
echo  *** Aggiungi /sse alla fine       ***
echo  *** Es: https://XXXX.lhr.life/sse ***
echo.
ssh -o StrictHostKeyChecking=no -R 80:localhost:8080 nokey@localhost.run
echo.
echo  Tunnel chiuso. Premi un tasto per uscire.
pause > nul
