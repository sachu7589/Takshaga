// Sidebar Component
import { NavLink } from "react-router-dom";
import { Home, LogOut, Database } from "lucide-react";

const Sidebar = ({ isOpen }) => {

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        Takshaga
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/user/dashboard"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Home size={20} />
               Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/user/database"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Database size={20} />
              Database
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="logout-section">
        <button
          className="logout-button"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;