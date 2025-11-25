from sqlalchemy import Column, Integer, String, ForeignKey, Enum, TIMESTAMP
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .connection import Base

class Maestro(Base):
    __tablename__ = "maestros"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    horas_max_dia = Column(Integer, default=8)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    
    disponibilidades = relationship("DisponibilidadMaestro", back_populates="maestro", cascade="all, delete-orphan")
    asignaciones = relationship("Asignacion", back_populates="maestro")

class Materia(Base):
    __tablename__ = "materias"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    horas_semanales = Column(Integer, nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    
    asignaciones = relationship("Asignacion", back_populates="materia")

class Grupo(Base):
    __tablename__ = "grupos"
    
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    semestre = Column(Integer, nullable=False)
    creado_en = Column(TIMESTAMP, server_default=func.now())
    
    asignaciones = relationship("Asignacion", back_populates="grupo")

class DisponibilidadMaestro(Base):
    __tablename__ = "disponibilidad_maestros"
    
    id = Column(Integer, primary_key=True, index=True)
    maestro_id = Column(Integer, ForeignKey("maestros.id", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(Integer, nullable=False)  # 0=Lunes, 4=Viernes
    hora_inicio = Column(Integer, nullable=False)  # 7-19
    hora_fin = Column(Integer, nullable=False)
    
    maestro = relationship("Maestro", back_populates="disponibilidades")

class HorarioGenerado(Base):
    __tablename__ = "horarios_generados"
    
    id = Column(Integer, primary_key=True, index=True)
    fecha_generacion = Column(TIMESTAMP, server_default=func.now())
    estado = Column(Enum('generado', 'activo', 'archivado'), default='generado')
    
    asignaciones = relationship("Asignacion", back_populates="horario", cascade="all, delete-orphan")

class Asignacion(Base):
    __tablename__ = "asignaciones"
    
    id = Column(Integer, primary_key=True, index=True)
    horario_id = Column(Integer, ForeignKey("horarios_generados.id", ondelete="CASCADE"), nullable=False)
    maestro_id = Column(Integer, ForeignKey("maestros.id", ondelete="CASCADE"), nullable=False)
    materia_id = Column(Integer, ForeignKey("materias.id", ondelete="CASCADE"), nullable=False)
    grupo_id = Column(Integer, ForeignKey("grupos.id", ondelete="CASCADE"), nullable=False)
    dia_semana = Column(Integer, nullable=False)
    hora_inicio = Column(Integer, nullable=False)
    hora_fin = Column(Integer, nullable=False)
    
    horario = relationship("HorarioGenerado", back_populates="asignaciones")
    maestro = relationship("Maestro", back_populates="asignaciones")
    materia = relationship("Materia", back_populates="asignaciones")
    grupo = relationship("Grupo", back_populates="asignaciones")
