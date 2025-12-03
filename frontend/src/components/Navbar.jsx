import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

function Navbar() {
    const location = useLocation()

    // Determinar el título según la ruta actual
    const getTitle = () => {
        if (location.pathname.includes('docentes')) return 'Docentes'
        if (location.pathname.includes('materias')) return 'Materias'
        if (location.pathname.includes('generar') || location.pathname.includes('consultar')) return 'Horario Upv'
        return 'Horario Upv'
    }

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    {getTitle()}
                </Link>

                <ul className="navbar-menu">
                    <li>
                        <Link
                            to="/"
                            className={location.pathname === '/' ? 'active' : ''}
                        >
                            Inicio
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/docentes"
                            className={location.pathname === '/docentes' ? 'active' : ''}
                        >
                            Docentes
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/materias"
                            className={location.pathname === '/materias' ? 'active' : ''}
                        >
                            Materias
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/consultar-horario"
                            className={location.pathname === '/consultar-horario' ? 'active' : ''}
                        >
                            Consultar horario
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    )
}

export default Navbar
