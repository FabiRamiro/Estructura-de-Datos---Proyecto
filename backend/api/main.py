from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import csv
import io
import sys
import os

# Agregar el directorio scheduler al path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scheduler"))

from database.connection import get_db, engine, Base
from database.models import Maestro, Materia, Grupo, HorarioGenerado, Asignacion

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# Inicializar FastAPI
app = FastAPI(title="Generador de Horarios Universitarios")

# Configurar CORS para permitir peticiones desde React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "API de Generador de Horarios Universitarios"}


@app.post("/api/maestros/upload-csv")
async def upload_maestros_csv(
    file: UploadFile = File(...), db: Session = Depends(get_db)
):
    """
    Carga maestros desde un archivo CSV
    Formato esperado: nombre,email,horas_max_dia
    """
    try:
        # Leer archivo CSV
        contents = await file.read()
        decoded_content = contents.decode("utf-8")
        csv_reader = csv.DictReader(io.StringIO(decoded_content))

        # Validar columnas requeridas
        required_columns = ["nombre", "email"]
        fieldnames = csv_reader.fieldnames

        if not fieldnames or not all(col in fieldnames for col in required_columns):
            raise HTTPException(
                status_code=400,
                detail=f"El CSV debe contener las columnas: {', '.join(required_columns)}",
            )

        maestros_creados = []

        # Insertar maestros en la base de datos
        for row in csv_reader:
            # Obtener horas_max_dia, usar 8 por defecto si no existe
            horas_max_dia = row.get("horas_max_dia", "8")
            try:
                horas_max_dia = int(horas_max_dia)
            except ValueError:
                horas_max_dia = 8

            maestro = Maestro(
                nombre=row["nombre"].strip(),
                email=row["email"].strip(),
                horas_max_dia=horas_max_dia,
            )
            db.add(maestro)
            maestros_creados.append(maestro.nombre)

        db.commit()

        return {
            "message": f"Se cargaron {len(maestros_creados)} maestros exitosamente",
            "maestros": maestros_creados,
        }

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al procesar CSV: {str(e)}")


@app.get("/api/maestros")
def get_maestros(db: Session = Depends(get_db)):
    """Obtiene todos los maestros registrados"""
    maestros = db.query(Maestro).all()
    return {
        "total": len(maestros),
        "maestros": [
            {
                "id": m.id,
                "nombre": m.nombre,
                "email": m.email,
                "horas_max_dia": m.horas_max_dia,
            }
            for m in maestros
        ],
    }


@app.post("/api/materias")
def crear_materia(nombre: str, horas_semanales: int, db: Session = Depends(get_db)):
    """Crea una nueva materia"""
    materia = Materia(nombre=nombre, horas_semanales=horas_semanales)
    db.add(materia)
    db.commit()
    db.refresh(materia)
    return {
        "id": materia.id,
        "nombre": materia.nombre,
        "horas_semanales": materia.horas_semanales,
    }


@app.get("/api/materias")
def get_materias(db: Session = Depends(get_db)):
    """Obtiene todas las materias"""
    materias = db.query(Materia).all()
    return {
        "total": len(materias),
        "materias": [
            {"id": m.id, "nombre": m.nombre, "horas_semanales": m.horas_semanales}
            for m in materias
        ],
    }


@app.post("/api/grupos")
def crear_grupo(nombre: str, semestre: int, db: Session = Depends(get_db)):
    """Crea un nuevo grupo"""
    grupo = Grupo(nombre=nombre, semestre=semestre)
    db.add(grupo)
    db.commit()
    db.refresh(grupo)
    return {"id": grupo.id, "nombre": grupo.nombre, "semestre": grupo.semestre}


@app.get("/api/grupos")
def get_grupos(db: Session = Depends(get_db)):
    """Obtiene todos los grupos"""
    grupos = db.query(Grupo).all()
    return {
        "total": len(grupos),
        "grupos": [
            {"id": g.id, "nombre": g.nombre, "semestre": g.semestre} for g in grupos
        ],
    }


@app.post("/api/generar-horario")
def generar_horario(db: Session = Depends(get_db)):
    """
    Genera un horario completo usando el motor Cython
    """
    try:
        # Importar el módulo Cython compilado
        import scheduler

        # Obtener datos de la base de datos
        maestros = db.query(Maestro).all()
        materias = db.query(Materia).all()
        grupos = db.query(Grupo).all()

        if not maestros:
            raise HTTPException(status_code=400, detail="No hay maestros registrados")
        if not materias:
            raise HTTPException(status_code=400, detail="No hay materias registradas")
        if not grupos:
            raise HTTPException(status_code=400, detail="No hay grupos registrados")

        # Preparar datos para el motor
        maestros_data = [{"id": m.id, "nombre": m.nombre} for m in maestros]
        materias_data = [
            {"id": m.id, "nombre": m.nombre, "horas_semanales": m.horas_semanales}
            for m in materias
        ]
        grupos_data = [{"id": g.id, "nombre": g.nombre} for g in grupos]

        # Crear instancia del motor
        engine = scheduler.SchedulerEngine(len(maestros), len(materias), len(grupos))

        # Generar horario
        asignaciones = engine.generar_horario(maestros_data, materias_data, grupos_data)

        # Guardar en base de datos
        horario = HorarioGenerado(estado="generado")
        db.add(horario)
        db.commit()
        db.refresh(horario)

        for asig in asignaciones:
            asignacion_db = Asignacion(
                horario_id=horario.id,
                maestro_id=asig["maestro_id"],
                materia_id=asig["materia_id"],
                grupo_id=asig["grupo_id"],
                dia_semana=asig["dia_semana"],
                hora_inicio=asig["hora_inicio"],
                hora_fin=asig["hora_fin"],
            )
            db.add(asignacion_db)

        db.commit()

        return {
            "message": "Horario generado exitosamente",
            "horario_id": horario.id,
            "total_asignaciones": len(asignaciones),
            "asignaciones": asignaciones,
        }

    except ImportError:
        raise HTTPException(
            status_code=500,
            detail="El módulo Cython no está compilado. Ejecuta: cd backend/scheduler && python setup.py build_ext --inplace",
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al generar horario: {str(e)}"
        )


@app.get("/api/horarios/{horario_id}")
def get_horario(horario_id: int, db: Session = Depends(get_db)):
    """Obtiene un horario específico con todas sus asignaciones"""
    horario = db.query(HorarioGenerado).filter(HorarioGenerado.id == horario_id).first()

    if not horario:
        raise HTTPException(status_code=404, detail="Horario no encontrado")

    asignaciones = (
        db.query(Asignacion).filter(Asignacion.horario_id == horario_id).all()
    )

    dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

    return {
        "id": horario.id,
        "fecha_generacion": horario.fecha_generacion,
        "estado": horario.estado,
        "asignaciones": [
            {
                "id": a.id,
                "maestro": db.query(Maestro).get(a.maestro_id).nombre,
                "materia": db.query(Materia).get(a.materia_id).nombre,
                "grupo": db.query(Grupo).get(a.grupo_id).nombre,
                "dia": dias[a.dia_semana],
                "hora_inicio": f"{a.hora_inicio}:00",
                "hora_fin": f"{a.hora_fin}:00",
            }
            for a in asignaciones
        ],
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
