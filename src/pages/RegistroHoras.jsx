import { useEffect, useState } from "react";

import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  obtenerMisProyectos,
  obtenerTareasProyecto,
  registrarHoras,
} from "../services/api";


function RegistroHoras() {

  const navigate = useNavigate();
  const [parametros] = useSearchParams();

  const proyectoInicial = parametros.get("proyecto") || "";
  const tareaInicial = parametros.get("tarea") || "";

  const [proyectos, setProyectos] = useState([]);
  const [tareas, setTareas] = useState([]);

  const [proyectoId, setProyectoId] = useState(proyectoInicial);
  const [tareaId, setTareaId] = useState(tareaInicial);

  const [fecha, setFecha] = useState(
  parametros.get("fecha") || ""
    );
  const [horas, setHoras] = useState("");
  const [descripcion, setDescripcion] = useState("");

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [error, setError] = useState("");


  // ==========================================
  // CARGAR PROYECTOS
  // ==========================================

  useEffect(() => {

    let cancelado = false;

    async function cargarProyectos() {

      try {

        const datos = await obtenerMisProyectos();

        if (!cancelado) {

          setProyectos(
            datos.proyectos.filter(
              (proyecto) => proyecto.estado === "PROCESO"
            )
          );

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

    cargarProyectos();

    return () => {
      cancelado = true;
    };

  }, [navigate]);


  // ==========================================
  // CARGAR TAREAS DEL PROYECTO
  // ==========================================

  useEffect(() => {

    let cancelado = false;

    async function cargarTareas() {

      setTareas([]);

      if (!proyectoId) {
        return;
      }

      try {

        const datos = await obtenerTareasProyecto(proyectoId);

        if (!cancelado) {

          const abiertas = datos.tareas.filter(
            (tarea) => tarea.puede_imputar
          );

          setTareas(abiertas);

        }

      } catch (error) {

        if (cancelado) return;

        setError(error.message);

      }
    }

    cargarTareas();

    return () => {
      cancelado = true;
    };

  }, [proyectoId]);


  // ==========================================
  // GUARDAR REGISTRO
  // ==========================================

  async function manejarEnvio(evento) {

    evento.preventDefault();

    setError("");
    setGuardando(true);

    try {

      const resultado = await registrarHoras({
        proyecto: proyectoId,
        tarea: tareaId,
        fecha,
        horas,
        descripcion,
      });

      const mes = fecha.slice(0, 7);

      navigate(
        `/horas?mes=${encodeURIComponent(mes)}`,
        {
          replace: true,
          state: {
            mensaje: resultado.mensaje,
            aviso: resultado.aviso,
          },
        }
      );

    } catch (error) {

      if (error.status === 401) {

        navigate("/login", {
          replace: true,
        });

        return;
      }

      setError(error.message);

    } finally {

      setGuardando(false);

    }
  }


  return (
    <main className="gm-shell">

      <Link to="/horas" className="gm-back">
        ← Volver a mis horas
      </Link>

      <header className="gm-header">

        <div>
          <p className="gm-eyebrow">
            GESPROY · CESGA
          </p>

          <h1>Registrar horas</h1>

          <p className="gm-subtitle">
            Añade las horas dedicadas a una tarea.
          </p>
        </div>

      </header>

      <form
        className="gm-form-card"
        onSubmit={manejarEnvio}
      >

        <label htmlFor="proyecto">
          Proyecto
        </label>

        <select
          id="proyecto"
          value={proyectoId}
          disabled={cargando || guardando}
          required
          onChange={(evento) => {
            setProyectoId(evento.target.value);
            setTareaId("");
          }}
        >

          <option value="">
            Selecciona un proyecto
          </option>

          {proyectos.map((proyecto) => (

            <option
              key={proyecto.id}
              value={proyecto.id}
            >
              {proyecto.acronimo} — {proyecto.nombre}
            </option>

          ))}

        </select>

        <label htmlFor="tarea">
          Tarea
        </label>

        <select
          id="tarea"
          value={tareaId}
          required
          disabled={!proyectoId || guardando}
          onChange={(evento) => {
            setTareaId(evento.target.value);
          }}
        >

          <option value="">
            Selecciona una tarea
          </option>

          {tareas.map((tarea) => (

            <option
              key={tarea.id}
              value={tarea.id}
            >
              {tarea.nombre}
            </option>

          ))}

        </select>

        <label htmlFor="fecha">
          Fecha de trabajo
        </label>

        <input
          id="fecha"
          type="date"
          value={fecha}
          required
          disabled={guardando}
          onChange={(evento) => {
            setFecha(evento.target.value);
          }}
        />

        <label htmlFor="horas">
          Horas dedicadas
        </label>

        <input
          id="horas"
          type="number"
          min="0.01"
          max="24"
          step="0.01"
          placeholder="Ej. 4.5"
          value={horas}
          required
          disabled={guardando}
          onChange={(evento) => {
            setHoras(evento.target.value);
          }}
        />

        <label htmlFor="descripcion">
          Descripción (opcional)
        </label>

        <textarea
          id="descripcion"
          rows="4"
          placeholder="Describe el trabajo realizado..."
          value={descripcion}
          disabled={guardando}
          onChange={(evento) => {
            setDescripcion(evento.target.value);
          }}
        />

        {error && (
          <p className="gm-error" role="alert">
            {error}
          </p>
        )}

        <button
          className="gm-button"
          type="submit"
          disabled={guardando || cargando}
        >
          {guardando
            ? "Guardando horas..."
            : "Guardar horas"}
        </button>

      </form>

    </main>
  );
}

export default RegistroHoras;