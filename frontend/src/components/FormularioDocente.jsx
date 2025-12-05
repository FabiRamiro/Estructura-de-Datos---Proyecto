import { useState, useEffect } from "react";
import "./FormularioDocente.css";

const API_URL = "http://localhost:8000";

function FormularioDocente({ onDocenteAdded, docenteToEdit, onCancel }) {
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    numero: "",
    horas_max_semana: "",
    materia_ids: [],
    dias_disponibles: [],
  });
  const [materias, setMaterias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const diasSemana = [
    { value: 0, label: "Lunes" },
    { value: 1, label: "Martes" },
    { value: 2, label: "Miercoles" },
    { value: 3, label: "Jueves" },
    { value: 4, label: "Viernes" },
  ];

  useEffect(() => {
    fetchMaterias();
  }, []);

  useEffect(() => {
    if (docenteToEdit) {
      setFormData({
        nombre: docenteToEdit.nombre || "",
        email: docenteToEdit.email || "",
        numero: docenteToEdit.numero || "",
        horas_max_semana: docenteToEdit.horas_max_semana || "",
        materia_ids: docenteToEdit.materias?.map((m) => m.id) || [],
        dias_disponibles: docenteToEdit.dias_disponibles || [],
      });
    }
  }, [docenteToEdit]);

  const fetchMaterias = async () => {
    try {
      const response = await fetch(`${API_URL}/api/materias`);
      const data = await response.json();
      if (response.ok) {
        setMaterias(data.materias || []);
      }
    } catch (err) {
      console.error("Error al cargar materias:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleMateriaToggle = (materiaId) => {
    setFormData((prev) => ({
      ...prev,
      materia_ids: prev.materia_ids.includes(materiaId)
        ? prev.materia_ids.filter((id) => id !== materiaId)
        : [...prev.materia_ids, materiaId],
    }));
  };

  const handleDiaToggle = (dia) => {
    setFormData((prev) => ({
      ...prev,
      dias_disponibles: prev.dias_disponibles.includes(dia)
        ? prev.dias_disponibles.filter((d) => d !== dia)
        : [...prev.dias_disponibles, dia],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (formData.materia_ids.length === 0) {
      setMessage("Debe seleccionar al menos una materia");
      setLoading(false);
      return;
    }

    if (formData.dias_disponibles.length === 0) {
      setMessage("Debe seleccionar al menos un dia disponible");
      setLoading(false);
      return;
    }

    try {
      const url = docenteToEdit
        ? `${API_URL}/api/maestros/${docenteToEdit.id}`
        : `${API_URL}/api/maestros`;

      const method = docenteToEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nombre: formData.nombre,
          email: formData.email,
          numero: formData.numero,
          horas_max_semana: parseInt(formData.horas_max_semana),
          materia_ids: formData.materia_ids,
          dias_disponibles: formData.dias_disponibles,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(
          docenteToEdit
            ? "Docente actualizado exitosamente"
            : "Docente agregado exitosamente"
        );
        setFormData({
          nombre: "",
          email: "",
          numero: "",
          horas_max_semana: "",
          materia_ids: [],
          dias_disponibles: [],
        });
        setTimeout(() => {
          if (onDocenteAdded) onDocenteAdded();
        }, 1000);
      } else {
        setMessage(
          `Error: ${
            data.detail ||
            `No se pudo ${docenteToEdit ? "actualizar" : "agregar"} el docente`
          }`
        );
      }
    } catch (error) {
      setMessage(`Error de conexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="formulario-docente" onSubmit={handleSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label htmlFor="nombre">Nombre completo</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="Ej: Dr. Juan Pérez"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Correo institucional</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="docente@universidad.edu"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="numero">Número del docente</label>
          <input
            type="text"
            id="numero"
            name="numero"
            value={formData.numero}
            onChange={handleChange}
            disabled={loading}
            placeholder="12345"
          />
        </div>

        <div className="form-group">
          <label htmlFor="horas_max_semana">
            Horas Disponibles por Semana (máx 15)
          </label>
          <input
            type="number"
            id="horas_max_semana"
            name="horas_max_semana"
            value={formData.horas_max_semana}
            onChange={handleChange}
            min="1"
            max="15"
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Materias que puede impartir</label>
        <div className="checkbox-grid">
          {materias.map((materia) => (
            <label key={materia.id} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.materia_ids.includes(materia.id)}
                onChange={() => handleMateriaToggle(materia.id)}
                disabled={loading}
              />
              <span>{materia.nombre}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label>Días disponibles</label>
        <div className="checkbox-grid">
          {diasSemana.map((dia) => (
            <label key={dia.value} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.dias_disponibles.includes(dia.value)}
                onChange={() => handleDiaToggle(dia.value)}
                disabled={loading}
              />
              <span>{dia.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading
            ? "Guardando..."
            : docenteToEdit
            ? "Actualizar Docente"
            : "Guardar Docente"}
        </button>
        {docenteToEdit && onCancel && (
          <button type="button" className="btn-cancel" onClick={onCancel}>
            Cancelar
          </button>
        )}
      </div>

      {message && (
        <div
          className={`message ${
            message.includes("exitosamente") ? "success" : "error"
          }`}
        >
          {message}
        </div>
      )}
    </form>
  );
}

export default FormularioDocente;
