@echo off
echo ========================================
echo   Iniciando Backend - API FastAPI
echo ========================================
echo.

cd backend
call venv\Scripts\activate.bat

echo Iniciando servidor en http://localhost:8000
echo Presiona Ctrl+C para detener el servidor
echo.

python api/main.py
