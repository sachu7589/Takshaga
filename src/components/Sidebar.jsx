// Sidebar Component
import { NavLink, useNavigate } from "react-router-dom";
import { Home, LogOut, Database, Users, Package, BookOpen, BadgeIndianRupee, CreditCard, ChartNoAxesCombined, SlidersHorizontal } from "lucide-react";
import Swal from 'sweetalert2';

const Sidebar = ({ isOpen }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You want to logout?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        // Clear session storage
        sessionStorage.clear();
        
        // Show toast notification instead of modal
        Swal.fire({
          toast: true,
          position: 'top-end',
          icon: 'success',
          title: 'Logged out successfully!',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true
        });
        
        // Navigate to login page immediately
        navigate('/');
      }
    });
  };

  return (
    <div className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        Takshaga
      </div>
      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink
              to="/dashboard"
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
              to="/client"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Users size={20} />
              Client
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/product"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Package size={20} />
              Sections
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/estimate"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <BookOpen size={20}/>
              Estimate
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/additional-income"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <BadgeIndianRupee size={20}/>
              Additional Income
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/expense"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <CreditCard size={20}/>
              Expenses
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/report"
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <ChartNoAxesCombined size={20}/>
              Report
            </NavLink>
          </li>
        </ul>
      </nav>
      <div className="logout-section">
        <button
          className="logout-button"
          onClick={handleLogout}
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;