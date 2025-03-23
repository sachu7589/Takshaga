import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Product.css";
import { Plus, Pencil, Trash2, CirclePlus } from "lucide-react";

 
function Cat_Managment() {
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
            <CirclePlus size={50} />
            <h3>ADD</h3>
            <button>Add</button>
          </div>

          <div class="card">
            <Pencil size={50} />
            <h3>UPDATE</h3>
            <button style={{ backgroundColor: "#FFA500" }}>Update</button>
          </div>
          
          <div class="card">
            <Trash2 size={50} />
            <h3>DELETE</h3>
            <button style={{ backgroundColor: "#8B0000" }}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cat_Managment;
