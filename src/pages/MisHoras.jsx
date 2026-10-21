import { useEffect, useState } from "react";

import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import { obtenerMisHoras } from "../services/api";


function MisHoras() {

  const navigate = useNavigate();
  const location = useLocation();

  const [parametros, setParametros] = useSearchParams();

  const hoy = new Date();
  const mesActual =
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;

  const mes = parametros.get("mes") || mesActual;

  const [registros, setRegistros] = useState([]);
  const [totalHoras, setTotalHoras] = useState("0.00");

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {

    let cancelado = false;

    async function cargarHoras() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerMisHoras(mes);

        if (!cancelado) {

          setRegistros(datos.registros);
          setTotalHoras(datos.total_horas);

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

    cargarHoras();

    return () => {
      cancelado = true;
    };

  }, [mes, navigate]);


  return (
    <main className="gm-shell">

      <header className="gm-header">

        <div>
          <p className="gm-eyebrow">
            GESPROY · CESGA
          </p>

          <h1>Mis horas</h1>

          <p className="gm-subtitle">
            Consulta tus registros de trabajo.
          </p>
        </div>

      </header>

      {location.state?.mensaje && (
        <div className="gm-success" role="status">
          {location.state.mensaje}
        </div>
      )}

      {location.state?.aviso && (
        <div className="gm-warning" role="status">
          {location.state.aviso}
        </div>
      )}

      <section className="gm-month-filter">

        <label htmlFor="mes">
          Selecciona el mes
        </label>

        <input
          id="mes"
          type="month"
          value={mes}
          onChange={(evento) => {

            setParametros({
              mes: evento.target.value,
            });

          }}
        />

      </section>

      <section className="gm-hours-summary">

        <span>Total de horas del mes</span>

        <strong>
          {Number(totalHoras).toLocaleString("es-ES", {
            maximumFractionDigits: 2,
          })} h
        </strong>

      </section>

      <Link
        to="/horas/nuevo"
        className="gm-button gm-link-button"
      >
        + Registrar horas
      </Link>

      <h2 className="gm-section-title">
        Horas registradas
      </h2>

      {cargando && (
        <p className="gm-message">
          Cargando registros...
        </p>
      )}

      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}

      {!cargando && !error && registros.length === 0 && (
        <section className="gm-empty">

          <span>◷</span>

          <h2>Sin registros</h2>

          <p>
            No has registrado horas durante este mes.
          </p>

        </section>
      )}

      {!cargando && !error && (

        <section className="gm-hours-list">

          {registros.map((registro) => (

            <article
              key={registro.id}
              className="gm-hour-card"
            >

              <div className="gm-hour-heading">

                <div>
                  <strong>
                    {registro.proyecto.acronimo}
                  </strong>

                  <p>{registro.tarea.nombre}</p>
                </div>

                <span className="gm-hour-amount">
                  {Number(registro.horas).toLocaleString("es-ES")} h
                </span>

              </div>

              <div className="gm-hour-footer">

                <time dateTime={registro.fecha}>
                  {registro.fecha}
                </time>

                <span className={
                  registro.validado
                    ? "gm-pill gm-pill-green"
                    : "gm-pill gm-pill-amber"
                }>
                  {registro.validado
                    ? "Validado"
                    : "Pendiente"}
                </span>

              </div>

              {registro.descripcion && (
                <p className="gm-hour-description">
                  {registro.descripcion}
                </p>
              )}

            </article>

          ))}

        </section>

      )}

    </main>
  );
}

export default MisHoras;