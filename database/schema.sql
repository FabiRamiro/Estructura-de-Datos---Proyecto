-- Schema para Generador de Horarios Universitarios
-- MySQL Database

CREATE DATABASE IF NOT EXISTS horarios_universidad;
USE horarios_universidad;

-- Tabla de Maestros
CREATE TABLE IF NOT EXISTS maestros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    horas_max_dia INT DEFAULT 8,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Materias
CREATE TABLE IF NOT EXISTS materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    horas_semanales INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Grupos
CREATE TABLE IF NOT EXISTS grupos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    semestre INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Disponibilidad de Maestros
CREATE TABLE IF NOT EXISTS disponibilidad_maestros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maestro_id INT NOT NULL,
    dia_semana INT NOT NULL, -- 0=Lunes, 1=Martes, ..., 4=Viernes
    hora_inicio INT NOT NULL, -- 7-19 (7am-7pm)
    hora_fin INT NOT NULL,
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE
);

-- Tabla de Horarios Generados
CREATE TABLE IF NOT EXISTS horarios_generados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_generacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('generado', 'activo', 'archivado') DEFAULT 'generado'
);

-- Tabla de Asignaciones (el horario en sí)
CREATE TABLE IF NOT EXISTS asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    horario_id INT NOT NULL,
    maestro_id INT NOT NULL,
    materia_id INT NOT NULL,
    grupo_id INT NOT NULL,
    dia_semana INT NOT NULL, -- 0=Lunes, 1=Martes, ..., 4=Viernes
    hora_inicio INT NOT NULL,
    hora_fin INT NOT NULL,
    FOREIGN KEY (horario_id) REFERENCES horarios_generados(id) ON DELETE CASCADE,
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos(id) ON DELETE CASCADE
);

-- Índices para mejorar rendimiento
CREATE INDEX idx_maestro_disponibilidad ON disponibilidad_maestros(maestro_id);
CREATE INDEX idx_asignacion_horario ON asignaciones(horario_id);
CREATE INDEX idx_asignacion_maestro ON asignaciones(maestro_id);
