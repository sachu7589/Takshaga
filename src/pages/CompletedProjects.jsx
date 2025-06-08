import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import axios from 'axios';
import Swal from 'sweetalert2';
import { Users, Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import '../assets/styles/Client.css';

function CompletedProjects() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [completedProjects, setCompletedProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchCompletedProjects();
  }, [navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const fetchCompletedProjects = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display`);
      // Filter clients to show those with completed = 1 AND status = 1
      const filteredClients = response.data.filter(client => client.completed === 1 && client.status === 1);
      setCompletedProjects(filteredClients);
    } catch (error) {
      console.error('Error fetching completed projects:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to fetch completed projects',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewDetails = (clientId) => {
    navigate(`/completed-project-details/${clientId}`);
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
          <h2>Completed Projects</h2>
        </div>
        <div className="client-cards-container">
          {completedProjects.length === 0 ? (
            <div className="no-projects">No completed projects found</div>
          ) : (
            completedProjects.map((project) => (
              <div key={project._id} className="client-card">
                <div className="client-card-content">
                  <div className="client-card-main">
                    <div className="client-card-icon">
                      <Users size={40} />
                    </div>
                    <div className="client-info">
                      <h3>{project.clientName}</h3>
                      <div className="client-details">
                        <div className="detail-item">
                          <Mail size={16} className="detail-icon" />
                          <span>{project.email}</span>
                        </div>
                        <div className="detail-item">
                          <Phone size={16} className="detail-icon" />
                          <span>{project.phoneNumber}</span>
                        </div>
                        <div className="detail-item">
                          <MapPin size={16} className="detail-icon" />
                          <span>{project.location}</span>
                        </div>
                        <div className="detail-item">
                          <Briefcase size={16} className="detail-icon" />
                          <span>{project.typeOfWork}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="client-card-footer">
                    <button 
                      className="view-details-btn"
                      onClick={() => handleViewDetails(project._id)}
                    >
                      View Details
                    </button>
                    <div className="status-indicator stage">Completed</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default CompletedProjects; 