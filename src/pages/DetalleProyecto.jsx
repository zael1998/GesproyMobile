import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import { obtenerDetalleProyecto } from "../services/api";


function DetalleProyecto() {

  const { id } = useParams();

  const navigate = useNavigate();

  const [proyecto, setProyecto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    let cancelado = false;

    async function cargarProyecto() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerDetalleProyecto(id);

        if (!cancelado) {
          setProyecto(datos.proyecto);
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

    cargarProyecto();

    return () => {
      cancelado = true;
    };

  }, [id, navigate]);


  return (
    <main className="gm-shell">

      <Link to="/proyectos" className="gm-back">
        ← Volver a mis proyectos
      </Link>

      {cargando && (
        <p className="gm-message">
          Cargando proyecto...
        </p>
      )}

      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && proyecto && (
        <>

          <header className="gm-header">

            <div>

              <p className="gm-eyebrow">
                {proyecto.acronimo}
              </p>

              <h1>{proyecto.nombre}</h1>

            </div>

          </header>

          <section className="gm-detail-card">

            <h2>Información del proyecto</h2>

            <dl className="gm-detail-list">

              <div>
                <dt>Identificador</dt>
                <dd>{proyecto.id}</dd>
              </div>

              <div>
                <dt>Estado</dt>
                <dd>
                  <span className="gm-pill gm-pill-blue">
                    {proyecto.estado}
                  </span>
                </dd>
              </div>

              <div>
                <dt>Fecha de inicio</dt>
                <dd>
                  {proyecto.fecha_inicio || "Sin indicar"}
                </dd>
              </div>

              <div>
                <dt>Fecha de finalización</dt>
                <dd>
                  {proyecto.fecha_fin || "Sin indicar"}
                </dd>
              </div>

              <div>
                <dt>Investigador principal</dt>
                <dd>
                  {proyecto.investigador_principal ||
                    "Sin asignar"}
                </dd>
              </div>

            </dl>

            {proyecto.es_responsable && (
              <p className="gm-responsible">
                Eres el investigador principal.
              </p>
            )}

          </section>

          <section className="gm-actions">

            <Link
              className="gm-action-card"
              to={`/proyectos/${id}/tareas`}
            >
              <span>▤</span>
              <strong>Ver tareas del proyecto</strong>
              <span>→</span>
            </Link>

            {proyecto.estado === "PROCESO" && (

              <Link
                className="gm-button gm-link-button"
                to={`/horas/nuevo?proyecto=${id}`}
              >
                ◷ Registrar horas
              </Link>

            )}

            <Link
              className="gm-action-card"
              to="/horas"
            >
              <span>▣</span>
              <strong>Consultar mis horas</strong>
              <span>→</span>
            </Link>

          </section>

        </>
      )}

    </main>
  );
}

export default DetalleProyecto;