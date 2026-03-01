@echo off
echo Starting MySQL Database Server...
start "" /B "C:\Program Files\MySQL\MySQL Server 8.4\bin\mysqld.exe" --datadir="C:\projects\CRM_Dynamics\backend\mysql_data"

echo Waiting for MySQL to initialize...
timeout /t 5 /nobreak >nul

echo Starting Backend Server...
start cmd /k "cd backend && venv\Scripts\activate.bat && uvicorn main:app --reload"

echo Starting Frontend Server...
start cmd /k "cd frontend && npm run dev"

echo All servers are starting up in separate windows!
echo - Backend will be available at http://localhost:8000
echo - Frontend will be available at http://localhost:3000
echo - MySQL Database is running quietly in the background.
pause
