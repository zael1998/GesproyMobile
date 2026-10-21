import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  FolderKanban,
  CalendarDays,
  Clock3,
  UserRound,
} from "lucide-react";


function Navegacion() {

  const location = useLocation();

  // No mostramos el menú en el login.
  if (location.pathname === "/login") {
    return null;
  }

  return (
    <nav
      className="gm-bottom-nav"
      aria-label="Navegación principal"
    >

      <NavLink
        to="/proyectos"
        className={({ isActive }) =>
          `gm-nav-item ${isActive ? "gm-nav-active" : ""}`
        }
      >

        <FolderKanban size={23} />

        <span>Proyectos</span>

      </NavLink>


      <NavLink
        to="/calendario"
        className={({ isActive }) =>
          `gm-nav-item ${isActive ? "gm-nav-active" : ""}`
        }
      >

        <CalendarDays size={23} />

        <span>Calendario</span>

      </NavLink>


      <NavLink
        to="/horas"
        className={({ isActive }) =>
          `gm-nav-item ${isActive ? "gm-nav-active" : ""}`
        }
      >

        <Clock3 size={23} />

        <span>Mis horas</span>

      </NavLink>


      <NavLink
        to="/perfil"
        className={({ isActive }) =>
          `gm-nav-item ${isActive ? "gm-nav-active" : ""}`
        }
      >

        <UserRound size={23} />

        <span>Perfil</span>

      </NavLink>

    </nav>
  );
}

export default Navegacion;