import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  obtenerMisProyectos,
  cerrarSesion,
} from "../services/api";


function MisProyectos() {

  const navigate = useNavigate();

  const [proyectos, setProyectos] = useState([]);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [soloResponsable, setSoloResponsable] = useState(false);


  // ==========================================
  // CONSULTAR PROYECTOS EN DJANGO
  // ==========================================

  useEffect(() => {

    let cancelado = false;

    async function cargarProyectos() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerMisProyectos(
          soloResponsable
        );

        if (!cancelado) {
          setProyectos(datos.proyectos);
        }

      } catch (error) {

        if (cancelado) {
          return;
        }

        if (error.status === 401) {

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(error.message);

      } finally {

        if (!cancelado) {
          setCargando(false);
        }

      }
    }

    cargarProyectos();

    return () => {
      cancelado = true;
    };

  }, [soloResponsable, navigate]);


  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  async function manejarLogout() {

    try {

      await cerrarSesion();

      navigate("/login", {
        replace: true,
      });

    } catch (error) {

      setError(error.message);

    }
  }


  return (
    <main className="gm-shell">

      <header className="gm-header">

        <div>
          <p className="gm-eyebrow">GESPROY · CESGA</p>
          <h1>Mis proyectos</h1>
        </div>

        <button
          type="button"
          className="gm-button-secondary"
          onClick={manejarLogout}
        >
          Salir
        </button>

      </header>

      <section className="gm-filter">

        <label>

          <input
            type="checkbox"
            checked={soloResponsable}
            onChange={(evento) => {
              setSoloResponsable(evento.target.checked);
            }}
          />

          Mostrar solo proyectos donde soy responsable

        </label>

      </section>

      {cargando && (
        <p className="gm-message">
          Cargando proyectos...
        </p>
      )}

      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && proyectos.length === 0 && (
        <p className="gm-message">
          No se han encontrado proyectos asociados.
        </p>
      )}

      {!cargando && !error && (
        <section className="gm-project-list">

          {proyectos.map((proyecto) => (

            <Link
              key={proyecto.id}
              to={`/proyectos/${proyecto.id}`}
              className="gm-project-card"
            >

              <div className="gm-project-top">

                <span className="gm-acronym">
                  {proyecto.acronimo}
                </span>

                <span className="gm-status">
                  {proyecto.estado}
                </span>

              </div>

              <h2>{proyecto.nombre}</h2>

              {proyecto.es_responsable && (
                <p className="gm-responsible">
                  Investigador principal
                </p>
              )}

              <span className="gm-card-link">
                Ver detalles →
              </span>

            </Link>

          ))}

        </section>
      )}

    </main>
  );
}

export default MisProyectos;