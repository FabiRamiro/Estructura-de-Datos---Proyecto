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
from database.models import (
    Maestro,
    Materia,
    Grupo,
    HorarioGenerado,
    Asignacion,
    MaestroMateria,
    DisponibilidadMaestro,
)

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
                "numero": m.numero if hasattr(m, "numero") else "",
                "horas_max_dia": m.horas_max_dia,
                "materias": (
                    [
                        {"id": mm.materia_id, "nombre": mm.materia.nombre}
                        for mm in m.materias
                    ]
                    if hasattr(m, "materias")
                    else []
                ),
                "dias_disponibles": (
                    [d.dia_semana for d in m.disponibilidades]
                    if hasattr(m, "disponibilidades")
                    else []
                ),
            }
            for m in maestros
        ],
    }


from pydantic import BaseModel


# Modelo para crear maestro
class MaestroCreate(BaseModel):
    nombre: str
    email: str
    numero: str = ""
    horas_max_dia: int = 8
    materia_ids: list[int] = []
    dias_disponibles: list[int] = []  # Lista de días: 0=Lunes, 1=Martes, ..., 4=Viernes


# Modelo para crear materia
class MateriaCreate(BaseModel):
    nombre: str
    horas_semanales: int


@app.post("/api/maestros")
def crear_maestro(maestro_data: MaestroCreate, db: Session = Depends(get_db)):
    """Crea un nuevo maestro individualmente"""
    try:
        # Crear maestro
        maestro = Maestro(
            nombre=maestro_data.nombre.strip(),
            email=maestro_data.email.strip(),
            numero=maestro_data.numero.strip() if maestro_data.numero else "",
            horas_max_dia=maestro_data.horas_max_dia,
        )
        db.add(maestro)
        db.commit()
        db.refresh(maestro)

        # Agregar materias que puede impartir
        for materia_id in maestro_data.materia_ids:
            maestro_materia = MaestroMateria(
                maestro_id=maestro.id, materia_id=materia_id
            )
            db.add(maestro_materia)

        # Agregar días disponibles (disponibilidad de 7am a 7pm por defecto)
        for dia in maestro_data.dias_disponibles:
            disponibilidad = DisponibilidadMaestro(
                maestro_id=maestro.id, dia_semana=dia, hora_inicio=7, hora_fin=19
            )
            db.add(disponibilidad)

        db.commit()

        return {
            "message": "Maestro creado exitosamente",
            "maestro": {
                "id": maestro.id,
                "nombre": maestro.nombre,
                "email": maestro.email,
                "numero": maestro.numero,
                "horas_max_dia": maestro.horas_max_dia,
                "materias": maestro_data.materia_ids,
                "dias_disponibles": maestro_data.dias_disponibles,
            },
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear maestro: {str(e)}")


@app.put("/api/maestros/{maestro_id}")
def actualizar_maestro(
    maestro_id: int, maestro_data: MaestroCreate, db: Session = Depends(get_db)
):
    """Actualiza un maestro existente"""
    try:
        maestro = db.query(Maestro).filter(Maestro.id == maestro_id).first()
        if not maestro:
            raise HTTPException(status_code=404, detail="Maestro no encontrado")

        # Actualizar datos básicos
        maestro.nombre = maestro_data.nombre.strip()
        maestro.email = maestro_data.email.strip()
        maestro.numero = maestro_data.numero.strip() if maestro_data.numero else ""
        maestro.horas_max_dia = maestro_data.horas_max_dia

        # Eliminar materias anteriores
        db.query(MaestroMateria).filter(
            MaestroMateria.maestro_id == maestro_id
        ).delete()

        # Agregar nuevas materias
        for materia_id in maestro_data.materia_ids:
            maestro_materia = MaestroMateria(
                maestro_id=maestro_id, materia_id=materia_id
            )
            db.add(maestro_materia)

        # Eliminar disponibilidades anteriores
        db.query(DisponibilidadMaestro).filter(
            DisponibilidadMaestro.maestro_id == maestro_id
        ).delete()

        # Agregar nuevas disponibilidades
        for dia in maestro_data.dias_disponibles:
            disponibilidad = DisponibilidadMaestro(
                maestro_id=maestro_id, dia_semana=dia, hora_inicio=7, hora_fin=19
            )
            db.add(disponibilidad)

        db.commit()
        db.refresh(maestro)

        return {
            "message": "Maestro actualizado exitosamente",
            "maestro": {
                "id": maestro.id,
                "nombre": maestro.nombre,
                "email": maestro.email,
                "numero": maestro.numero,
                "horas_max_dia": maestro.horas_max_dia,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al actualizar maestro: {str(e)}"
        )


@app.delete("/api/maestros/{maestro_id}")
def eliminar_maestro(maestro_id: int, db: Session = Depends(get_db)):
    """Elimina un maestro"""
    try:
        maestro = db.query(Maestro).filter(Maestro.id == maestro_id).first()
        if not maestro:
            raise HTTPException(status_code=404, detail="Maestro no encontrado")

        db.delete(maestro)
        db.commit()

        return {"message": f"Maestro {maestro.nombre} eliminado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al eliminar maestro: {str(e)}"
        )


@app.post("/api/materias")
def crear_materia(materia_data: MateriaCreate, db: Session = Depends(get_db)):
    """Crea una nueva materia"""
    try:
        materia = Materia(
            nombre=materia_data.nombre.strip(),
            horas_semanales=materia_data.horas_semanales,
        )
        db.add(materia)
        db.commit()
        db.refresh(materia)
        return {
            "message": "Materia creada exitosamente",
            "materia": {
                "id": materia.id,
                "nombre": materia.nombre,
                "horas_semanales": materia.horas_semanales,
            },
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al crear materia: {str(e)}")


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


@app.put("/api/materias/{materia_id}")
def actualizar_materia(
    materia_id: int, materia_data: MateriaCreate, db: Session = Depends(get_db)
):
    """Actualiza una materia existente"""
    try:
        materia = db.query(Materia).filter(Materia.id == materia_id).first()
        if not materia:
            raise HTTPException(status_code=404, detail="Materia no encontrada")

        materia.nombre = materia_data.nombre.strip()
        materia.horas_semanales = materia_data.horas_semanales

        db.commit()
        db.refresh(materia)

        return {
            "message": "Materia actualizada exitosamente",
            "materia": {
                "id": materia.id,
                "nombre": materia.nombre,
                "horas_semanales": materia.horas_semanales,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al actualizar materia: {str(e)}"
        )


@app.delete("/api/materias/{materia_id}")
def eliminar_materia(materia_id: int, db: Session = Depends(get_db)):
    """Elimina una materia"""
    try:
        materia = db.query(Materia).filter(Materia.id == materia_id).first()
        if not materia:
            raise HTTPException(status_code=404, detail="Materia no encontrada")

        db.delete(materia)
        db.commit()

        return {"message": f"Materia {materia.nombre} eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al eliminar materia: {str(e)}"
        )


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


# Modelo para generar horario
class GenerarHorarioRequest(BaseModel):
    maestro_ids: list[int]
    grupos_generar: int = 1
    turno: str = "matutino"
    nombre_carrera: str
    cuatrimestre: str


@app.post("/api/generar-horario")
def generar_horario(
    request: GenerarHorarioRequest,
    db: Session = Depends(get_db),
):
    """
    Genera horarios para múltiples grupos con nombres dinámicos
    Formato: NOMBRE_CARRERA CUATRIMESTRE-N (ej: ITIID 5-1, ITIID 5-2)

    Considera:
    - Solo los docentes seleccionados
    - Las materias que cada docente puede impartir
    - Las horas máximas por día de cada docente
    - Los días disponibles de cada docente
    """
    try:
        # Importar el módulo Cython compilado
        import scheduler

        # Extraer datos del request
        maestro_ids = request.maestro_ids
        grupos_generar = request.grupos_generar
        turno = request.turno
        nombre_carrera = request.nombre_carrera
        cuatrimestre = request.cuatrimestre

        # Validaciones
        if not maestro_ids:
            raise HTTPException(
                status_code=400, detail="Debe seleccionar al menos un docente"
            )
        if not nombre_carrera or not cuatrimestre:
            raise HTTPException(
                status_code=400,
                detail="Debe proporcionar nombre de carrera y cuatrimestre",
            )

        # Obtener solo los maestros seleccionados con sus datos completos
        maestros = db.query(Maestro).filter(Maestro.id.in_(maestro_ids)).all()

        if not maestros:
            raise HTTPException(
                status_code=400, detail="No se encontraron los docentes seleccionados"
            )

        # Obtener las materias que pueden impartir los maestros seleccionados
        # Solo materias que al menos un maestro puede dar
        materias_ids = set()
        for maestro in maestros:
            for mm in maestro.materias:
                materias_ids.add(mm.materia_id)

        if not materias_ids:
            raise HTTPException(
                status_code=400,
                detail="Los docentes seleccionados no tienen materias asignadas. Asigne materias a los docentes primero.",
            )

        materias = db.query(Materia).filter(Materia.id.in_(materias_ids)).all()

        # ELIMINAR TODOS LOS HORARIOS Y GRUPOS ANTERIORES
        db.query(Asignacion).delete()
        db.query(HorarioGenerado).delete()
        db.query(Grupo).delete()
        db.commit()

        # Preparar datos de maestros con toda su información
        maestros_data = []
        for m in maestros:
            # Obtener IDs de materias que puede impartir
            materias_puede_impartir = [mm.materia_id for mm in m.materias]

            # Obtener días disponibles
            dias_disponibles = [d.dia_semana for d in m.disponibilidades]

            # Si no tiene días configurados, usar todos los días
            if not dias_disponibles:
                dias_disponibles = [0, 1, 2, 3, 4]  # Lunes a Viernes

            maestros_data.append(
                {
                    "id": m.id,
                    "nombre": m.nombre,
                    "horas_max_dia": m.horas_max_dia,
                    "materias_ids": materias_puede_impartir,
                    "dias_disponibles": dias_disponibles,
                }
            )

        # Preparar datos de materias
        materias_data = [
            {"id": m.id, "nombre": m.nombre, "horas_semanales": m.horas_semanales}
            for m in materias
        ]

        total_asignaciones = 0
        horarios_creados = []

        # Determinar horas según el turno
        if turno.lower() == "matutino":
            hora_min, hora_max = 7, 14  # 7:00 AM a 2:00 PM (7 horas)
        else:  # vespertino
            hora_min, hora_max = 14, 22  # 2:00 PM a 10:00 PM (8 horas)

        # GENERAR UN HORARIO POR CADA GRUPO CON NOMBRE DINÁMICO
        for grupo_num in range(1, grupos_generar + 1):
            # Crear nombre dinámico: "ITIID 5-1", "ITIID 5-2", etc.
            nombre_grupo = f"{nombre_carrera} {cuatrimestre}-{grupo_num}"

            # Crear el grupo
            grupo = Grupo(
                nombre=nombre_grupo,
                semestre=int(cuatrimestre) if cuatrimestre.isdigit() else 1,
            )
            db.add(grupo)
            db.commit()
            db.refresh(grupo)

            grupos_data = [{"id": grupo.id, "nombre": grupo.nombre}]

            # Crear instancia NUEVA del motor para cada grupo (resetea el estado)
            engine = scheduler.SchedulerEngine(
                len(maestros), len(materias), 1, hora_min, hora_max
            )

            # Generar horario para este grupo
            asignaciones = engine.generar_horario(
                maestros_data, materias_data, grupos_data
            )

            # Guardar en base de datos solo si se generaron asignaciones
            if len(asignaciones) > 0:
                horario = HorarioGenerado(estado="generado", turno=turno.lower())
                db.add(horario)
                db.commit()
                db.refresh(horario)

                for asig in asignaciones:
                    asignacion_db = Asignacion(
                        horario_id=horario.id,
                        maestro_id=asig["maestro_id"],
                        materia_id=asig["materia_id"],
                        grupo_id=grupo.id,
                        dia_semana=asig["dia_semana"],
                        hora_inicio=asig["hora_inicio"],
                        hora_fin=asig["hora_fin"],
                    )
                    db.add(asignacion_db)

                db.commit()
                total_asignaciones += len(asignaciones)
                horarios_creados.append(
                    {
                        "horario_id": horario.id,
                        "grupo": grupo.nombre,
                        "asignaciones": len(asignaciones),
                    }
                )
            else:
                # Si no se generaron asignaciones, aún reportar el grupo
                horarios_creados.append(
                    {
                        "horario_id": None,
                        "grupo": grupo.nombre,
                        "asignaciones": 0,
                    }
                )

        return {
            "message": f"Se generaron {grupos_generar} horarios exitosamente para {nombre_carrera} {cuatrimestre}",
            "grupos_generados": grupos_generar,
            "turno": turno,
            "nombre_carrera": nombre_carrera,
            "cuatrimestre": cuatrimestre,
            "total_asignaciones": total_asignaciones,
            "horarios": horarios_creados,
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


@app.get("/api/horarios")
def get_horarios(db: Session = Depends(get_db)):
    """Obtiene todos los horarios generados"""
    horarios = (
        db.query(HorarioGenerado)
        .order_by(HorarioGenerado.fecha_generacion.desc())
        .all()
    )

    return {
        "total": len(horarios),
        "horarios": [
            {
                "id": h.id,
                "fecha_generacion": h.fecha_generacion,
                "estado": h.estado,
                "turno": h.turno if hasattr(h, "turno") else "matutino",
                "total_asignaciones": len(h.asignaciones),
            }
            for h in horarios
        ],
    }


@app.delete("/api/horarios")
def eliminar_todos_horarios(db: Session = Depends(get_db)):
    """Elimina todos los horarios generados"""
    try:
        # Eliminar todas las asignaciones primero
        db.query(Asignacion).delete()
        # Eliminar todos los horarios
        db.query(HorarioGenerado).delete()
        db.commit()

        return {"message": "Todos los horarios han sido eliminados exitosamente"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500, detail=f"Error al eliminar horarios: {str(e)}"
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
        "turno": horario.turno if hasattr(horario, "turno") else "matutino",
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
