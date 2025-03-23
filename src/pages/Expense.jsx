import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Client.css";
import { Cog, PlusCircle } from "lucide-react";

function Expense() {
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
            <Cog size={50} />
            <h3>GENERATION</h3>
            <button>Add</button>
          </div>

          <div class="card">
            <PlusCircle size={50} />
            <h3>PRESET CREATION</h3>
            <button style={{ backgroundColor: "#FFA500" }}>Update</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Expense;
