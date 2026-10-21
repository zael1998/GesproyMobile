// ==========================================
// API DE GESPROY MÓVIL
// ==========================================

const API_BASE = "/api";

let csrfToken = null;


// ==========================================
// PROCESAR RESPUESTAS
// ==========================================

async function procesarRespuesta(respuesta) {

  const datos = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {

    let mensaje =
      datos?.error ||
      `Error de comunicación (${respuesta.status})`;

    if (datos?.campos) {

      const errores = Object.values(datos.campos)
        .flat()
        .map((item) => item.message);

      if (errores.length > 0) {
        mensaje = errores.join(" ");
      }
    }

    const error = new Error(mensaje);
    error.status = respuesta.status;

    throw error;
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
      credentials: "same-origin",
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
      credentials: "same-origin",

      ...opciones,

      headers: {
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
// REGISTRO DE HORAS
// ==========================================

export function registrarHoras(datos) {

  return peticion("/horas/registrar/", {
    method: "POST",
    body: JSON.stringify(datos),
  });
}


// ==========================================
// HISTORIAL DE HORAS
// ==========================================

export function obtenerMisHoras(mes) {

  return peticion(
    `/horas/?mes=${encodeURIComponent(mes)}`
  );
}