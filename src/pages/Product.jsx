import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Product.css";
import { Box, Layers } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

function Product() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
  }, [navigate]);

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
          <h1>Materials Management</h1>
          <p>Manage your materials and categories efficiently</p>
        </div>
        <div className="card-container">
          <Link to="/prod_Managment" className="card-link">
            <div className="card">
              <div className="card-icon materials-icon">
                <Box size={32} />
              </div>
              <h3>Materials<br />Management</h3>
              <p>Manage your materials, inventory, and pricing</p>
              <button className="manage-button">Manage Materials</button>
            </div>
          </Link>

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
        </div>
      </div>
    </div>
  );
}

export default Product;
