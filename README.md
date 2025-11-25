# Generador de Horarios Universitarios

Sistema de generación automática de horarios universitarios usando **C++ (Cython)** para el backend y **React** para el frontend.

## 🚀 Características

- ✅ Backend en **FastAPI** con motor de scheduling en **Cython** (C/C++)
- ✅ Carga de maestros mediante archivos **CSV**
- ✅ Generación automática de horarios con restricciones:
  - Sin empalmes de horario para maestros
  - Máximo 3 horas consecutivas
  - Máximo 2 horas libres consecutivas
  - Sin empalmes para grupos
- ✅ Interfaz web moderna con **React**
- ✅ Base de datos **MySQL**

## 📋 Requisitos Previos

- Python 3.8+
- Node.js 16+
- MySQL (XAMPP)
- Compilador C (MSVC en Windows, GCC en Linux)

## 🛠️ Instalación

### 1. Configurar Base de Datos

1. Inicia XAMPP y activa MySQL
2. Importa el schema:
```bash
mysql -u root < database/schema.sql
```

### 2. Configurar Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv
venv\Scripts\activate  # En Windows
# source venv/bin/activate  # En Linux/Mac

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
copy .env.example .env
# Edita .env con tus credenciales de MySQL

# Compilar módulo Cython
cd scheduler
python setup.py build_ext --inplace
cd ..
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

## ▶️ Ejecución

### Backend (Terminal 1)
```bash
cd backend
venv\Scripts\activate
python api/main.py
```
El servidor estará en: http://localhost:8000

### Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
La aplicación estará en: http://localhost:5173

## 📝 Uso

1. **Cargar Maestros**: Usa el archivo `database/maestros_ejemplo.csv` como referencia
2. **Agregar Materias y Grupos**: (Por ahora manual en la BD)
3. **Generar Horario**: Click en "Generar Horario con Cython"
4. **Ver Resultado**: El horario se mostrará organizado por días

## 📁 Estructura del Proyecto

```
proyecto-horarios/
├── backend/
│   ├── api/
│   │   └── main.py          # FastAPI app
│   ├── database/
│   │   ├── connection.py    # Conexión MySQL
│   │   └── models.py        # Modelos SQLAlchemy
│   ├── scheduler/
│   │   ├── scheduler.pyx    # Motor Cython (C++)
│   │   └── setup.py         # Compilación
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── App.jsx
│   │   └── App.css
│   └── package.json
└── database/
    ├── schema.sql           # Schema MySQL
    └── maestros_ejemplo.csv # Ejemplo de CSV
```

## 🔧 Tecnologías

- **Backend**: FastAPI, Cython, SQLAlchemy, PyMySQL
- **Frontend**: React, Vite
- **Base de Datos**: MySQL
- **Algoritmo**: Backtracking con restricciones (implementado en C via Cython)

## 📄 Formato CSV de Maestros

```csv
nombre,email,horas_max_dia
Dr. Juan Pérez,juan.perez@universidad.edu,8
Dra. María García,maria.garcia@universidad.edu,6
```

## 🎯 Próximas Mejoras

- [ ] Interfaz para agregar materias y grupos
- [ ] Exportar horarios a PDF
- [ ] Edición manual de horarios
- [ ] Múltiples horarios guardados
- [ ] Validación de disponibilidad de maestros por día/hora
