import { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  UserRound,
  IdCard,
  ShieldCheck,
  LogOut,
  Building2,
} from "lucide-react";

import {
  obtenerUsuarioActual,
  cerrarSesion,
} from "../services/api";


function Perfil() {

  const navigate = useNavigate();

  const [usuario, setUsuario] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const [error, setError] = useState("");


  // ==========================================
  // OBTENER USUARIO DE DJANGO
  // ==========================================

  useEffect(() => {

    let cancelado = false;

    async function cargarPerfil() {

      setCargando(true);
      setError("");

      try {

        const datos = await obtenerUsuarioActual();

        if (!cancelado) {
          setUsuario(datos.usuario);
        }

      } catch (error) {

        if (cancelado) return;

        if (error.status === 401) {

          navigate("/login", {
            replace: true,
          });

          return;
        }

        setError(error.message);

      } finally {

        if (!cancelado) {
          setCargando(false);
        }

      }
    }

    cargarPerfil();

    return () => {
      cancelado = true;
    };

  }, [navigate]);


  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  async function manejarLogout() {

    setCerrandoSesion(true);
    setError("");

    try {

      await cerrarSesion();

      navigate("/login", {
        replace: true,
      });

    } catch (error) {

      setError(error.message);

    } finally {

      setCerrandoSesion(false);

    }
  }


  // ==========================================
  // DATOS DEL PERFIL
  // ==========================================

  const nombreCompleto = usuario
    ? [usuario.first_name, usuario.last_name]
        .filter(Boolean)
        .join(" ") || usuario.username
    : "";

  const iniciales = nombreCompleto
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");

  const nombreRol = usuario?.rol === "ADMIN"
    ? "Administrador"
    : usuario?.rol === "INVESTIGADOR"
      ? "Investigador"
      : "Usuario";


  return (
    <main className="gm-shell">

      <header className="gm-header">

        <div>

          <p className="gm-eyebrow">
            GESPROY · CESGA
          </p>

          <h1>Mi perfil</h1>

          <p className="gm-subtitle">
            Información de tu cuenta.
          </p>

        </div>

        <UserRound
          size={30}
          className="gm-header-icon"
        />

      </header>


      {cargando && (
        <p className="gm-message">
          Cargando perfil...
        </p>
      )}


      {error && (
        <p className="gm-error" role="alert">
          {error}
        </p>
      )}


      {!cargando && usuario && (

        <>

          {/* TARJETA PERSONAL */}

          <section className="gm-profile-card">

            <div className="gm-profile-avatar">
              {iniciales || "U"}
            </div>

            <h2>{nombreCompleto}</h2>

            <span className="gm-pill gm-pill-blue">
              {nombreRol}
            </span>

            <p>
              Cuenta de usuario de Gesproy
            </p>

          </section>


          {/* INFORMACIÓN DE LA CUENTA */}

          <section className="gm-profile-information">

            <h2>Datos de la cuenta</h2>

            <div className="gm-profile-field">

              <IdCard size={20} />

              <div>
                <span>Nombre de usuario</span>
                <strong>{usuario.username}</strong>
              </div>

            </div>

            <div className="gm-profile-field">

              <UserRound size={20} />

              <div>
                <span>Nombre completo</span>
                <strong>{nombreCompleto}</strong>
              </div>

            </div>

            <div className="gm-profile-field">

              <ShieldCheck size={20} />

              <div>
                <span>Rol</span>
                <strong>{nombreRol}</strong>
              </div>

            </div>

            <div className="gm-profile-field">

              <Building2 size={20} />

              <div>
                <span>Aplicación</span>
                <strong>Gesproy · CESGA</strong>
              </div>

            </div>

          </section>


          {/* CERRAR SESIÓN */}

          <button
            type="button"
            className="gm-profile-logout"
            onClick={manejarLogout}
            disabled={cerrandoSesion}
          >

            <LogOut size={20} />

            {cerrandoSesion
              ? "Cerrando sesión..."
              : "Cerrar sesión"}

          </button>

        </>

      )}

    </main>
  );
}

export default Perfil;