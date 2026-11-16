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
  const [esAdministrador, setEsAdministrador] = useState(false);

  const [busqueda, setBusqueda] = useState("");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");


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

          setEsAdministrador(
            datos.es_administrador === true
          );

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
  // FILTRAR PROYECTOS
  // ==========================================

  const proyectosFiltrados = proyectos.filter((proyecto) => {

    const texto = busqueda.trim().toLowerCase();

    const coincideBusqueda =
      (proyecto.nombre || "").toLowerCase().includes(texto) ||
      (proyecto.acronimo || "").toLowerCase().includes(texto);

    const coincideEstado =
      estadoSeleccionado === "" ||
      proyecto.estado === estadoSeleccionado;

    return coincideBusqueda && coincideEstado;

  });


  // ==========================================
  // NOMBRES DE LOS ESTADOS
  // ==========================================

  const nombresEstados = {
    DEFINICION: "Definición",
    SOLICITADO: "Solicitado",
    NEGOCIACION: "Negociación",
    PROCESO: "En proceso",
    FINALIZADO: "Finalizado",
    DENEGADO: "Denegado",
  };


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


  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <main className="gm-shell">

      <header className="gm-header">

        <div>

          <p className="gm-eyebrow">
            GESPROY · CESGA
          </p>

          <h1>
            {esAdministrador
              ? "Todos los proyectos"
              : "Mis proyectos"}
          </h1>

        </div>

        <button
          type="button"
          className="gm-button-secondary"
          onClick={manejarLogout}
        >
          Salir
        </button>

      </header>


      {/* BUSCADOR Y FILTRO DE ESTADO */}

      {!cargando && !error && (

        <section
          className="gm-filter"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >

          <input
            type="search"
            placeholder="Buscar proyecto..."
            aria-label="Buscar por nombre o acrónimo"
            value={busqueda}
            onChange={(evento) => {
              setBusqueda(evento.target.value);
            }}
            style={{
              width: "100%",
              padding: "12px",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              boxSizing: "border-box",
              fontSize: "14px",
            }}
          />


          {/* FILTRO PARA ADMINISTRADORES */}

          {esAdministrador && (

            <select
              aria-label="Filtrar por estado"
              value={estadoSeleccionado}
              onChange={(evento) => {
                setEstadoSeleccionado(evento.target.value);
              }}
              style={{
                width: "100%",
                padding: "12px",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                backgroundColor: "white",
                fontSize: "14px",
              }}
            >

              <option value="">Todos los estados</option>
              <option value="DEFINICION">Definición</option>
              <option value="SOLICITADO">Solicitado</option>
              <option value="NEGOCIACION">Negociación</option>
              <option value="PROCESO">En proceso</option>
              <option value="FINALIZADO">Finalizado</option>
              <option value="DENEGADO">Denegado</option>

            </select>

          )}


          {/* FILTRO PARA INVESTIGADORES */}

          {!esAdministrador && (

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

          )}

        </section>

      )}


      {/* ESTADO DE CARGA */}

      {cargando && (

        <p className="gm-message">
          Cargando proyectos...
        </p>

      )}


      {/* ERRORES */}

      {error && (

        <p className="gm-error" role="alert">
          {error}
        </p>

      )}


      {/* NÚMERO DE PROYECTOS */}

      {!cargando && !error && (

        <p className="gm-message">

          {proyectosFiltrados.length} de {proyectos.length}
          {" "}proyectos

        </p>

      )}


      {/* LISTADO VACÍO */}

      {!cargando && !error && proyectosFiltrados.length === 0 && (

        <p className="gm-message">

          {proyectos.length > 0
            ? "No hay proyectos que coincidan con los filtros."
            : esAdministrador
              ? "No se han encontrado proyectos."
              : "No se han encontrado proyectos asociados."}

        </p>

      )}


      {/* LISTADO DE PROYECTOS */}

      {!cargando && !error && (

        <section className="gm-project-list">

          {proyectosFiltrados.map((proyecto) => (

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

                  {nombresEstados[proyecto.estado]
                    || proyecto.estado}

                </span>

              </div>

              <h2>{proyecto.nombre}</h2>


              {/* INVESTIGADOR PRINCIPAL */}

              {esAdministrador &&
                proyecto.investigador_principal && (

                  <p className="gm-responsible">

                    Responsable: {proyecto.investigador_principal}

                  </p>

              )}


              {/* INDICADOR DE RESPONSABILIDAD */}

              {!esAdministrador && proyecto.es_responsable && (

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