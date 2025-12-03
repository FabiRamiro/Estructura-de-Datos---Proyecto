import './DocenteCard.css'

function DocenteCard({ docente, onEdit, onDelete }) {
    const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']

    return (
        <div className="docente-card">
            <div className="docente-card-header">
                <div className="header-title">
                    <h3>{docente.nombre}</h3>
                    {docente.numero && <span className="docente-numero">#{docente.numero}</span>}
                </div>
                <div className="card-actions">
                    <button
                        className="btn-icon btn-edit"
                        onClick={() => onEdit(docente)}
                        title="Editar docente"
                    >
                        ✏️
                    </button>
                    <button
                        className="btn-icon btn-delete"
                        onClick={() => onDelete(docente.id)}
                        title="Eliminar docente"
                    >
                        🗑️
                    </button>
                </div>
            </div>

            <div className="docente-card-body">
                <div className="docente-info">
                    <span className="info-label">Correo</span>
                    <span className="info-value">{docente.email}</span>
                </div>

                <div className="docente-info">
                    <span className="info-label">Horas/día</span>
                    <span className="info-value">{docente.horas_max_dia}hrs</span>
                </div>

                {docente.materias && docente.materias.length > 0 && (
                    <div className="docente-info-full">
                        <span className="info-label">Materias</span>
                        <div className="materias-list">
                            {docente.materias.map((materia, idx) => (
                                <span key={idx} className="materia-tag">
                                    {materia.nombre}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {docente.dias_disponibles && docente.dias_disponibles.length > 0 && (
                    <div className="docente-info-full">
                        <span className="info-label">Días disponibles</span>
                        <div className="dias-list">
                            {diasSemana.map((dia, idx) => (
                                <span
                                    key={idx}
                                    className={`dia-badge ${docente.dias_disponibles.includes(idx) ? 'active' : 'inactive'}`}
                                >
                                    {dia}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default DocenteCard
