import {
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login.jsx";

import MisProyectos from "./pages/MisProyectos.jsx";
import DetalleProyecto from "./pages/DetalleProyecto.jsx";

import Tareas from "./pages/Tareas.jsx";

import RegistroHoras from "./pages/RegistroHoras.jsx";
import MisHoras from "./pages/MisHoras.jsx";

import Calendario from "./pages/Calendario.jsx";
import Perfil from "./pages/Perfil.jsx";

import Navegacion from "./components/Navegacion.jsx";

import "./styles/movil.css";
import "./styles/funcionalidades.css";
import "./styles/calendario-perfil.css";


function App() {

  return (
    <>

      <Routes>

        <Route
          path="/"
          element={
            <Navigate to="/login" replace />
          }
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/proyectos"
          element={<MisProyectos />}
        />

        <Route
          path="/proyectos/:id"
          element={<DetalleProyecto />}
        />

        <Route
          path="/proyectos/:id/tareas"
          element={<Tareas />}
        />

        <Route
          path="/horas"
          element={<MisHoras />}
        />

        <Route
          path="/horas/nuevo"
          element={<RegistroHoras />}
        />

        <Route
          path="/calendario"
          element={<Calendario />}
        />

        <Route
          path="/perfil"
          element={<Perfil />}
        />

        <Route
          path="*"
          element={
            <Navigate to="/login" replace />
          }
        />

      </Routes>

      <Navegacion />

    </>
  );
}

export default App;