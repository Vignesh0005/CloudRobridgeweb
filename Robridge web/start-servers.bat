@echo off
echo Starting RobBridge Servers...
echo.

echo Starting Python Backend...
start "Python Backend" cmd /k "cd /d "..\Barcode generator&Scanner" && python start_server.py"

echo Waiting for Python backend to start...
timeout /t 5 /nobreak > nul

echo Starting Node.js Server...
start "Node.js Server" cmd /k "node server.js"

echo.
echo Both servers are starting...
echo Python Backend: http://localhost:5000
echo Node.js Server: http://localhost:3001
echo.
echo Press any key to test backend connection...
pause > nul

echo Testing backend connection...
node test-backend.js

echo.
echo Press any key to exit...
pause > nul
