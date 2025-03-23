import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Product.css";
import { PackageOpen, Layers2 } from "lucide-react";
import {Link} from "react-router-dom"

function Product() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div
      className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}
    >
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div
        className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <TopNavbar />
        <div class="card-container">
          <div class="card">
            <PackageOpen size={50} />
            <h3>Product Management</h3>
            <Link to="/prod_Managment">
            <button>Manage</button>
            </Link>
          </div>

          <div class="card">
            <Layers2 size={50} />
            <h3>Category Management</h3>
            <Link to="/cat_Managment">
            <button style={{ backgroundColor: "#FFA500" }}>Manage</button>
            </Link>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default Product;
