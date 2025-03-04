import { useState } from 'react';
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Dashboard.css";


function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    return (
        <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
            <button className="hamburger" onClick={toggleSidebar}>
                &#9776;
            </button>
            <Sidebar isOpen={isSidebarOpen} />
            <div className={`dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
                <TopNavbar />
            <div className="card-container">
                <div className="card">
                    <div className="profile-icon">👤</div>
                    <div className="card-details">
                        <h3>Name: John Doe</h3>
                        <p>Number: 123-456-7890</p>
                        <p>Email: john.doe@example.com</p>
                    </div>
                </div>
                <div className="card">
                    <div className="profile-icon">👤</div>
                    <div className="card-details">
                        <h3>Name: Jane Smith</h3>
                        <p>Number: 987-654-3210</p>
                        <p>Email: jane.smith@example.com</p>
                    </div>
                </div>
                <div className="card">
                    <div className="profile-icon">👤</div>
                    <div className="card-details">
                        <h3>Name: Alice Johnson</h3>
                        <p>Number: 555-123-4567</p>
                        <p>Email: alice.johnson@example.com</p>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}

export default Dashboard;
