import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Estimate.css";
import { Edit, Trash2 } from "lucide-react";

function Estimate_Generation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const estimates = [
    { id: 1, name: "Project A", amount: "$5000", date: "2025-03-04" },
    { id: 2, name: "Project B", amount: "$7500", date: "2025-03-01" },
    { id: 3, name: "Project C", amount: "$3200", date: "2025-02-27" },
  ];

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <TopNavbar />

        {/* Card Container */}
        <div className="card-container">
          <div className="card">
            <h2>Estimate List</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Estimated Amount</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {estimates.map((estimate, index) => (
                    <tr key={estimate.id}>
                      <td>{index + 1}</td>
                      <td>{estimate.name}</td>
                      <td>{estimate.amount}</td>
                      <td>{estimate.date}</td>
                      <td>
                        <button className="edit-btn">
                          <Edit size={20} color="blue" />
                        </button>
                        <button className="delete-btn">
                          <Trash2 size={20} color="red" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
                  
      </div>
    </div>
  );
}

export default Estimate_Generation;
