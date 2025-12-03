import { Link } from 'react-router-dom'
import './Inicio.css'

function Inicio() {
    return (
        <div className="inicio-page">
            <div className="inicio-container">
                <div className="inicio-header">
                    <h1>🎓 Sistema de Generación de Horarios</h1>
                    <p>Bienvenido al sistema de generación automática de horarios UPV</p>
                </div>

                <div className="inicio-cards">
                    <Link to="/docentes" className="inicio-card">
                        <div className="card-icon">👨‍🏫</div>
                        <h2>Gestión de Docentes</h2>
                        <p>Administra la información de los profesores y sus horarios disponibles</p>
                    </Link>

                    <Link to="/generar-horario" className="inicio-card">
                        <div className="card-icon">⚡</div>
                        <h2>Generar Horario</h2>
                        <p>Crea nuevos horarios automáticamente con el algoritmo de optimización</p>
                    </Link>

                    <Link to="/consultar-horario" className="inicio-card">
                        <div className="card-icon">📅</div>
                        <h2>Consultar Horarios</h2>
                        <p>Visualiza y consulta los horarios generados previamente</p>
                    </Link>
                </div>

                <div className="inicio-info">
                    <h3>Características del Sistema</h3>
                    <ul>
                        <li>✓ Generación automática de horarios con Cython</li>
                        <li>✓ Sin empalmes de horario para maestros y grupos</li>
                        <li>✓ Máximo 3 horas consecutivas de clase</li>
                        <li>✓ Optimización de horas libres</li>
                        <li>✓ Gestión completa de docentes y materias</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Inicio
