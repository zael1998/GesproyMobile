// ==========================================
// API DE GESPROY MÓVIL
// ==========================================

const API_BASE = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

let csrfToken = null;


// ==========================================
// PROCESAR RESPUESTAS
// ==========================================

async function procesarRespuesta(respuesta) {

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {

    let mensaje =
      datos?.error ||
      datos?.detail ||
      `Error de comunicación (${respuesta.status})`;

    if (datos?.campos) {

      const errores = Object.values(datos.campos)
        .flat()
        .map((item) => item?.message || String(item));

      if (errores.length > 0) {
        mensaje = errores.join(" ");
      }
    }

    const error = new Error(mensaje);

    error.status = respuesta.status;

    throw error;
  }

  if (datos === null && respuesta.status !== 204) {
    throw new Error(
      "El servidor no devolvió una respuesta JSON válida."
    );
  }

  return datos;
}


// ==========================================
// TOKEN CSRF
// ==========================================

export async function obtenerCsrf() {

  const respuesta = await fetch(
    `${API_BASE}/csrf/`,
    {
      credentials: "include",
      cache: "no-store",
    }
  );

  const datos = await procesarRespuesta(respuesta);

  csrfToken = datos.csrfToken;

  return csrfToken;
}


// ==========================================
// PETICIONES GENERALES
// ==========================================

async function peticion(ruta, opciones = {}) {

  const metodo = (opciones.method || "GET").toUpperCase();

  const requiereCsrf = ![
    "GET",
    "HEAD",
    "OPTIONS",
  ].includes(metodo);

  if (requiereCsrf && !csrfToken) {
    await obtenerCsrf();
  }

  const respuesta = await fetch(
    `${API_BASE}${ruta}`,
    {
      credentials: "include",
      cache: "no-store",

      ...opciones,

      headers: {
        Accept: "application/json",

        ...(opciones.body
          ? { "Content-Type": "application/json" }
          : {}),

        ...(requiereCsrf
          ? { "X-CSRFToken": csrfToken }
          : {}),

        ...opciones.headers,
      },
    }
  );

  return procesarRespuesta(respuesta);
}


// ==========================================
// AUTENTICACIÓN
// ==========================================

export async function iniciarSesion(username, password) {

  const datos = await peticion("/login/", {
    method: "POST",

    body: JSON.stringify({
      username,
      password,
    }),
  });

  csrfToken = null;

  await obtenerCsrf();

  return datos;
}


export async function cerrarSesion() {

  const datos = await peticion("/logout/", {
    method: "POST",
  });

  csrfToken = null;

  return datos;
}


export function obtenerUsuarioActual() {

  return peticion("/usuario/");
}


// ==========================================
// PROYECTOS
// ==========================================

export function obtenerMisProyectos(soloResponsable = false) {

  const filtro = soloResponsable
    ? "?solo_responsable=1"
    : "";

  return peticion(`/mis-proyectos/${filtro}`);
}


export function obtenerDetalleProyecto(id) {

  return peticion(
    `/proyectos/${encodeURIComponent(id)}/`
  );
}


// ==========================================
// TAREAS
// ==========================================

export function obtenerTareasProyecto(proyectoId) {

  return peticion(
    `/proyectos/${encodeURIComponent(proyectoId)}/tareas/`
  );
}


// ==========================================
// REGISTRAR HORAS INDIVIDUALES
// ==========================================

export function registrarHoras(datos) {

  return peticion("/horas/registrar/", {
    method: "POST",

    body: JSON.stringify(datos),
  });
}


// ==========================================
// REGISTRAR HORAS POR PERIODOS
// ==========================================

export function registrarHorasPeriodo(datos) {

  return peticion("/horas/periodos/", {
    method: "POST",

    body: JSON.stringify(datos),
  });
}


// Compatibilidad con RegistroHoras.jsx

export const registrarPeriodos = registrarHorasPeriodo;

export const registrarHorasPorPeriodo = registrarHorasPeriodo;

export const registrarHorasPorPeriodos = registrarHorasPeriodo;

export const registrarPeriodoHoras = registrarHorasPeriodo;


// ==========================================
// HISTORIAL DE HORAS
// ==========================================

export function obtenerMisHoras(mes) {

  const filtro = mes
    ? `?mes=${encodeURIComponent(mes)}`
    : "";

  return peticion(`/horas/${filtro}`);
}


// ==========================================
// CONSULTAR REGISTRO
// ==========================================

export function obtenerRegistroHoras(registroId) {

  return peticion(
    `/horas/${encodeURIComponent(registroId)}/`
  );
}


// ==========================================
// EDITAR REGISTRO
// ==========================================

export function editarRegistroHoras(registroId, datos) {

  return peticion(
    `/horas/${encodeURIComponent(registroId)}/`,
    {
      method: "PATCH",

      body: JSON.stringify(datos),
    }
  );
}


// ==========================================
// ELIMINAR REGISTRO
// ==========================================

export function eliminarRegistroHoras(registroId) {

  return peticion(
    `/horas/${encodeURIComponent(registroId)}/`,
    {
      method: "DELETE",
    }
  );
}


// ==========================================
// COMPATIBILIDAD CON COMPONENTES
// ==========================================

export const obtenerRegistro = obtenerRegistroHoras;

export const editarRegistro = editarRegistroHoras;

export const editarHoras = editarRegistroHoras;

export const actualizarRegistro = editarRegistroHoras;

export const actualizarRegistroHoras = editarRegistroHoras;

export const eliminarHoras = eliminarRegistroHoras;

export const eliminarRegistro = eliminarRegistroHoras;