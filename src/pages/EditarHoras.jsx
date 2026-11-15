import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { obtenerRegistro, editarRegistro, eliminarRegistro } from "../services/api";

function EditarHoras() {
  const { registroId } = useParams();
  const navigate = useNavigate();
  const [datos, setDatos] = useState(null);
  const [form, setForm] = useState({ fecha: "", fecha_fin: "", horas: "", descripcion: "" });
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelado = false;
    obtenerRegistro(registroId).then(res => {
      if (cancelado) return;
      setDatos(res);
      const r = res.registro;
      setForm({ fecha: r.fecha, fecha_fin: r.fecha_fin || "", horas: r.horas, descripcion: r.descripcion || "" });
    }).catch(e => {
      if (cancelado) return;
      if (e.status === 401) navigate("/login", { replace: true });
      else setError(e.message);
    }).finally(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [registroId, navigate]);
  const registro = datos?.registro;
  const mes = registro?.fecha.slice(0, 7);
  const periodo = Boolean(registro?.fecha_fin);
  const editable = datos?.puede_editar && !ocupado;
  const volver = mes ? `/horas?mes=${mes}` : "/horas";
  function cambiar(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  async function operar(e, borrar = false) {
    e?.preventDefault();
    if (ocupado || !(borrar ? datos?.puede_eliminar : datos?.puede_editar)) return;
    if (borrar && !window.confirm("¿Eliminar definitivamente este registro de horas?")) return;
    if (!borrar && (form.fecha.slice(0, 7) !== mes ||
        (periodo && (form.fecha_fin <= form.fecha || form.fecha_fin.slice(0, 7) !== mes)))) {
      setError("Mantén las fechas dentro del mes original y la fecha final posterior a la inicial."); return;
    }
    setError(""); setOcupado(true);
    try {
      const res = borrar ? await eliminarRegistro(registroId) :
        await editarRegistro(registroId, { ...form, fecha_fin: periodo ? form.fecha_fin : null });
      navigate(volver, { replace: true, state: { mensaje: res.mensaje } });
    } catch (e) {
      if (e.status === 401) navigate("/login", { replace: true });
      else setError(e.message);
    } finally { setOcupado(false); }
  }
  return (
    <main className="gm-shell">
      <Link to={volver} className="gm-back">← Volver a mis horas</Link>
      <header className="gm-header"><div><p className="gm-eyebrow">GESPROY · CESGA</p><h1>Registro de horas</h1></div></header>
      {cargando && <p className="gm-message">Cargando registro...</p>}
      {error && <p className="gm-error" role="alert">{error}</p>}
      {registro && <form className="gm-form-card" onSubmit={operar}>
        <h2>{registro.proyecto.acronimo} — {registro.tarea.nombre}</h2>
        {!datos.puede_editar && <p className="gm-warning">Este registro no admite modificaciones.</p>}
        <label htmlFor="fecha">Fecha de inicio</label><input id="fecha" name="fecha" type="date" required disabled={!editable} value={form.fecha} onChange={cambiar}/>
        {periodo && <><label htmlFor="fecha_fin">Fecha final</label><input id="fecha_fin" name="fecha_fin" type="date" required min={form.fecha} disabled={!editable} value={form.fecha_fin} onChange={cambiar}/></>}
        <label htmlFor="horas">Horas totales</label><input id="horas" name="horas" type="number" min="0.01" max={periodo ? 744 : 24} step="0.01" required disabled={!editable} value={form.horas} onChange={cambiar}/>
        <label htmlFor="descripcion">Descripción</label><textarea id="descripcion" name="descripcion" rows="4" disabled={!editable} value={form.descripcion} onChange={cambiar}/>
        {datos.puede_editar && <button type="submit" className="gm-button" disabled={ocupado}>Guardar cambios</button>}
        {datos.puede_eliminar && <button type="button" className="gm-button gm-danger" disabled={ocupado} onClick={e => operar(e, true)}>Eliminar registro</button>}
      </form>}
    </main>
  );
}
export default EditarHoras;