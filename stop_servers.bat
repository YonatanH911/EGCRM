@echo off
echo ==============================================================================
echo Stopping Local Development Servers...
echo ==============================================================================

echo.
echo Stopping Backend Server (uvicorn)...
taskkill /F /IM uvicorn.exe /T >nul 2>&1

echo.
echo Stopping Frontend Server (node)...
taskkill /F /IM node.exe /T >nul 2>&1

echo.
echo Stopping MySQL Server...
taskkill /F /IM mysqld.exe /T >nul 2>&1

echo.
echo All development servers have been officially STOPPED!
pause
