import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Plus } from "lucide-react";
import { obtenerMisHoras } from "../services/api";

function formatearFecha(fecha) {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`;
}
const formatearHoras = horas => Number(horas).toLocaleString("es-ES", { maximumFractionDigits: 2 });
function obtenerDiasMes(mes) {
  const [anio, numero] = mes.split("-").map(Number);
  const huecos = (new Date(anio, numero - 1, 1).getDay() + 6) % 7;
  const cantidad = new Date(anio, numero, 0).getDate();
  return [...Array(huecos).fill(null), ...Array.from({ length: cantidad }, (_, i) =>
    `${mes}-${String(i + 1).padStart(2, "0")}`)];
}
function Calendario() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const hoy = formatearFecha(new Date());
  const actual = hoy.slice(0, 7);
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get("mes") || "") ? params.get("mes") : actual;
  const [anio, numeroMes] = mes.split("-").map(Number);
  const [datos, setDatos] = useState(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState(mes === actual ? hoy : `${mes}-01`);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelado = false;
    obtenerMisHoras(mes).then(res => {
      if (!cancelado) {
        setDatos(res); setError("");
        setDiaSeleccionado(mes === actual ? hoy : `${mes}-01`);
      }
    }).catch(e => {
      if (cancelado) return;
      if (e.status === 401) navigate("/login", { replace: true });
      else { setError(e.message); setDatos(null); }
    }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [mes, navigate, actual, hoy]);
  function cambiarMes(delta) {
    const siguiente = formatearFecha(new Date(anio, numeroMes - 1 + delta, 1)).slice(0, 7);
    if (siguiente < "2000-01" || siguiente > "2099-12") return;
    setCargando(true); setError(""); setParams({ mes: siguiente });
  }
  const registros = datos?.registros || [];
  const horasPorDia = {};
  for (const r of registros) {
    // Los periodos NO se suman al día inicial ni se reparten.
    if (!r.fecha_fin) horasPorDia[r.fecha] = (horasPorDia[r.fecha] || 0) + Number(r.horas);
  }
  const periodos = registros.filter(r => r.fecha_fin);
  const registrosDia = registros.filter(r => r.fecha <= diaSeleccionado &&
    (r.fecha_fin || r.fecha) >= diaSeleccionado);
  const fecha = new Date(diaSeleccionado + "T00:00:00");
  const laborable = ![0, 6].includes(fecha.getDay());
  return (
    <main className="gm-shell">
      <header className="gm-header"><div><p className="gm-eyebrow">GESPROY · CESGA</p><h1>Calendario</h1>
        <p className="gm-subtitle">Consulta tus horas y periodos.</p></div><CalendarDays size={30} className="gm-header-icon"/></header>
      {!cargando && !error && datos && <section className="gm-calendar-summary">
        <div><span>Horas registradas este mes</span><strong>{formatearHoras(datos.total_horas)} h</strong>
        <span>Capacidad orientativa: {formatearHoras(datos.capacidad_mensual)} h</span></div><Clock3 size={30}/>
      </section>}
      <section className="gm-calendar-card">
        <div className="gm-calendar-toolbar">
          <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior"><ChevronLeft size={21}/></button>
          <h2>{new Date(anio, numeroMes - 1, 1).toLocaleDateString("es-ES", { month: "long", year: "numeric" })}</h2>
          <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente"><ChevronRight size={21}/></button>
        </div>
        <div className="gm-calendar-grid">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => <span className="gm-calendar-weekday" key={d}>{d}</span>)}
          {obtenerDiasMes(mes).map((dia, i) => {
            if (!dia) return <div key={`vacio-${i}`} className="gm-calendar-empty-day"/>;
            const horas = horasPorDia[dia] || 0;
            const tienePeriodo = periodos.some(r => r.fecha <= dia && r.fecha_fin >= dia);
            return <button key={dia} type="button" disabled={cargando || Boolean(error)}
              aria-pressed={dia === diaSeleccionado} aria-label={dia + (tienePeriodo ? ", con periodo" : "")}
              className={["gm-calendar-day", horas > 0 ? "gm-day-worked" : "", tienePeriodo ? "gm-day-periodo" : "",
                dia === hoy ? "gm-day-today" : "", dia === diaSeleccionado ? "gm-day-selected" : ""].join(" ")}
              onClick={() => setDiaSeleccionado(dia)}>
              <span>{Number(dia.slice(-2))}</span>{horas > 0 && <small>{formatearHoras(horas)} h</small>}
              {tienePeriodo && <small className="gm-periodo-indicador">Periodo</small>}</button>;
          })}
        </div>
        <p className="gm-subtitle">Los días con periodo indican pertenencia al intervalo; sus horas no se suman por día.</p>
      </section>
      {cargando && <p className="gm-message">Cargando calendario...</p>}
      {error && <p className="gm-error" role="alert">{error}</p>}
      {!cargando && !error && <section className="gm-calendar-detail">
        <h2>{fecha.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}</h2>
        {registrosDia.length === 0 && <p className="gm-message">No tienes registros este día.</p>}
        {registrosDia.map(r => <article className="gm-calendar-entry" key={r.id}>
          <div><strong>{r.proyecto.acronimo}</strong><p>{r.tarea.nombre}</p>
            {r.fecha_fin && <p>{r.fecha} — {r.fecha_fin} · Total del periodo</p>}
            <span className={`gm-pill ${r.validado ? "gm-pill-green" : "gm-pill-amber"}`}>{r.validado ? "Validado" : "Pendiente"}</span>
            <p><Link to={`/horas/${r.id}/editar`} className="gm-back gm-calendar-link">Ver registro</Link></p>
          </div><b>{formatearHoras(r.horas)} h</b>
        </article>)}
        {diaSeleccionado <= hoy && laborable && <Link to={`/horas/nuevo?fecha=${diaSeleccionado}`} className="gm-button gm-link-button gm-calendar-add">
          <Plus size={19}/> Registrar horas este día</Link>}
      </section>}
    </main>
  );
}
export default Calendario;
