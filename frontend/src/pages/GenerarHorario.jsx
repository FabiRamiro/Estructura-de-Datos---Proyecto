import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GenerarHorario.css";

const API_URL = "http://localhost:8000";

function GenerarHorario() {
  const navigate = useNavigate();
  const [maestros, setMaestros] = useState([]);
  const [formData, setFormData] = useState({
    maestro_ids: [],
    turno: "Matutino",
    grupos_generar: 1,
    nombre_carrera: "",
    cuatrimestre: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [horarioGenerado, setHorarioGenerado] = useState(null);

  useEffect(() => {
    fetchMaestros();
  }, []);

  const fetchMaestros = async () => {
    try {
      const response = await fetch(`${API_URL}/api/maestros`);
      const data = await response.json();
      if (response.ok) {
        setMaestros(data.maestros || []);
      }
    } catch (err) {
      console.error("Error al cargar maestros:", err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "maestro_ids") {
      const selectedOptions = Array.from(
        e.target.selectedOptions,
        (option) => option.value
      );
      setFormData({
        ...formData,
        maestro_ids: selectedOptions,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleGenerar = async (e) => {
    e.preventDefault();

    if (!formData.nombre_carrera || !formData.cuatrimestre) {
      setMessage("❌ Por favor complete el nombre de carrera y cuatrimestre");
      return;
    }

    if (formData.maestro_ids.length === 0) {
      setMessage("❌ Por favor seleccione al menos un docente");
      return;
    }

    setLoading(true);
    setMessage("");
    setHorarioGenerado(null);

    try {
      // Enviar datos como JSON en el body
      const requestBody = {
        maestro_ids: formData.maestro_ids.map((id) => parseInt(id)),
        grupos_generar: parseInt(formData.grupos_generar),
        turno: formData.turno,
        nombre_carrera: formData.nombre_carrera,
        cuatrimestre: formData.cuatrimestre,
      };

      const response = await fetch(`${API_URL}/api/generar-horario`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        setHorarioGenerado(data);
        // Navegar a consultar horario después de 2 segundos
        setTimeout(() => {
          navigate("/consultar-horario");
        }, 2000);
      } else {
        setMessage(`❌ Error: ${data.detail}`);
      }
    } catch (error) {
      setMessage(`❌ Error de conexión: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generar-horario-page">
      <div className="generar-container">
        <h1>Generar Nuevo Horario</h1>

        <div className="form-card">
          <form onSubmit={handleGenerar}>
            <div className="form-group">
              <label htmlFor="maestro_ids">Docentes Disponibles</label>
              <select
                id="maestro_ids"
                name="maestro_ids"
                value={formData.maestro_ids}
                onChange={handleChange}
                disabled={loading}
                multiple
                size="5"
              >
                {maestros.map((maestro) => (
                  <option key={maestro.id} value={maestro.id}>
                    {maestro.nombre}
                  </option>
                ))}
              </select>
              <small className="field-hint">
                Mantén presionado Ctrl (o Cmd en Mac) para seleccionar múltiples
                docentes
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="turno">Turno a Generar</label>
              <select
                id="turno"
                name="turno"
                value={formData.turno}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Seleccione el turno</option>
                <option value="Matutino">Matutino</option>
                <option value="Vespertino">Vespertino</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="nombre_carrera">Nombre de Carrera</label>
              <input
                type="text"
                id="nombre_carrera"
                name="nombre_carrera"
                value={formData.nombre_carrera}
                onChange={handleChange}
                placeholder="Ej: ITIID, ISTI"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="cuatrimestre">Cuatrimestre</label>
              <input
                type="text"
                id="cuatrimestre"
                name="cuatrimestre"
                value={formData.cuatrimestre}
                onChange={handleChange}
                placeholder="Ej: 5"
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="grupos_generar">Cantidad de Grupos</label>
              <input
                type="number"
                id="grupos_generar"
                name="grupos_generar"
                value={formData.grupos_generar}
                onChange={handleChange}
                min="1"
                max="10"
                required
                disabled={loading}
              />
              <small className="field-hint">
                Se generarán grupos como: {formData.nombre_carrera || "CARRERA"}{" "}
                {formData.cuatrimestre || "X"}-1,{" "}
                {formData.nombre_carrera || "CARRERA"}{" "}
                {formData.cuatrimestre || "X"}-2...
              </small>
            </div>

            <button
              type="submit"
              className="btn-crear-horario"
              disabled={loading}
            >
              {loading ? "⏳ Generando..." : "Crear Horario"}
            </button>
          </form>

          {message && (
            <div
              className={`message ${
                message.includes("✅") ? "success" : "error"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GenerarHorario;
