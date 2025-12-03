import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './ConsultarHorario.css'

const API_URL = 'http://localhost:8000'

function ConsultarHorario() {
    const navigate = useNavigate()
    const [grupos, setGrupos] = useState([])
    const [grupoSeleccionado, setGrupoSeleccionado] = useState(null)
    const [horarioGrupo, setHorarioGrupo] = useState(null)
    const [turnoSeleccionado, setTurnoSeleccionado] = useState('matutino')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchGrupos()
    }, [])

    const fetchGrupos = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/grupos`)
            const data = await response.json()

            if (response.ok && data.grupos && data.grupos.length > 0) {
                setGrupos(data.grupos)
                // Seleccionar el primer grupo por defecto
                fetchHorarioPorGrupo(data.grupos[0].id, data.grupos[0].nombre)
                setGrupoSeleccionado(data.grupos[0])
            }
        } catch (err) {
            console.error('Error al cargar grupos:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchHorarioPorGrupo = async (grupoId, grupoNombre) => {
        try {
            // Buscar el horario que contenga asignaciones de este grupo
            const response = await fetch(`${API_URL}/api/horarios`)
            const data = await response.json()

            if (response.ok && data.horarios && data.horarios.length > 0) {
                // Buscar el horario correspondiente al grupo
                for (const horario of data.horarios) {
                    const horarioDetalle = await fetch(`${API_URL}/api/horarios/${horario.id}`)
                    const detalleData = await horarioDetalle.json()

                    // Verificar si este horario tiene asignaciones del grupo seleccionado
                    if (detalleData.asignaciones && detalleData.asignaciones.length > 0) {
                        // Buscar por nombre del grupo o por ID
                        const tieneGrupo = detalleData.asignaciones.some(a =>
                            a.grupo === grupoNombre ||
                            a.grupo.includes(grupoId.toString())
                        )

                        if (tieneGrupo) {
                            setHorarioGrupo(detalleData)
                            return
                        }
                    }
                }
            }
            setHorarioGrupo(null)
        } catch (err) {
            console.error('Error al cargar horario del grupo:', err)
        }
    }

    const handleCambiarGrupo = (grupo) => {
        setGrupoSeleccionado(grupo)
        fetchHorarioPorGrupo(grupo.id, grupo.nombre)
    }

    const eliminarTodosHorarios = async () => {
        if (!window.confirm('¿Está seguro de eliminar TODOS los horarios generados?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/horarios`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setGrupos([])
                setGrupoSeleccionado(null)
                setHorarioGrupo(null)
                alert('✅ Todos los horarios han sido eliminados')
                fetchGrupos()
            } else {
                alert('❌ Error al eliminar horarios')
            }
        } catch (err) {
            alert(`❌ Error: ${err.message}`)
        }
    }

    const renderHorarioTable = () => {
        if (!horarioGrupo || !horarioGrupo.asignaciones || horarioGrupo.asignaciones.length === 0) {
            return (
                <div className="no-data">
                    <p>No hay datos de horario para este grupo</p>
                </div>
            )
        }

        // Filtrar asignaciones por turno basándose en las horas
        const asignacionesFiltradas = horarioGrupo.asignaciones.filter(asignacion => {
            const horaInicio = parseInt(asignacion.hora_inicio.split(':')[0])

            if (turnoSeleccionado === 'matutino') {
                // Matutino: 7:00 - 14:00
                return horaInicio >= 7 && horaInicio < 14
            } else {
                // Vespertino: 14:00 - 21:00
                return horaInicio >= 14 && horaInicio < 21
            }
        })

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']

        return (
            <div className="horario-table-container">
                <div className="horario-info-header">
                    <div className="info-item">
                        <span className="info-label">Grupo:</span>
                        <span className="info-value">
                            {grupoSeleccionado?.nombre || 'N/A'}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Turno:</span>
                        <span className="info-value">
                            {turnoSeleccionado.charAt(0).toUpperCase() + turnoSeleccionado.slice(1)}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Total Asignaturas:</span>
                        <span className="info-value">
                            {asignacionesFiltradas.length}
                        </span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Fecha Generación:</span>
                        <span className="info-value">
                            {new Date(horarioGrupo.fecha_generacion).toLocaleDateString()}
                        </span>
                    </div>
                </div>

                <table className="horario-table">
                    <thead>
                        <tr>
                            <th>Asignatura</th>
                            <th>Maestro</th>
                            {dias.map(dia => (
                                <th key={dia}>{dia.substring(0, 3)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {asignacionesFiltradas.length > 0 ? (
                            asignacionesFiltradas.map((asignacion, idx) => (
                                <tr key={idx}>
                                    <td>{asignacion.materia}</td>
                                    <td>{asignacion.maestro}</td>
                                    {dias.map(dia => (
                                        <td key={dia}>
                                            {asignacion.dia === dia ?
                                                `${asignacion.hora_inicio}-${asignacion.hora_fin}` :
                                                '-'
                                            }
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={dias.length + 2} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No hay asignaciones para el turno {turnoSeleccionado}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        )
    }

    if (loading && grupos.length === 0) {
        return <div className="loading">⏳ Cargando horarios...</div>
    }

    return (
        <div className="consultar-horario-page">
            <div className="consultar-container">
                <div className="generar-nuevo-section">
                    <button
                        className="btn-generar-nuevo"
                        onClick={() => navigate('/generar-horario')}
                    >
                        GENERAR NUEVO HORARIO
                    </button>
                </div>

                {grupos.length === 0 ? (
                    <div className="no-horario">
                        <p>No hay horarios generados aún.</p>
                        <button
                            className="btn-crear-primero"
                            onClick={() => navigate('/generar-horario')}
                        >
                            Crear Primer Horario
                        </button>
                    </div>
                ) : (
                    <>
                        {renderHorarioTable()}

                        {/* Controles dinámicos ABAJO de la tabla */}
                        <div className="horario-controls">
                            <div className="control-section">
                                <h3>Grupos</h3>
                                <div className="control-buttons">
                                    {grupos.map((grupo) => (
                                        <button
                                            key={grupo.id}
                                            className={`btn-control ${grupoSeleccionado?.id === grupo.id ? 'active' : ''}`}
                                            onClick={() => handleCambiarGrupo(grupo)}
                                        >
                                            {grupo.nombre}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="control-section">
                                <h3>Turnos</h3>
                                <div className="control-buttons">
                                    <button
                                        className={`btn-control ${turnoSeleccionado === 'matutino' ? 'active' : ''}`}
                                        onClick={() => setTurnoSeleccionado('matutino')}
                                    >
                                        Matutino
                                    </button>
                                    <button
                                        className={`btn-control ${turnoSeleccionado === 'vespertino' ? 'active' : ''}`}
                                        onClick={() => setTurnoSeleccionado('vespertino')}
                                    >
                                        Vespertino
                                    </button>
                                </div>
                            </div>

                            <div className="control-section">
                                <h3>Acciones</h3>
                                <div className="control-buttons">
                                    <button
                                        className="btn-control btn-delete"
                                        onClick={eliminarTodosHorarios}
                                    >
                                        🗑️ Limpiar Horarios
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ConsultarHorario
