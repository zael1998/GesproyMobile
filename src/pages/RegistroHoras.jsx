import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { obtenerMisProyectos, obtenerTareasProyecto, registrarPeriodos } from "../services/api";

function fechaLocal() {
  const hoy = new Date();
  return [hoy.getFullYear(), String(hoy.getMonth() + 1).padStart(2, "0"),
    String(hoy.getDate()).padStart(2, "0")].join("-");
}

function Fila({ fila, numero, proyectos, actualizar, quitar, bloqueada, maximo, onError }) {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(Boolean(fila.proyecto));
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelado = false;
    if (!fila.proyecto) return;
    obtenerTareasProyecto(fila.proyecto).then(datos => {
      if (!cancelado) setTareas(datos.tareas.filter(t => t.puede_imputar));
    }).catch(e => {
      if (!cancelado) {
        setError(e.message);
        onError(e);
      }
    }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [fila.proyecto, onError]);
  const opciones = tareas;
  return (
    <fieldset className="gm-imputacion">
      <legend>Imputación {numero}</legend>
      {quitar && <button type="button" className="gm-button-secondary" disabled={bloqueada} onClick={quitar}>Quitar</button>}
      <label htmlFor={`proyecto-${fila.id}`}>Proyecto</label>
      <select id={`proyecto-${fila.id}`} required disabled={bloqueada} value={fila.proyecto}
        onChange={e => {
          setTareas([]); setError(""); setCargando(Boolean(e.target.value));
          actualizar({ proyecto: e.target.value, tarea: "" });
        }}>
        <option value="">Selecciona un proyecto</option>
        {proyectos.map(p => <option key={p.id} value={p.id}>{p.acronimo} — {p.nombre}</option>)}
      </select>
      <label htmlFor={`tarea-${fila.id}`}>Tarea</label>
      <select id={`tarea-${fila.id}`} required disabled={bloqueada || !fila.proyecto || cargando}
        value={fila.tarea} onChange={e => actualizar({ tarea: e.target.value })}>
        <option value="">{cargando ? "Cargando tareas..." : "Selecciona una tarea"}</option>
        {opciones.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
      </select>
      {error && <p className="gm-error" role="alert">{error}</p>}
      <label htmlFor={`horas-${fila.id}`}>Horas totales</label>
      <input id={`horas-${fila.id}`} type="number" required min="0.01" max={maximo}
        step="0.01" value={fila.horas} disabled={bloqueada} onChange={e => actualizar({ horas: e.target.value })}/>
      <label htmlFor={`desc-${fila.id}`}>Descripción (opcional)</label>
      <textarea id={`desc-${fila.id}`} rows="3" value={fila.descripcion} disabled={bloqueada}
        onChange={e => actualizar({ descripcion: e.target.value })}/>
    </fieldset>
  );
}

function RegistroHoras() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [proyectos, setProyectos] = useState([]);
  const [fecha, setFecha] = useState(params.get("fecha") || fechaLocal());
  const [fechaFin, setFechaFin] = useState("");
  const [esPeriodo, setEsPeriodo] = useState(false);
  const [filas, setFilas] = useState([{ id: 1, proyecto: params.get("proyecto") || "",
    tarea: params.get("tarea") || "", horas: "", descripcion: "" }]);
  const siguienteId = useRef(2);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelado = false;
    obtenerMisProyectos().then(datos => {
      if (!cancelado) setProyectos(datos.proyectos.filter(p => p.estado === "PROCESO"));
    }).catch(e => {
      if (cancelado) return;
      if (e.status === 401) navigate("/login", { replace: true });
      else setError(e.message);
    }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [navigate]);
  const gestionarError = useCallback(e => {
    if (e.status === 401) navigate("/login", { replace: true });
  }, [navigate]);
  function actualizarFila(id, cambio) {
    setFilas(lista => lista.map(f => f.id === id ? { ...f, ...cambio } : f));
  }
  function añadirFila() {
    const id = siguienteId.current++;
    setFilas(lista => lista.length < 4 ? [...lista, { id, proyecto: "", tarea: "", horas: "", descripcion: "" }] : lista);
  }
  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;
    setError("");
    if (!fecha || fecha > fechaLocal() || (esPeriodo && (!fechaFin || fechaFin <= fecha ||
      fechaFin > fechaLocal() || fecha.slice(0, 7) !== fechaFin.slice(0, 7)))) {
      setError("Comprueba las fechas: el periodo debe tener dos fechas del mismo mes y no puede ser futuro.");
      return;
    }
    if (filas.some(f => !f.proyecto || !f.tarea || !f.horas)) {
      setError("Completa todas las imputaciones."); return;
    }
    setGuardando(true);
    try {
      const resultado = await registrarPeriodos({ fecha, fecha_fin: esPeriodo ? fechaFin : null,
        registros: filas.map(({ proyecto, tarea, horas, descripcion }) => ({
          proyecto: Number(proyecto), tarea: Number(tarea), horas, descripcion,
        })) });
      navigate(`/horas?mes=${fecha.slice(0, 7)}`, { replace: true,
        state: { mensaje: resultado.mensaje, aviso: resultado.aviso } });
    } catch (e) {
      if (e.status === 401) navigate("/login", { replace: true });
      else setError(e.message);
    } finally { setGuardando(false); }
  }
  return (
    <main className="gm-shell">
      <Link to="/horas" className="gm-back">← Volver a mis horas</Link>
      <header className="gm-header"><div><p className="gm-eyebrow">GESPROY · CESGA</p>
        <h1>Registrar horas</h1><p className="gm-subtitle">Un día o un periodo del mismo mes.</p></div></header>
      <form className="gm-form-card" onSubmit={guardar}>
        <label htmlFor="tipo">Tipo de registro</label>
        <select id="tipo" value={esPeriodo ? "periodo" : "dia"} disabled={guardando}
          onChange={e => { setEsPeriodo(e.target.value === "periodo"); setFechaFin(""); }}>
          <option value="dia">Un día</option><option value="periodo">Periodo</option>
        </select>
        <label htmlFor="fecha">Fecha de inicio</label>
        <input id="fecha" type="date" required max={fechaLocal()} value={fecha} disabled={guardando}
          onChange={e => setFecha(e.target.value)}/>
        {esPeriodo && <><label htmlFor="fecha-fin">Fecha final</label>
          <input id="fecha-fin" type="date" required min={fecha} max={fechaLocal()} value={fechaFin}
            disabled={guardando} onChange={e => setFechaFin(e.target.value)}/>
          <p className="gm-subtitle">Las horas son el total del periodo, sin distribuirlas por días.</p></>}
        {filas.map((fila, i) => <Fila key={fila.id} fila={fila} numero={i + 1} proyectos={proyectos}
          actualizar={cambio => actualizarFila(fila.id, cambio)} bloqueada={guardando || cargando}
          quitar={filas.length > 1 ? () => setFilas(lista => lista.filter(f => f.id !== fila.id)) : null}
          maximo={esPeriodo ? 744 : 24} onError={gestionarError}/>)}
        <button type="button" className="gm-button-secondary" disabled={guardando || cargando || filas.length >= 4}
          onClick={añadirFila}>+ Añadir imputación ({filas.length}/4)</button>
        {error && <p className="gm-error" role="alert">{error}</p>}
        <button className="gm-button" disabled={guardando || cargando} type="submit">
          {guardando ? "Guardando..." : "Guardar imputaciones"}</button>
      </form>
    </main>
  );
}
export default RegistroHoras;