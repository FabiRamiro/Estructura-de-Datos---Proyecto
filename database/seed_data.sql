-- Datos de ejemplo para testing
USE horarios_universidad;

-- Insertar materias de ejemplo
INSERT INTO materias (nombre, horas_semanales) VALUES
('Programación I', 4),
('Matemáticas', 4),
('Estructura de Datos', 4),
('Base de Datos', 3),
('Redes', 3);

-- Insertar grupos de ejemplo
INSERT INTO grupos (nombre, semestre) VALUES
('A1', 1),
('A2', 1),
('B1', 2),
('B2', 2);
