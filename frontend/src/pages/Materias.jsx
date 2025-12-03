import { useState, useEffect } from 'react'
import './Materias.css'

const API_URL = 'http://localhost:8000'

function Materias() {
    const [materias, setMaterias] = useState([])
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingMateria, setEditingMateria] = useState(null)
    const [formData, setFormData] = useState({
        nombre: '',
        horas_semanales: ''
    })
    const [message, setMessage] = useState('')

    useEffect(() => {
        fetchMaterias()
    }, [])

    const fetchMaterias = async () => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/api/materias`)
            const data = await response.json()
            if (response.ok) {
                setMaterias(data.materias || [])
            }
        } catch (err) {
            console.error('Error al cargar materias:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setMessage('')

        try {
            const url = editingMateria
                ? `${API_URL}/api/materias/${editingMateria.id}`
                : `${API_URL}/api/materias`

            const method = editingMateria ? 'PUT' : 'POST'

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    nombre: formData.nombre,
                    horas_semanales: parseInt(formData.horas_semanales)
                }),
            })

            const data = await response.json()

            if (response.ok) {
                setMessage(editingMateria ? '✅ Materia actualizada' : '✅ Materia creada')
                setFormData({ nombre: '', horas_semanales: '' })
                setEditingMateria(null)
                setShowForm(false)
                fetchMaterias()
            } else {
                setMessage(`❌ Error: ${data.detail}`)
            }
        } catch (error) {
            setMessage(`❌ Error: ${error.message}`)
        }
    }

    const handleEdit = (materia) => {
        setEditingMateria(materia)
        setFormData({
            nombre: materia.nombre,
            horas_semanales: materia.horas_semanales
        })
        setShowForm(true)
    }

    const handleDelete = async (materiaId) => {
        if (!window.confirm('¿Está seguro de eliminar esta materia?')) {
            return
        }

        try {
            const response = await fetch(`${API_URL}/api/materias/${materiaId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                setMessage('✅ Materia eliminada exitosamente')
                fetchMaterias()
            } else {
                const data = await response.json()
                setMessage(`❌ Error: ${data.detail}`)
            }
        } catch (err) {
            setMessage(`❌ Error: ${err.message}`)
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingMateria(null)
        setFormData({ nombre: '', horas_semanales: '' })
    }

    return (
        <div className="materias-page">
            <div className="materias-container">
                <div className="materias-header">
                    <h1>Gestión de Materias</h1>
                    <button
                        className="btn-agregar"
                        onClick={() => {
                            setShowForm(!showForm)
                            setEditingMateria(null)
                            setFormData({ nombre: '', horas_semanales: '' })
                        }}
                    >
                        {showForm ? '✕ Cancelar' : '+ Agregar Materia'}
                    </button>
                </div>

                {message && (
                    <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                        {message}
                    </div>
                )}

                {showForm && (
                    <div className="form-section">
                        <h2>{editingMateria ? '✏️ Editar Materia' : 'Nueva Materia'}</h2>
                        <form onSubmit={handleSubmit} className="materia-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="nombre">Nombre de la Materia</label>
                                    <input
                                        type="text"
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                        required
                                        placeholder="Ej: Programación I"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="horas_semanales">Horas Semanales</label>
                                    <input
                                        type="number"
                                        id="horas_semanales"
                                        value={formData.horas_semanales}
                                        onChange={(e) => setFormData({ ...formData, horas_semanales: e.target.value })}
                                        min="1"
                                        max="20"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button type="submit" className="btn-submit">
                                    {editingMateria ? 'Actualizar' : 'Guardar'}
                                </button>
                                {editingMateria && (
                                    <button type="button" className="btn-cancel" onClick={handleCancel}>
                                        Cancelar
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                )}

                <div className="materias-list-section">
                    <h2>Materias Registradas ({materias.length})</h2>
                    {loading ? (
                        <div className="loading">⏳ Cargando materias...</div>
                    ) : materias.length === 0 ? (
                        <p className="empty-state">No hay materias registradas.</p>
                    ) : (
                        <div className="materias-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Horas Semanales</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {materias.map((materia) => (
                                        <tr key={materia.id}>
                                            <td>{materia.nombre}</td>
                                            <td>{materia.horas_semanales} hrs</td>
                                            <td className="actions">
                                                <button
                                                    className="btn-icon btn-edit"
                                                    onClick={() => handleEdit(materia)}
                                                    title="Editar"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    className="btn-icon btn-delete"
                                                    onClick={() => handleDelete(materia.id)}
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Materias
