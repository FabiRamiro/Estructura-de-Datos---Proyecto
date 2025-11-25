# Guia Para Iniciar el Proyecto 

## Paso 1: Configurar Base de Datos MySQL

1. Abre XAMPP y inicia **MySQL**
2. Abre phpMyAdmin (http://localhost/phpmyadmin)
3. Ve a la pestaña "SQL" y ejecuta el contenido de: `database/schema.sql`
4. Luego ejecuta: `database/seed_data.sql` (para datos de prueba, si quieres)

## Paso 2: Configurar Backend

### Ejecutar Script
```bash
# Ejecuta el script de configuracion
setup_backend.bat
```

## Paso 3: Iniciar Backend

```bash
# Ejecuta el comando en la carpeta backend
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```

Corriendo en: **http://localhost:8000**
```

## Paso 4: Configurar Frontend

```bash
cd frontend
npm install
```

## Paso 5: Iniciar Frontend

```bash
# Ejecuta el script
start_frontend.bat
```

Corriendo en: **http://localhost:5173**

## Paso 6: Probar el Sistema

1. **Cargar Maestros**:
   - Usa el archivo `database/maestros_ejemplo.csv`
   - Click en "Cargar CSV"
   - Verifica que aparezcan en la lista

2. **Generar Horario**:
   - Click en "Generar Horario con Cython"
   - Espera unos segundos
   - El horario se mostrará organizado por días

## 🔧 Solución de Problemas

### Error al compilar Cython
- **Windows**: Instala "Build Tools for Visual Studio"
  - Descarga: https://visualstudio.microsoft.com/downloads/
  - Selecciona "C++ build tools"

### Error de conexión a MySQL
- Verifica que MySQL esté corriendo en XAMPP
- Revisa las credenciales en `backend/.env`

### Puerto ocupado
- Backend: Cambia el puerto en `backend/api/main.py` (línea final)
- Frontend: Cambia el puerto en `frontend/vite.config.js`

## 📊 Endpoints de la API

- `GET /` - Info de la API
- `POST /api/maestros/upload-csv` - Cargar CSV de maestros
- `GET /api/maestros` - Listar maestros
- `GET /api/materias` - Listar materias
- `GET /api/grupos` - Listar grupos
- `POST /api/generar-horario` - Generar horario
- `GET /api/horarios/{id}` - Ver horario específico