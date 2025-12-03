# 🚀 Cómo Ejecutar el Proyecto

## Requisitos Previos

- Python 3.10+ instalado
- Node.js 18+ instalado
- MySQL Server corriendo con la base de datos `horarios_universidad`

---

## 📦 Backend (FastAPI)

### 1. Instalar dependencias (solo la primera vez)

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configurar Base de Datos

Asegúrate de tener MySQL corriendo y crea un archivo `.env` en la carpeta `backend/` con:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_contraseña
DB_NAME=horarios_universidad
```

### 3. Iniciar el servidor backend

```bash
cd backend
python -m uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

✅ El backend estará disponible en: **http://localhost:8000**

📚 Documentación API: **http://localhost:8000/docs**

---

## 🎨 Frontend (React + Vite)

### 1. Instalar dependencias (solo la primera vez)

```bash
cd frontend
npm install
```

### 2. Iniciar el servidor frontend

```bash
cd frontend
npm run dev
```

✅ El frontend estará disponible en: **http://localhost:5173**

---

## 🏃 Ejecución Rápida (después de instalar dependencias)

### Terminal 1 - Backend:

```bash
cd "c:/Users/fabi7/OneDrive/Documentos/UPV/CUATRIMESTRE4/Estructura de Datos - Proyecto/backend"
python -m uvicorn api.main:app --reload --port 8000
```

### Terminal 2 - Frontend:

```bash
cd "c:/Users/fabi7/OneDrive/Documentos/UPV/CUATRIMESTRE4/Estructura de Datos - Proyecto/frontend"
npm run dev
```

---

## 🛑 Detener los Servidores

Presiona `Ctrl + C` en cada terminal para detener los servidores.

---

## 🔧 Solución de Problemas

### Error de conexión a MySQL

- Verifica que MySQL esté corriendo
- Revisa las credenciales en el archivo `.env`
- Asegúrate de que la base de datos `horarios_universidad` exista

### Error del módulo Cython (scheduler)

Si ves un error sobre el módulo Cython, ejecuta:

```bash
cd backend/scheduler
python setup.py build_ext --inplace
```

### El frontend no conecta con el backend

- Verifica que el backend esté corriendo en el puerto 8000
- Revisa que no haya errores de CORS
