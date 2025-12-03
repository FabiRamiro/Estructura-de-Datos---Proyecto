-- Migración: Agregar columna turno a horarios_generados
USE horarios_universidad;

-- Agregar columna turno si no existe
ALTER TABLE horarios_generados
ADD COLUMN IF NOT EXISTS turno VARCHAR(20) DEFAULT 'matutino' AFTER estado;

-- Actualizar registros existentes para que tengan turno 'matutino'
UPDATE horarios_generados SET turno = 'matutino' WHERE turno IS NULL;
