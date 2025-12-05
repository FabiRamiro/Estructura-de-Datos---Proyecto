import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./GenerarHorario.css";

const API_URL = "http://localhost:8000";

// Cuatrimestres de estadía (no tienen horario)
const CUATRIMESTRES_ESTADIA = [6, 10];

function GenerarHorario() {
  const navigate = useNavigate();
  const [maestros, setMaestros] = useState([]);
  const [planes, setPlanes] = useState([]);
  const [formData, setFormData] = useState({
    plan_id: "",
    maestro_ids: [],
    turno: "Matutino",
    grupos_generar: 1,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [horarioGenerado, setHorarioGenerado] = useState(null);

  useEffect(() => {
    fetchMaestros();
    fetchPlanes();
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

  const fetchPlanes = async () => {
    try {
      const response = await fetch(`${API_URL}/api/planes-estudios`);
      const data = await response.json();
      if (response.ok) {
        setPlanes(data.planes || []);
      }
    } catch (err) {
      console.error("Error al cargar planes:", err);
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

  const getPlanSeleccionado = () => {
    return planes.find((p) => p.id === parseInt(formData.plan_id));
  };

  // Calcular cuatrimestres que se generaran (excluyendo estadias)
  const getCuatrimestresAGenerar = () => {
    const plan = getPlanSeleccionado();
    if (!plan) return [];
    const cuatrimestres = [];
    for (let i = 1; i <= plan.total_cuatrimestres; i++) {
      if (!CUATRIMESTRES_ESTADIA.includes(i)) {
        cuatrimestres.push(i);
      }
    }
    return cuatrimestres;
  };

  const handleGenerar = async (e) => {
    e.preventDefault();

    if (!formData.plan_id) {
      setMessage("Por favor seleccione un plan de estudios");
      return;
    }

    if (formData.maestro_ids.length === 0) {
      setMessage("Por favor seleccione al menos un docente");
      return;
    }

    const plan = getPlanSeleccionado();

    setLoading(true);
    setMessage("");
    setHorarioGenerado(null);

    try {
      const requestBody = {
        plan_id: parseInt(formData.plan_id),
        maestro_ids: formData.maestro_ids.map((id) => parseInt(id)),
        grupos_generar: parseInt(formData.grupos_generar),
        turno: formData.turno,
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
        setMessage(`${data.message}`);
        setHorarioGenerado(data);
        setTimeout(() => {
          navigate("/consultar-horario");
        }, 2000);
      } else {
        setMessage(`Error: ${data.detail}`);
      }
    } catch (error) {
      setMessage(`Error de conexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const planSeleccionado = getPlanSeleccionado();

  return (
    <div className="generar-horario-page">
      <div className="generar-container">
        <h1>Generar Horario por Plan de Estudios</h1>

        <div className="form-card">
          <form onSubmit={handleGenerar}>
            {/* Seleccion de Plan de Estudios */}
            <div className="form-group">
              <label htmlFor="plan_id">Plan de Estudios</label>
              <select
                id="plan_id"
                name="plan_id"
                value={formData.plan_id}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="">Seleccione un plan</option>
                {planes.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.nombre} - {plan.descripcion}
                  </option>
                ))}
              </select>
              {planes.length === 0 && (
                <small className="field-hint warning">
                  No hay planes de estudio. Vaya a Plan de Estudios para crear
                  uno.
                </small>
              )}
            </div>

            {/* Info de cuatrimestres a generar */}
            {planSeleccionado && (
              <div className="cuatrimestres-info">
                <h3>Cuatrimestres a generar</h3>
                <div className="cuatrimestres-list">
                  {getCuatrimestresAGenerar().map((c) => (
                    <span key={c} className="cuatrimestre-badge">
                      Cuatrimestre {c}
                    </span>
                  ))}
                </div>
                <p className="info-estadias">
                  Cuatrimestres {CUATRIMESTRES_ESTADIA.join(" y ")} son de
                  estadia (sin horario)
                </p>
              </div>
            )}

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
                Manten presionado Ctrl para seleccionar multiples docentes
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="turno">Turno</label>
                <select
                  id="turno"
                  name="turno"
                  value={formData.turno}
                  onChange={handleChange}
                  disabled={loading}
                >
                  <option value="Matutino">Matutino (7:00 - 14:00)</option>
                  <option value="Vespertino">Vespertino (14:00 - 22:00)</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="grupos_generar">Grupos por Cuatrimestre</label>
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
              </div>
            </div>

            {planSeleccionado && (
              <div className="preview-grupos">
                <small>
                  Se generaran{" "}
                  {getCuatrimestresAGenerar().length * formData.grupos_generar}{" "}
                  grupos en total:
                  {getCuatrimestresAGenerar()
                    .slice(0, 3)
                    .map((c) => (
                      <span key={c}>
                        {" "}
                        {planSeleccionado.nombre} {c}-1
                        {formData.grupos_generar > 1
                          ? ` a ${c}-${formData.grupos_generar}`
                          : ""}
                      </span>
                    ))}
                  {getCuatrimestresAGenerar().length > 3 && " ..."}
                </small>
              </div>
            )}

            <button
              type="submit"
              className="btn-crear-horario"
              disabled={loading}
            >
              {loading
                ? "Generando horarios..."
                : "Generar Horarios de Todo el Plan"}
            </button>
          </form>

          {message && (
            <div
              className={`message ${
                message.includes("Error") ? "error" : "success"
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
