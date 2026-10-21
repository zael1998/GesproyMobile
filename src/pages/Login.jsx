import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { iniciarSesion } from "../services/api";


function Login() {

  const navigate = useNavigate();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");


  async function manejarLogin(evento) {

    evento.preventDefault();

    setError("");
    setCargando(true);

    try {

      await iniciarSesion(usuario, password);

      navigate("/proyectos", {
        replace: true,
      });

    } catch (error) {

      setError(error.message);

    } finally {

      setCargando(false);

    }
  }


  return (
    <main className="gm-auth">

      <section className="gm-login-panel">

        <div className="gm-login-brand">
          <span>CESGA</span>

          <h1>GESPROY</h1>

          <p>Gestión de proyectos de investigación</p>
        </div>

        <form onSubmit={manejarLogin}>

          <label htmlFor="usuario">
            Usuario
          </label>

          <input
            id="usuario"
            type="text"
            autoComplete="username"
            value={usuario}
            onChange={(evento) => {
              setUsuario(evento.target.value);
            }}
            required
          />

          <label htmlFor="password">
            Contraseña
          </label>

          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => {
              setPassword(evento.target.value);
            }}
            required
          />

          {error && (
            <p className="gm-error" role="alert">
              {error}
            </p>
          )}

          <button
            className="gm-button"
            type="submit"
            disabled={cargando}
          >
            {cargando
              ? "Iniciando sesión..."
              : "Iniciar sesión"}
          </button>

        </form>

      </section>

    </main>
  );
}

export default Login;