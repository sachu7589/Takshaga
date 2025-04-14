import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";

function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchClientDetails = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display/${id}`);
        if (!response.data) {
          throw new Error('Client not found');
        }
        setClient(response.data);
      } catch (error) {
        console.error('Error fetching client details:', error);
        let errorMessage = 'Failed to fetch client details';
        
        if (error.response?.status === 404) {
          errorMessage = 'Client not found';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          navigate('/client');
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchClientDetails();
  }, [id, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!client) {
    return null;
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="client-details-container">
          <h2>Client Details</h2>
          <div className="client-details-card">
            <div className="detail-row">
              <span className="detail-label">Client Name:</span>
              <span className="detail-value">{client.clientName}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{client.email}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Phone Number:</span>
              <span className="detail-value">{client.phoneNumber}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Location:</span>
              <span className="detail-value">{client.location}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">Type of Work:</span>
              <span className="detail-value">{client.typeOfWork}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDetails; 