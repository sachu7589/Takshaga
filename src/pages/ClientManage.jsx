import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";
import { Users, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';

function ClientManage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchClients();
  }, [navigate]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display`);
      if (response.data) {
        // Filter clients to show those with completed 0 AND status 1
        const filteredClients = response.data.filter(client => client.completed === 0 && client.status === 1);
        setClients(filteredClients);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch clients',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewDetails = (clientId) => {
    navigate(`/client-details/${clientId}`);
  };

  const getStatusIndicator = (stage) => {
    if (stage === 0) {
      return <div className="status-indicator estimate-pending">Estimate Pending</div>;
    } else {
      return <div className="status-indicator stage">Stage {stage}</div>;
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="client-manage-header">
          <h2>Client Management</h2>
        </div>
        <div className="client-cards-container">
          {clients.map((client) => (
            <div key={client._id} className="client-card">
              <div className="client-card-content">
                <div className="client-card-main">
                  <div className="client-card-icon">
                    <Users size={40} />
                  </div>
                  <div className="client-info">
                    <h3>{client.clientName}</h3>
                    <div className="client-details">
                      <div className="detail-item">
                        <Mail size={16} className="detail-icon" />
                        <span>{client.email}</span>
                      </div>
                      <div className="detail-item">
                        <Phone size={16} className="detail-icon" />
                        <span>{client.phoneNumber}</span>
                      </div>
                      <div className="detail-item">
                        <MapPin size={16} className="detail-icon" />
                        <span>{client.location}</span>
                      </div>
                      <div className="detail-item">
                        <Briefcase size={16} className="detail-icon" />
                        <span>{client.typeOfWork}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="client-card-footer">
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(client._id)}
                  >
                    View Details
                  </button>
                  {getStatusIndicator(client.stage || 0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ClientManage; 