import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./ConsultarHorario.css";

const API_URL = "http://localhost:8000";

function ConsultarHorario() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState(null);
  const [horarioGrupo, setHorarioGrupo] = useState(null);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState("matutino");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGrupos();
  }, []);

  const fetchGrupos = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/grupos`);
      const data = await response.json();

      if (response.ok && data.grupos && data.grupos.length > 0) {
        setGrupos(data.grupos);
        // Seleccionar el primer grupo por defecto
        fetchHorarioPorGrupo(data.grupos[0].id, data.grupos[0].nombre);
        setGrupoSeleccionado(data.grupos[0]);
      }
    } catch (err) {
      console.error("Error al cargar grupos:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHorarioPorGrupo = async (grupoId, grupoNombre) => {
    try {
      // Buscar el horario que contenga asignaciones de este grupo
      const response = await fetch(`${API_URL}/api/horarios`);
      const data = await response.json();

      if (response.ok && data.horarios && data.horarios.length > 0) {
        // Buscar el horario correspondiente al grupo
        for (const horario of data.horarios) {
          const horarioDetalle = await fetch(
            `${API_URL}/api/horarios/${horario.id}`
          );
          const detalleData = await horarioDetalle.json();

          // Verificar si este horario tiene asignaciones del grupo seleccionado
          if (detalleData.asignaciones && detalleData.asignaciones.length > 0) {
            // Buscar por nombre del grupo o por ID
            const tieneGrupo = detalleData.asignaciones.some(
              (a) =>
                a.grupo === grupoNombre || a.grupo.includes(grupoId.toString())
            );

            if (tieneGrupo) {
              setHorarioGrupo(detalleData);
              return;
            }
          }
        }
      }
      setHorarioGrupo(null);
    } catch (err) {
      console.error("Error al cargar horario del grupo:", err);
    }
  };

  const handleCambiarGrupo = (grupo) => {
    setGrupoSeleccionado(grupo);
    fetchHorarioPorGrupo(grupo.id, grupo.nombre);
  };

  const eliminarTodosHorarios = async () => {
    if (
      !window.confirm("¿Está seguro de eliminar TODOS los horarios generados?")
    ) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/horarios`, {
        method: "DELETE",
      });

      if (response.ok) {
        setGrupos([]);
        setGrupoSeleccionado(null);
        setHorarioGrupo(null);
        alert("Todos los horarios han sido eliminados");
        fetchGrupos();
      } else {
        alert("Error al eliminar horarios");
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  const exportarExcel = () => {
    if (
      !horarioGrupo ||
      !horarioGrupo.asignaciones ||
      horarioGrupo.asignaciones.length === 0
    ) {
      alert("No hay horario para exportar");
      return;
    }

    const dias = [
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    // Filtrar por turno
    const asignacionesFiltradas = horarioGrupo.asignaciones.filter(
      (asignacion) => {
        const horaInicio = parseInt(asignacion.hora_inicio.split(":")[0]);
        if (turnoSeleccionado === "matutino") {
          return horaInicio >= 7 && horaInicio < 14;
        } else {
          return horaInicio >= 14 && horaInicio < 21;
        }
      }
    );

    // Agrupar por materia
    const materiaMap = {};
    asignacionesFiltradas.forEach((asignacion) => {
      const key = asignacion.materia;
      if (!materiaMap[key]) {
        materiaMap[key] = {
          materia: asignacion.materia,
          maestro: asignacion.maestro,
          horarios: {},
        };
      }
      if (!materiaMap[key].horarios[asignacion.dia]) {
        materiaMap[key].horarios[asignacion.dia] = [];
      }
      materiaMap[key].horarios[asignacion.dia].push(
        `${asignacion.hora_inicio}-${asignacion.hora_fin}`
      );
    });

    const materiasAgrupadas = Object.values(materiaMap);

    // Crear contenido CSV (compatible con Excel)
    let csvContent = "\uFEFF"; // BOM para UTF-8 en Excel

    // Encabezado con info del grupo
    csvContent += `Horario - ${grupoSeleccionado?.nombre || "N/A"}\n`;
    csvContent += `Turno: ${
      turnoSeleccionado.charAt(0).toUpperCase() + turnoSeleccionado.slice(1)
    }\n`;
    csvContent += `Fecha de generación: ${new Date(
      horarioGrupo.fecha_generacion
    ).toLocaleDateString()}\n`;
    csvContent += `\n`;

    // Encabezados de columnas
    csvContent += `Materia,Maestro,${dias.join(",")}\n`;

    // Datos
    materiasAgrupadas.forEach((materia) => {
      const fila = [
        `"${materia.materia}"`,
        `"${materia.maestro}"`,
        ...dias.map((dia) => {
          const horarios = materia.horarios[dia];
          return horarios ? `"${horarios.join(" / ")}"` : '"-"';
        }),
      ];
      csvContent += fila.join(",") + "\n";
    });

    // Calcular total de horas
    let totalHoras = 0;
    asignacionesFiltradas.forEach((asig) => {
      const horaInicio = parseInt(asig.hora_inicio.split(":")[0]);
      const horaFin = parseInt(asig.hora_fin.split(":")[0]);
      totalHoras += horaFin - horaInicio;
    });

    csvContent += `\n`;
    csvContent += `Total Materias:,${materiasAgrupadas.length}\n`;
    csvContent += `Total Horas Semanales:,${totalHoras}\n`;

    // Crear y descargar archivo
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Horario_${
      grupoSeleccionado?.nombre || "grupo"
    }_${turnoSeleccionado}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderHorarioTable = () => {
    if (
      !horarioGrupo ||
      !horarioGrupo.asignaciones ||
      horarioGrupo.asignaciones.length === 0
    ) {
      return (
        <div className="no-data">
          <p>No hay datos de horario para este grupo</p>
        </div>
      );
    }

    // Filtrar asignaciones por turno basándose en las horas
    const asignacionesFiltradas = horarioGrupo.asignaciones.filter(
      (asignacion) => {
        const horaInicio = parseInt(asignacion.hora_inicio.split(":")[0]);

        if (turnoSeleccionado === "matutino") {
          // Matutino: 7:00 - 14:00
          return horaInicio >= 7 && horaInicio < 14;
        } else {
          // Vespertino: 14:00 - 21:00
          return horaInicio >= 14 && horaInicio < 21;
        }
      }
    );

    const dias = [
      "Lunes",
      "Martes",
      "Miercoles",
      "Jueves",
      "Viernes",
      "Sabado",
    ];

    // Agrupar asignaciones por materia
    const materiaMap = {};
    asignacionesFiltradas.forEach((asignacion) => {
      const key = asignacion.materia;
      if (!materiaMap[key]) {
        materiaMap[key] = {
          materia: asignacion.materia,
          maestro: asignacion.maestro,
          horarios: {}, // { "Lunes": ["7:00-9:00"], "Martes": ["9:00-11:00"] }
        };
      }
      // Agregar horario al día correspondiente
      if (!materiaMap[key].horarios[asignacion.dia]) {
        materiaMap[key].horarios[asignacion.dia] = [];
      }
      materiaMap[key].horarios[asignacion.dia].push(
        `${asignacion.hora_inicio}-${asignacion.hora_fin}`
      );
    });

    // Convertir a array para renderizar
    const materiasAgrupadas = Object.values(materiaMap);

    // Calcular total de horas semanales
    let totalHorasSemanales = 0;
    asignacionesFiltradas.forEach((asig) => {
      const horaInicio = parseInt(asig.hora_inicio.split(":")[0]);
      const horaFin = parseInt(asig.hora_fin.split(":")[0]);
      totalHorasSemanales += horaFin - horaInicio;
    });

    return (
      <div className="horario-table-container">
        <div className="horario-info-header">
          <div className="info-item">
            <span className="info-label">Grupo:</span>
            <span className="info-value">
              {grupoSeleccionado?.nombre || "N/A"}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Turno:</span>
            <span className="info-value">
              {turnoSeleccionado.charAt(0).toUpperCase() +
                turnoSeleccionado.slice(1)}
            </span>
          </div>
          <div className="info-item">
            <span className="info-label">Total Materias:</span>
            <span className="info-value">{materiasAgrupadas.length}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Horas Semanales:</span>
            <span className="info-value">{totalHorasSemanales}</span>
          </div>
          <div className="info-item">
            <span className="info-label">Fecha Generación:</span>
            <span className="info-value">
              {new Date(horarioGrupo.fecha_generacion).toLocaleDateString()}
            </span>
          </div>
        </div>

        <table className="horario-table">
          <thead>
            <tr>
              <th>Materia</th>
              <th>Maestro</th>
              {dias.map((dia) => (
                <th key={dia}>{dia.substring(0, 3)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {materiasAgrupadas.length > 0 ? (
              materiasAgrupadas.map((materia, idx) => (
                <tr key={idx}>
                  <td className="materia-cell">{materia.materia}</td>
                  <td className="maestro-cell">{materia.maestro}</td>
                  {dias.map((dia) => (
                    <td key={dia} className="hora-cell">
                      {materia.horarios[dia]
                        ? materia.horarios[dia].map((hora, i) => (
                            <div key={i} className="hora-item">
                              {hora}
                            </div>
                          ))
                        : "-"}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={dias.length + 2}
                  style={{ textAlign: "center", padding: "2rem" }}
                >
                  No hay asignaciones para el turno {turnoSeleccionado}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  if (loading && grupos.length === 0) {
    return <div className="loading">Cargando horarios...</div>;
  }

  return (
    <div className="consultar-horario-page">
      <div className="consultar-container">
        <div className="generar-nuevo-section">
          <button
            className="btn-generar-nuevo"
            onClick={() => navigate("/generar-horario")}
          >
            GENERAR NUEVO HORARIO
          </button>
        </div>

        {grupos.length === 0 ? (
          <div className="no-horario">
            <p>No hay horarios generados aún.</p>
            <button
              className="btn-crear-primero"
              onClick={() => navigate("/generar-horario")}
            >
              Crear Primer Horario
            </button>
          </div>
        ) : (
          <>
            {renderHorarioTable()}

            {/* Controles dinámicos ABAJO de la tabla */}
            <div className="horario-controls">
              <div className="control-section">
                <h3>Grupos</h3>
                <div className="control-buttons">
                  {grupos.map((grupo) => (
                    <button
                      key={grupo.id}
                      className={`btn-control ${
                        grupoSeleccionado?.id === grupo.id ? "active" : ""
                      }`}
                      onClick={() => handleCambiarGrupo(grupo)}
                    >
                      {grupo.nombre}
                    </button>
                  ))}
                </div>
              </div>

              <div className="control-section">
                <h3>Turnos</h3>
                <div className="control-buttons">
                  <button
                    className={`btn-control ${
                      turnoSeleccionado === "matutino" ? "active" : ""
                    }`}
                    onClick={() => setTurnoSeleccionado("matutino")}
                  >
                    Matutino
                  </button>
                  <button
                    className={`btn-control ${
                      turnoSeleccionado === "vespertino" ? "active" : ""
                    }`}
                    onClick={() => setTurnoSeleccionado("vespertino")}
                  >
                    Vespertino
                  </button>
                </div>
              </div>

              <div className="control-section">
                <h3>Acciones</h3>
                <div className="control-buttons">
                  <button
                    className="btn-control btn-export"
                    onClick={exportarExcel}
                  >
                    Exportar Excel
                  </button>
                  <button
                    className="btn-control btn-delete"
                    onClick={eliminarTodosHorarios}
                  >
                    Limpiar Horarios
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ConsultarHorario;
