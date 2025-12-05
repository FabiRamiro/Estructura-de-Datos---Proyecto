import { useState, useEffect } from "react";
import FormularioDocente from "../components/FormularioDocente";
import DocenteCard from "../components/DocenteCard";
import MaestrosUpload from "../components/MaestrosUpload";
import "./Docentes.css";

const API_URL = "http://localhost:8000";

function Docentes() {
  const [maestros, setMaestros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingDocente, setEditingDocente] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchMaestros = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/maestros`);
      const data = await response.json();
      if (response.ok) {
        setMaestros(data.maestros || []);
      }
    } catch (err) {
      console.error("Error al cargar maestros:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDocenteAdded = () => {
    setRefreshKey((prev) => prev + 1);
    fetchMaestros();
    setShowForm(false);
    setEditingDocente(null);
  };

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    fetchMaestros();
  };

  const handleEdit = (docente) => {
    setEditingDocente(docente);
    setShowForm(true);
  };

  const handleDelete = async (docenteId) => {
    if (!window.confirm("¿Está seguro de eliminar este docente?")) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/maestros/${docenteId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Docente eliminado exitosamente");
        fetchMaestros();
      } else {
        const data = await response.json();
        alert(`Error: ${data.detail || "No se pudo eliminar el docente"}`);
      }
    } catch (err) {
      alert(`Error de conexion: ${err.message}`);
    }
  };

  const handleCancelEdit = () => {
    setShowForm(false);
    setEditingDocente(null);
  };

  useEffect(() => {
    fetchMaestros();
  }, [refreshKey]);

  return (
    <div className="docentes-page">
      <div className="docentes-container">
        <div className="docentes-header">
          <h1>Gestión de Docentes</h1>
          {!showForm && (
            <button
              className="btn-agregar-docente"
              onClick={() => {
                setShowForm(true);
                setEditingDocente(null);
              }}
            >
              + Agregar Docente
            </button>
          )}
        </div>

        {/* Formularios - se muestran en lugar de la lista */}
        {showForm ? (
          <>
            <div className="form-section">
              <div className="form-section-header">
                <h2>
                  {editingDocente
                    ? "Editar Docente"
                    : "Ingrese los datos del nuevo Docente"}
                </h2>
                <button className="btn-cerrar-form" onClick={handleCancelEdit}>
                  X Cerrar
                </button>
              </div>
              <FormularioDocente
                onDocenteAdded={handleDocenteAdded}
                docenteToEdit={editingDocente}
                onCancel={handleCancelEdit}
              />
            </div>

            {!editingDocente && (
              <div className="upload-section">
                <h2>O cargue multiples docentes desde CSV</h2>
                <MaestrosUpload onUploadSuccess={handleUploadSuccess} />
              </div>
            )}
          </>
        ) : (
          /* Lista de docentes - solo se muestra cuando no hay formulario */
          <div className="docentes-list-section">
            <h2>Docentes Registrados ({maestros.length})</h2>
            {loading ? (
              <div className="loading">Cargando docentes...</div>
            ) : maestros.length === 0 ? (
              <p className="empty-state">
                No hay docentes registrados. Agregue uno usando el botón
                "Agregar Docente".
              </p>
            ) : (
              <div className="docentes-grid">
                {maestros.map((maestro) => (
                  <DocenteCard
                    key={maestro.id}
                    docente={maestro}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Docentes;
