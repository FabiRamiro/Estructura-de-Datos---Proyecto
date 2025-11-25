@echo off
echo ========================================
echo   Configurando Backend - Generador de Horarios
echo ========================================
echo.

cd backend

echo [1/4] Creando entorno virtual...
python -m venv venv
if errorlevel 1 (
    echo ERROR: No se pudo crear el entorno virtual
    pause
    exit /b 1
)

echo [2/4] Activando entorno virtual...
call venv\Scripts\activate.bat

echo [3/4] Instalando dependencias...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: No se pudieron instalar las dependencias
    pause
    exit /b 1
)

echo [4/4] Compilando modulo Cython...
cd scheduler
python setup.py build_ext --inplace
if errorlevel 1 (
    echo ERROR: No se pudo compilar el modulo Cython
    echo Asegurate de tener un compilador C instalado (MSVC)
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Backend configurado exitosamente!
echo ========================================
echo.
echo Siguiente paso: Configura el archivo .env
echo Copia .env.example a .env y edita las credenciales de MySQL
echo.
pause
