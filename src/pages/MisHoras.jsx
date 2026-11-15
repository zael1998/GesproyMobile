import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { obtenerMisHoras } from "../services/api";

const formato = valor => Number(valor).toLocaleString("es-ES", { maximumFractionDigits: 2 });
function MisHoras() {
  const navigate = useNavigate();
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const hoy = new Date();
  const actual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`;
  const mes = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.get("mes") || "") ? params.get("mes") : actual;
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelado = false;
    obtenerMisHoras(mes).then(respuesta => {
      if (!cancelado) { setDatos(respuesta); setError(""); }
    }).catch(e => {
      if (cancelado) return;
      if (e.status === 401) navigate("/login", { replace: true });
      else setError(e.message);
    }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [mes, navigate]);
  const registros = datos?.registros || [];
  return (
    <main className="gm-shell">
      <header className="gm-header"><div><p className="gm-eyebrow">GESPROY · CESGA</p>
        <h1>Mis horas</h1><p className="gm-subtitle">Consulta tus registros de trabajo.</p></div></header>
      {location.state?.mensaje && <p className="gm-success" role="status">{location.state.mensaje}</p>}
      {location.state?.aviso && <p className="gm-warning" role="status">{location.state.aviso}</p>}
      <section className="gm-month-filter"><label htmlFor="mes">Selecciona el mes</label>
        <input id="mes" type="month" min="2000-01" max="2099-12" value={mes}
          onChange={e => { if (e.target.value) { setCargando(true); setError(""); setParams({ mes: e.target.value }); } }}/></section>
      {!cargando && !error && datos && <section className="gm-hours-summary">
        <span>Total de horas del mes</span><strong>{formato(datos.total_horas)} h</strong>
        <div className="gm-metricas"><div>Capacidad orientativa<b>{formato(datos.capacidad_mensual)} h</b></div>
          <div>Horas disponibles<b>{formato(datos.horas_disponibles)} h</b></div></div>
        <span>{datos.aviso_capacidad}</span>
        {!datos.control_mensual_activo && <span>El límite mensual no está activo.</span>}
      </section>}
      <Link to="/horas/nuevo" className="gm-button gm-link-button">+ Registrar horas</Link>
      <h2 className="gm-section-title">Horas registradas</h2>
      {cargando && <p className="gm-message">Cargando registros...</p>}
      {error && <p className="gm-error" role="alert">{error}</p>}
      {!cargando && !error && registros.length === 0 && <section className="gm-empty"><span>◷</span>
        <h2>Sin registros</h2><p>No has registrado horas durante este mes.</p></section>}
      {!cargando && !error && <section className="gm-hours-list">
        {registros.map(r => <article className="gm-hour-card" key={r.id}>
          <div className="gm-hour-heading"><div><strong>{r.proyecto.acronimo}</strong><p>{r.tarea.nombre}</p></div>
            <span className="gm-hour-amount">{formato(r.horas)} h</span></div>
          <div className="gm-hour-footer"><time dateTime={r.fecha}>{r.fecha}{r.fecha_fin ? " — " + r.fecha_fin : ""}</time>
            <span className={`gm-pill ${r.validado ? "gm-pill-green" : "gm-pill-amber"}`}>{r.validado ? "Validado" : "Pendiente"}</span></div>
          {r.fecha_fin && <p className="gm-small-label">Periodo · Horas totales</p>}
          {r.descripcion && <p className="gm-hour-description">{r.descripcion}</p>}
          <Link className="gm-button-secondary gm-link-button gm-edit-link" to={`/horas/${r.id}/editar`}>
            {r.validado ? "Ver registro" : "Ver / editar registro"}</Link>
        </article>)}
      </section>}
    </main>
  );
}
export default MisHoras;