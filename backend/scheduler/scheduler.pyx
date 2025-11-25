# scheduler.pyx - Motor de generación de horarios en Cython
# cython: language_level=3

from libc.stdlib cimport malloc, free, rand, srand
from libc.string cimport memset
from libc.time cimport time
import random

# Estructura para representar una asignación
cdef struct Asignacion:
    int maestro_id
    int materia_id
    int grupo_id
    int dia_semana      # 0-4 (Lunes a Viernes)
    int hora_inicio     # 7-19
    int hora_fin

# Clase principal del motor de scheduling
cdef class SchedulerEngine:
    cdef int num_maestros
    cdef int num_materias
    cdef int num_grupos
    cdef int[5][13][100] ocupacion_maestros  # [dia][hora][maestro_id] = 1 si ocupado
    cdef int[5][13][100] ocupacion_grupos     # [dia][hora][grupo_id] = 1 si ocupado
    
    def __init__(self, int maestros, int materias, int grupos):
        """Inicializa el motor de scheduling"""
        self.num_maestros = maestros
        self.num_materias = materias
        self.num_grupos = grupos
        
        # Inicializar matrices en 0
        memset(self.ocupacion_maestros, 0, sizeof(self.ocupacion_maestros))
        memset(self.ocupacion_grupos, 0, sizeof(self.ocupacion_grupos))
        
        # Inicializar semilla random
        srand(time(NULL))
    
    cdef bint validar_disponibilidad_maestro(self, int maestro_id, int dia, int hora_inicio, int hora_fin):
        """Valida que el maestro esté disponible en el horario"""
        cdef int hora
        for hora in range(hora_inicio, hora_fin):
            if self.ocupacion_maestros[dia][hora - 7][maestro_id] == 1:
                return False
        return True
    
    cdef bint validar_disponibilidad_grupo(self, int grupo_id, int dia, int hora_inicio, int hora_fin):
        """Valida que el grupo esté disponible en el horario"""
        cdef int hora
        for hora in range(hora_inicio, hora_fin):
            if self.ocupacion_grupos[dia][hora - 7][grupo_id] == 1:
                return False
        return True
    
    cdef int contar_horas_seguidas(self, int maestro_id, int dia, int hora_inicio):
        """Cuenta cuántas horas seguidas tiene el maestro antes de esta hora"""
        cdef int contador = 0
        cdef int hora = hora_inicio - 1
        
        while hora >= 7 and self.ocupacion_maestros[dia][hora - 7][maestro_id] == 1:
            contador += 1
            hora -= 1
        
        return contador
    
    cdef int contar_horas_libres(self, int maestro_id, int dia, int hora_inicio):
        """Cuenta horas libres consecutivas antes de esta hora"""
        cdef int contador = 0
        cdef int hora = hora_inicio - 1
        cdef bint tiene_clases_antes = False
        
        # Verificar si tiene clases antes en el día
        for hora in range(7, hora_inicio):
            if self.ocupacion_maestros[dia][hora - 7][maestro_id] == 1:
                tiene_clases_antes = True
                break
        
        if not tiene_clases_antes:
            return 0
        
        # Contar horas libres consecutivas
        hora = hora_inicio - 1
        while hora >= 7 and self.ocupacion_maestros[dia][hora - 7][maestro_id] == 0:
            contador += 1
            hora -= 1
        
        return contador
    
    cdef bint validar_restricciones(self, int maestro_id, int grupo_id, int dia, int hora_inicio, int hora_fin):
        """Valida todas las restricciones del problema"""
        
        # 1. Validar disponibilidad de maestro y grupo
        if not self.validar_disponibilidad_maestro(maestro_id, dia, hora_inicio, hora_fin):
            return False
        
        if not self.validar_disponibilidad_grupo(grupo_id, dia, hora_inicio, hora_fin):
            return False
        
        # 2. No más de 3 horas seguidas
        cdef int horas_seguidas = self.contar_horas_seguidas(maestro_id, dia, hora_inicio)
        cdef int duracion = hora_fin - hora_inicio
        
        if horas_seguidas + duracion > 3:
            return False
        
        # 3. No más de 2 horas libres seguidas
        cdef int horas_libres = self.contar_horas_libres(maestro_id, dia, hora_inicio)
        if horas_libres > 2:
            return False
        
        return True
    
    cdef void marcar_ocupado(self, int maestro_id, int grupo_id, int dia, int hora_inicio, int hora_fin):
        """Marca las horas como ocupadas para maestro y grupo"""
        cdef int hora
        for hora in range(hora_inicio, hora_fin):
            self.ocupacion_maestros[dia][hora - 7][maestro_id] = 1
            self.ocupacion_grupos[dia][hora - 7][grupo_id] = 1
    
    cdef void desmarcar_ocupado(self, int maestro_id, int grupo_id, int dia, int hora_inicio, int hora_fin):
        """Desmarca las horas como ocupadas (para backtracking)"""
        cdef int hora
        for hora in range(hora_inicio, hora_fin):
            self.ocupacion_maestros[dia][hora - 7][maestro_id] = 0
            self.ocupacion_grupos[dia][hora - 7][grupo_id] = 0
    
    cpdef list generar_horario(self, list maestros_data, list materias_data, list grupos_data):
        """
        Genera el horario completo usando backtracking
        
        Args:
            maestros_data: Lista de diccionarios con info de maestros
            materias_data: Lista de diccionarios con info de materias
            grupos_data: Lista de diccionarios con info de grupos
        
        Returns:
            Lista de asignaciones generadas
        """
        cdef list asignaciones = []
        
        # Para cada materia y grupo, intentar asignar un maestro
        for materia in materias_data:
            for grupo in grupos_data:
                horas_restantes = materia['horas_semanales']
                
                # Intentar asignar las horas de la materia
                while horas_restantes > 0:
                    asignado = False
                    
                    # Intentar con cada maestro
                    for maestro in maestros_data:
                        if asignado:
                            break
                        
                        # Intentar cada día de la semana
                        for dia in range(5):  # Lunes a Viernes
                            if asignado:
                                break
                            
                            # Intentar diferentes horas del día
                            for hora_inicio in range(7, 19):  # 7am a 7pm
                                # Determinar duración (1 o 2 horas)
                                duracion = min(2, horas_restantes)
                                hora_fin = hora_inicio + duracion
                                
                                if hora_fin > 19:
                                    continue
                                
                                # Validar restricciones
                                if self.validar_restricciones(
                                    maestro['id'], 
                                    grupo['id'], 
                                    dia, 
                                    hora_inicio, 
                                    hora_fin
                                ):
                                    # Asignar
                                    self.marcar_ocupado(
                                        maestro['id'], 
                                        grupo['id'], 
                                        dia, 
                                        hora_inicio, 
                                        hora_fin
                                    )
                                    
                                    asignaciones.append({
                                        'maestro_id': maestro['id'],
                                        'materia_id': materia['id'],
                                        'grupo_id': grupo['id'],
                                        'dia_semana': dia,
                                        'hora_inicio': hora_inicio,
                                        'hora_fin': hora_fin
                                    })
                                    
                                    horas_restantes -= duracion
                                    asignado = True
                                    break
                    
                    # Si no se pudo asignar, salir del loop
                    if not asignado:
                        break
        
        return asignaciones
