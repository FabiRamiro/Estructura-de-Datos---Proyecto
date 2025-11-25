import { useState } from 'react'

const API_URL = 'http://localhost:8000'

function MaestrosUpload({ onUploadSuccess }) {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [message, setMessage] = useState('')

    const handleFileChange = (e) => {
        setFile(e.target.files[0])
        setMessage('')
    }

    const handleUpload = async () => {
        if (!file) {
            setMessage('Por favor selecciona un archivo CSV')
            return
        }

        setLoading(true)
        setMessage('')

        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`${API_URL}/api/maestros/upload-csv`, {
                method: 'POST',
                body: formData,
            })

            const data = await response.json()

            if (response.ok) {
                setMessage(`✅ ${data.message}`)
                setFile(null)
                if (onUploadSuccess) onUploadSuccess()
            } else {
                setMessage(`❌ Error: ${data.detail}`)
            }
        } catch (error) {
            setMessage(`❌ Error de conexión: ${error.message}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="upload-container">
            <div className="file-input-wrapper">
                <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    disabled={loading}
                />
                {file && <span className="file-name">{file.name}</span>}
            </div>

            <button
                onClick={handleUpload}
                disabled={loading || !file}
                className="btn-primary"
            >
                {loading ? '⏳ Cargando...' : '📤 Cargar CSV'}
            </button>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
                    {message}
                </div>
            )}

            <div className="info-box">
                <p><strong>Formato CSV esperado:</strong></p>
                <code>nombre,email,horas_max_dia</code>
                <p style={{ marginTop: '8px', fontSize: '0.9em' }}>
                    Ejemplo: <code>Dr. Juan Pérez,juan@universidad.edu,8</code>
                </p>
            </div>
        </div>
    )
}

export default MaestrosUpload
