import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { obtenerTareasProyecto } from "../services/api";


function Tareas() {

  const { id } = useParams();
  const navigate = useNavigate();

  const [proyecto, setProyecto] = useState(null);
  const [tareas, setTareas] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    let cancelado = false;

    async function cargarTareas() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerTareasProyecto(id);

        if (!cancelado) {
          setProyecto(datos.proyecto);
          setTareas(datos.tareas);
        }

      } catch (error) {

        if (cancelado) return;

        if (error.status === 401) {
          navigate("/login", { replace: true });
          return;
        }

        setError(error.message);

      } finally {

        if (!cancelado) {
          setCargando(false);
        }

      }
    }

    cargarTareas();

    return () => {
      cancelado = true;
    };

  }, [id, navigate]);


  const tareasOrdenadas = [...tareas].sort((a, b) => {

    if (a.tarea_padre_id === b.id) return 1;
    if (b.tarea_padre_id === a.id) return -1;

    return a.id - b.id;
  });


  return (
    <main className="gm-shell">

      <Link to={`/proyectos/${id}`} className="gm-back">
        ← Volver al proyecto
      </Link>

      <header className="gm-header">

        <div>
          <p className="gm-eyebrow">
            {proyecto?.acronimo || "GESPROY"}
          </p>

          <h1>Tareas del proyecto</h1>

          <p className="gm-subtitle">
            {proyecto?.nombre}
          </p>
        </div>

      </header>

      {cargando && (
        <p className="gm-message">Cargando tareas...</p>
      )}

      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && tareas.length === 0 && (
        <section className="gm-empty">
          <span>▤</span>
          <h2>Sin tareas</h2>
          <p>Este proyecto todavía no tiene tareas registradas.</p>
        </section>
      )}

      {!cargando && !error && tareasOrdenadas.length > 0 && (

        <section className="gm-tasks-list">

          {tareasOrdenadas.map((tarea) => (

            <article
              className={`gm-task-card ${
                tarea.tarea_padre_id ? "gm-subtask" : ""
              }`}
              key={tarea.id}
            >

              <div className="gm-task-heading">

                <div>
                  {tarea.tarea_padre_id && (
                    <span className="gm-small-label">
                      Subtarea
                    </span>
                  )}

                  <h2>{tarea.nombre}</h2>
                </div>

                <span className={
                  tarea.finalizada
                    ? "gm-pill gm-pill-green"
                    : "gm-pill gm-pill-amber"
                }>
                  {tarea.finalizada
                    ? "Finalizada"
                    : "Pendiente"}
                </span>

              </div>

              {tarea.descripcion && (
                <p className="gm-task-description">
                  {tarea.descripcion}
                </p>
              )}

              <div className="gm-task-meta">

                <span>
                  Horas previstas: {tarea.horas_estimadas} h
                </span>

                <span>
                  Inicio: {tarea.fecha_inicio}
                </span>

              </div>

              {tarea.puede_imputar && (

                <Link
                  className="gm-button gm-link-button"
                  to={`/horas/nuevo?proyecto=${id}&tarea=${tarea.id}`}
                >
                  Registrar horas
                </Link>

              )}

            </article>

          ))}

        </section>

      )}

    </main>
  );
}

export default Tareas;