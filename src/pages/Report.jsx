import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Client.css";
import { UserPlus, Pencil, HandCoins, NotebookTabs } from "lucide-react";

function Report() {
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
            <UserPlus size={50} />
            <h3>ADD CLIENT</h3>
            <button>Add</button>
          </div>

          <div class="card">
            <Pencil size={50} />
            <h3>UPDATE CLIENT</h3>
            <button style={{ backgroundColor: "#FFA500" }}>Update</button>
          </div>

          <div class="card">
            <HandCoins size={50} />
            <h3>PAYMENT</h3>
            <button style={{ backgroundColor: "#007BFF" }}>Payment</button>
          </div>
          <div class="card">
            <NotebookTabs size={50} />
            <h3>CLIENT REPORT</h3>
            <button style={{ backgroundColor: "#8B0000" }}>Add</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;
