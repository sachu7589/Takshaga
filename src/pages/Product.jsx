import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Product.css";
import { Layers, FolderTree, FolderKanban } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from '../context/AuthContext';

function Product() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
  }, [navigate, user]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="product-header">
          <h1>Sections Management</h1>
          <p>Manage your sections and categories efficiently</p>
        </div>
        <div className="card-container">
          <Link to="/cat_Managment" className="card-link">
            <div className="card">
              <div className="card-icon category-icon">
                <Layers size={32} />
              </div>
              <h3>Category<br />Management</h3>
              <p>Organize and manage material categories</p>
              <button className="manage-button">Manage Categories</button>
            </div>
          </Link>

          <Link to="/subcat_Managment" className="card-link">
            <div className="card">
              <div className="card-icon subcategory-icon">
                <FolderTree size={32} />
              </div>
              <h3>Sub Category<br />Management</h3>
              <p>Manage and organize sub-categories</p>
              <button className="manage-button">Manage Sub Categories</button>
            </div>
          </Link>

          <Link to="/sections_Managment" className="card-link">
            <div className="card">
              <div className="card-icon sections-icon">
                <FolderKanban size={32} />
              </div>
              <h3>Sections<br />Management</h3>
              <p>Organize and manage sections</p>
              <button className="manage-button">Manage Sections</button>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Product;
