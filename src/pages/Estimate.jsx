import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Client.css";
import { Cog, PlusCircle } from "lucide-react";
import {Link} from "react-router-dom";

function Estimate() {
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
        {/* <TopNavbar /> */}
        <div class="card-container">
          <div class="card">
            <Cog size={50} />
            <h3>GENERATION</h3>
            <Link to="/estimate_generation">
            <button>Generate</button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Estimate;
