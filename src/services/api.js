const API_BASE = "/api";
let csrfToken = null;

function mensajes(valor) {
  if (typeof valor === "string") return [valor];
  if (Array.isArray(valor)) return valor.flatMap(mensajes);
  if (valor && typeof valor === "object") {
    if (typeof valor.message === "string") return [valor.message];
    return Object.values(valor).flatMap(mensajes);
  }
  return [];
}

async function procesarRespuesta(respuesta) {
  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok || datos === null) {
    const campos = mensajes(datos?.campos);
    const mensaje = [datos?.error || datos?.detail ||
      (respuesta.ok ? "Django no ha devuelto JSON. Revisa el proxy." :
        `Error de comunicación (${respuesta.status})`), ...campos].join(" ");
    const error = new Error(mensaje);
    error.status = respuesta.status;
    error.campos = datos?.campos;
    throw error;
  }
  return datos;
}

export async function obtenerCsrf() {
  const respuesta = await fetch(`${API_BASE}/csrf/`, {
    credentials: "same-origin", cache: "no-store",
  });
  const datos = await procesarRespuesta(respuesta);
  csrfToken = datos.csrfToken;
  if (!csrfToken) throw new Error("No se recibió el token CSRF.");
  return csrfToken;
}

async function peticion(ruta, opciones = {}) {
  const metodo = (opciones.method || "GET").toUpperCase();
  const requiereCsrf = !["GET", "HEAD", "OPTIONS"].includes(metodo);
  if (requiereCsrf && !csrfToken) await obtenerCsrf();
  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    ...opciones,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
      ...(opciones.body ? { "Content-Type": "application/json" } : {}),
      ...(requiereCsrf ? { "X-CSRFToken": csrfToken } : {}),
      ...opciones.headers,
    },
  });
  if (respuesta.status === 403 || respuesta.status === 401) csrfToken = null;
  return procesarRespuesta(respuesta);
}

export async function iniciarSesion(username, password) {
  await obtenerCsrf();
  const datos = await peticion("/login/", {
    method: "POST", body: JSON.stringify({ username, password }),
  });
  csrfToken = datos.csrfToken || null;
  if (!csrfToken) await obtenerCsrf();
  return datos;
}

export async function cerrarSesion() {
  const datos = await peticion("/logout/", { method: "POST" });
  csrfToken = null;
  return datos;
}
export const obtenerUsuarioActual = () => peticion("/usuario/");
export const obtenerMisProyectos = (soloResponsable = false) =>
  peticion(`/mis-proyectos/${soloResponsable ? "?solo_responsable=1" : ""}`);
export const obtenerDetalleProyecto = (id) => peticion(`/proyectos/${encodeURIComponent(id)}/`);
export const obtenerTareasProyecto = (id) => peticion(`/proyectos/${encodeURIComponent(id)}/tareas/`);
export const registrarHoras = (datos) => peticion("/horas/registrar/", {
  method: "POST", body: JSON.stringify(datos),
});
export const registrarPeriodos = (datos) => peticion("/horas/periodos/", {
  method: "POST", body: JSON.stringify(datos),
});
export const obtenerMisHoras = (mes) =>
  peticion(`/horas/${mes ? "?mes=" + encodeURIComponent(mes) : ""}`);
export const obtenerRegistro = (id) => peticion(`/horas/${encodeURIComponent(id)}/`);
export const editarRegistro = (id, datos) => peticion(`/horas/${encodeURIComponent(id)}/`, {
  method: "PATCH", body: JSON.stringify(datos),
});
export const eliminarRegistro = (id) => peticion(`/horas/${encodeURIComponent(id)}/`, {
  method: "DELETE",
});