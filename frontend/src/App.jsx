import { useState } from 'react'
import './App.css'
import MaestrosUpload from './components/MaestrosUpload'
import MaestrosList from './components/MaestrosList'
import GenerarHorario from './components/GenerarHorario'
import HorarioView from './components/HorarioView'

function App() {
  const [maestrosCount, setMaestrosCount] = useState(0)
  const [horarioId, setHorarioId] = useState(null)

  return (
    <div className="App">
      <header className="app-header">
        <h1>🎓 Generador de Horarios Universitarios</h1>
        <p>Sistema de generación automática de horarios con Cython</p>
      </header>

      <div className="container">
        <div className="section">
          <h2>📤 Cargar Maestros desde CSV</h2>
          <MaestrosUpload onUploadSuccess={() => setMaestrosCount(maestrosCount + 1)} />
        </div>

        <div className="section">
          <h2>👨‍🏫 Maestros Registrados</h2>
          <MaestrosList key={maestrosCount} />
        </div>

        <div className="section">
          <h2>⚡ Generar Horario</h2>
          <GenerarHorario onHorarioGenerado={(id) => setHorarioId(id)} />
        </div>

        {horarioId && (
          <div className="section">
            <h2>📅 Horario Generado</h2>
            <HorarioView horarioId={horarioId} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
