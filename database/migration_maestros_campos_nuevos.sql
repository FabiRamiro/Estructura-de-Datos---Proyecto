-- Migración: Agregar nuevos campos y tablas para maestros
USE horarios_universidad;

-- 1. Agregar columna 'numero' a la tabla maestros
ALTER TABLE maestros
ADD COLUMN numero VARCHAR(50) NULL AFTER email;

-- 2. Crear tabla de relación maestro-materias
CREATE TABLE IF NOT EXISTS maestro_materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    maestro_id INT NOT NULL,
    materia_id INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maestro_id) REFERENCES maestros(id) ON DELETE CASCADE,
    FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    UNIQUE KEY unique_maestro_materia (maestro_id, materia_id)
);

-- 3. Crear índices para mejorar rendimiento
CREATE INDEX idx_maestro_materia ON maestro_materias(maestro_id);
CREATE INDEX idx_materia_maestro ON maestro_materias(materia_id);

-- 4. Verificar que la tabla de disponibilidad ya existe
-- (Ya existe en el schema original, solo verificamos)
SELECT COUNT(*) as tabla_existe
FROM information_schema.tables
WHERE table_schema = 'horarios_universidad'
AND table_name = 'disponibilidad_maestros';

-- Nota: Los datos existentes de maestros mantendrán numero como NULL
-- Los días disponibles se agregarán cuando se cree/edite un maestro desde el nuevo formulario
