import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Plus,
} from "lucide-react";

import { obtenerMisHoras } from "../services/api";


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function formatearFecha(fecha) {

  const anio = fecha.getFullYear();

  const mes = String(
    fecha.getMonth() + 1
  ).padStart(2, "0");

  const dia = String(
    fecha.getDate()
  ).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}


function formatearHoras(horas) {

  return Number(horas).toLocaleString("es-ES", {
    maximumFractionDigits: 2,
  });
}


function obtenerDiasMes(mes) {

  const [anio, numeroMes] = mes.split("-").map(Number);

  const primerDia = new Date(anio, numeroMes - 1, 1);

  const cantidadDias = new Date(
    anio,
    numeroMes,
    0
  ).getDate();

  // En JavaScript domingo es 0.
  // Queremos que la semana empiece el lunes.
  const huecosIniciales = (
    primerDia.getDay() + 6
  ) % 7;

  const dias = Array(huecosIniciales).fill(null);

  for (let numero = 1; numero <= cantidadDias; numero++) {

    dias.push(
      `${mes}-${String(numero).padStart(2, "0")}`
    );
  }

  return dias;
}


// ==========================================
// COMPONENTE CALENDARIO
// ==========================================

function Calendario() {

  const navigate = useNavigate();

  const [parametros, setParametros] = useSearchParams();

  const hoy = new Date();
  const fechaHoy = formatearFecha(hoy);
  const mesActual = fechaHoy.slice(0, 7);

  const mesParametro = parametros.get("mes");

  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(
    mesParametro || ""
  )
    ? mesParametro
    : mesActual;

  const [anio, numeroMes] = mes.split("-").map(Number);

  const [registros, setRegistros] = useState([]);
  const [totalHoras, setTotalHoras] = useState("0.00");

  const [diaSeleccionado, setDiaSeleccionado] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");


  // ==========================================
  // OBTENER LAS HORAS DEL MES
  // ==========================================

  useEffect(() => {

    let cancelado = false;

    async function cargarCalendario() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerMisHoras(mes);

        if (cancelado) return;

        setRegistros(datos.registros);
        setTotalHoras(datos.total_horas);

        const hoyLocal = formatearFecha(new Date());

        setDiaSeleccionado(
          mes === hoyLocal.slice(0, 7)
            ? hoyLocal
            : `${mes}-01`
        );

      } catch (error) {

        if (cancelado) return;

        if (error.status === 401) {

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(error.message);
        setRegistros([]);
        setTotalHoras("0.00");

      } finally {

        if (!cancelado) {
          setCargando(false);
        }
      }
    }

    cargarCalendario();

    return () => {
      cancelado = true;
    };

  }, [mes, navigate]);


  // ==========================================
  // CAMBIAR DE MES
  // ==========================================

  function cambiarMes(cantidad) {

    const nuevaFecha = new Date(
      anio,
      numeroMes - 1 + cantidad,
      1
    );

    const nuevoMes = formatearFecha(
      nuevaFecha
    ).slice(0, 7);

    setParametros({
      mes: nuevoMes,
    });
  }


  // ==========================================
  // ORGANIZAR LAS HORAS POR DÍA
  // ==========================================

  const horasPorDia = {};

  for (const registro of registros) {

    const fecha = registro.fecha;

    if (!horasPorDia[fecha]) {
      horasPorDia[fecha] = 0;
    }

    horasPorDia[fecha] += Number(registro.horas);
  }


  const diasCalendario = obtenerDiasMes(mes);

  const nombreMes = new Date(
    anio,
    numeroMes - 1,
    1
  ).toLocaleDateString("es-ES", {
    month: "long",
    year: "numeric",
  });


  // ==========================================
  // REGISTROS DEL DÍA SELECCIONADO
  // ==========================================

  const registrosDelDia = registros.filter(
    (registro) => registro.fecha === diaSeleccionado
  );

  const fechaSeleccionada = diaSeleccionado
    ? new Date(
        Number(diaSeleccionado.slice(0, 4)),
        Number(diaSeleccionado.slice(5, 7)) - 1,
        Number(diaSeleccionado.slice(8, 10))
      )
    : null;

  const esDiaLaborable = fechaSeleccionada
    ? ![0, 6].includes(fechaSeleccionada.getDay())
    : false;

  const puedeSolicitarRegistro = (
    diaSeleccionado &&
    diaSeleccionado <= fechaHoy &&
    esDiaLaborable
  );


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

          <h1>Calendario</h1>

          <p className="gm-subtitle">
            Consulta tus horas de trabajo.
          </p>

        </div>

        <CalendarDays
          size={30}
          className="gm-header-icon"
        />

      </header>


      {/* RESUMEN MENSUAL */}

      <section className="gm-calendar-summary">

        <div>

          <span>Horas registradas este mes</span>

          <strong>
            {formatearHoras(totalHoras)} h
          </strong>

        </div>

        <Clock3 size={30} />

      </section>


      {/* CALENDARIO */}

      <section className="gm-calendar-card">

        <div className="gm-calendar-toolbar">

          <button
            type="button"
            onClick={() => cambiarMes(-1)}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={21} />
          </button>

          <h2>{nombreMes}</h2>

          <button
            type="button"
            onClick={() => cambiarMes(1)}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={21} />
          </button>

        </div>


        <div className="gm-calendar-grid">

          {[
            "Lun",
            "Mar",
            "Mié",
            "Jue",
            "Vie",
            "Sáb",
            "Dom",
          ].map((dia) => (

            <span
              key={dia}
              className="gm-calendar-weekday"
            >
              {dia}
            </span>

          ))}


          {diasCalendario.map((dia, indice) => {

            if (!dia) {

              return (
                <div
                  key={`vacio-${indice}`}
                  className="gm-calendar-empty-day"
                />
              );
            }

            const horasDia = horasPorDia[dia] || 0;

            const seleccionado = (
              diaSeleccionado === dia
            );

            const esHoy = (
              dia === fechaHoy
            );

            return (

              <button
                key={dia}
                type="button"
                disabled={cargando || Boolean(error)}
                onClick={() => setDiaSeleccionado(dia)}
                className={[
                  "gm-calendar-day",
                  seleccionado ? "gm-day-selected" : "",
                  esHoy ? "gm-day-today" : "",
                  horasDia > 0 ? "gm-day-worked" : "",
                ].join(" ")}
                aria-pressed={seleccionado}
              >

                <span>
                  {Number(dia.slice(-2))}
                </span>

                {horasDia > 0 && (
                  <small>
                    {formatearHoras(horasDia)} h
                  </small>
                )}

              </button>

            );

          })}

        </div>

      </section>


      {/* ERRORES Y CARGA */}

      {cargando && (
        <p className="gm-message">
          Cargando calendario...
        </p>
      )}

      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}


      {/* REGISTROS DEL DÍA */}

      {!cargando && !error && diaSeleccionado && (

        <section className="gm-calendar-detail">

          <h2>
            {fechaSeleccionada.toLocaleDateString(
              "es-ES",
              {
                day: "numeric",
                month: "long",
                year: "numeric",
              }
            )}
          </h2>

          {registrosDelDia.length === 0 ? (

            <p className="gm-message">
              No tienes horas registradas este día.
            </p>

          ) : (

            registrosDelDia.map((registro) => (

              <article
                key={registro.id}
                className="gm-calendar-entry"
              >

                <div>

                  <strong>
                    {registro.proyecto.acronimo}
                  </strong>

                  <p>{registro.tarea.nombre}</p>

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

                <b>
                  {formatearHoras(registro.horas)} h
                </b>

              </article>

            ))

          )}


          {puedeSolicitarRegistro && (

            <Link
              to={`/horas/nuevo?fecha=${diaSeleccionado}`}
              className="gm-button gm-link-button gm-calendar-add"
            >

              <Plus size={19} />

              Registrar horas este día

            </Link>

          )}

        </section>

      )}

    </main>
  );
}

export default Calendario;