@echo off
echo ========================================
echo    RobBridge Rack Management Startup
echo ========================================
echo.

echo Starting Python Backend...
start "Python Backend" cmd /k "cd /d "..\Barcode generator&Scanner" && python start_server.py"

echo Waiting for Python backend to start...
timeout /t 3 /nobreak > nul

echo Starting Node.js Server (with port redirect)...
start "Node.js Server" cmd /k "node server.js"

echo.
echo ========================================
echo    Servers Starting...
echo ========================================
echo.
echo Python Backend: http://localhost:5000
echo Node.js Server: http://localhost:3001
echo Redirect Server: http://localhost:3000 (redirects to 3001)
echo.
echo You can access the app at:
echo   - http://localhost:3001 (recommended)
echo   - http://localhost:3000 (redirects to 3001)
echo.
echo ========================================
echo    Next Steps:
echo ========================================
echo 1. Wait for both servers to start
echo 2. Open http://localhost:3001 in your browser
echo 3. Click "Initialize Database" button if needed
echo 4. Start using the Rack Management system!
echo.
echo Press any key to test the connection...
pause > nul

echo Testing connection...
node test-backend.js

echo.
echo Press any key to exit...
pause > nul
