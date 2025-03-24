import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Client.css";
import { PlusCircle, Puzzle } from "lucide-react";

function Preset() {
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
            <Puzzle size={50} />
            <button>LOW</button>
          </div>

          <div class="card">
          <Puzzle size={50} />
            <button style={{ backgroundColor: "#FFA500" }}>MEDIUM</button>
          </div>
          <div class="card">
          <Puzzle size={50} />
            <button style={{ backgroundColor: "DarkRed" }}>PREMIUM</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Preset;
