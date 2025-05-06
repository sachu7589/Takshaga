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
  const [grandTotals, setGrandTotals] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    clientName: "",
    email: "",
    phoneNumber: "",
    location: ""
  });

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
        setEditFormData({
          clientName: response.data.clientName,
          email: response.data.email,
          phoneNumber: response.data.phoneNumber,
          location: response.data.location
        });
        
        if (response.data.stage > 0) {
          try {
            const grandTotalResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${id}/grandTotal`);
            if (grandTotalResponse.data && grandTotalResponse.data.grandTotal) {
              // Set the grandTotal value from the response in an array for display
              setGrandTotals([grandTotalResponse.data.grandTotal]);
            }
          } catch (grandTotalError) {
            console.error('Error fetching grand total:', grandTotalError);
          }
        }
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

  const handlePrepareEstimate = () => {
    navigate(`/estimateGenerationClient/${id}`);
  };

  const handleViewEstimate = async (clientId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${clientId}`);
      
      if (response.data && response.data.length > 0) {
        navigate(`/estimatePreview/${response.data[0]._id}`);
      } else {
        Swal.fire({
          title: 'No Estimates',
          text: 'No estimates found for this client',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to retrieve estimate information',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleAddStage = () => {
    // Implement add stage functionality
    console.log('Add stage clicked');
  };

  const handleEditClient = () => {
    setShowEditModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateClient = async () => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
        ...editFormData,
        stage: client.stage,
        completed: client.completed
      });

      if (response.data) {
        setClient(response.data);
        setShowEditModal(false);
        Swal.fire({
          title: 'Success!',
          text: 'Client details updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update client',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteClient = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will deactivate the client. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, deactivate it!'
      });

      if (result.isConfirmed) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/status/${id}`, {
          status: 0
        });
        
        Swal.fire(
          'Deactivated!',
          'Client has been deactivated.',
          'success'
        ).then(() => {
          navigate('/client');
        });
      }
    } catch (error) {
      console.error('Error deactivating client:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to deactivate client',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
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
          {/* Client Details Header with Action Buttons */}
          <div className="client-header">
            <h2>Client Information</h2>
            <div className="client-actions">
              {client.stage === 0 && (
                <button 
                  className="edit-btn"
                  onClick={handleEditClient}
                >
                  Edit
                </button>
              )}
              <button 
                className="delete-btn"
                onClick={handleDeleteClient}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay">
              <div className="modal">
                <div className="modal-header">
                  <h2>Edit Client Details</h2>
                  <button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button>
                </div>
                <div className="client-form">
                  <div className="form-group">
                    <label>Client Name:</label>
                    <input
                      type="text"
                      name="clientName"
                      value={editFormData.clientName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number:</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editFormData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location:</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button className="submit-button" onClick={handleUpdateClient}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* First Row - Client Details in Two Columns */}
          <div className="client-details-row">
            <div className="client-details-column">
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
            </div>
            <div className="client-details-column">
              <div className="detail-row">
                <span className="detail-label">Location:</span>
                <span className="detail-value">{client.location}</span>
              </div>
            </div>
          </div>

          {/* Second Row - Stage and Estimate Information */}
          <div className="stage-estimate-row">
            {client.stage > 0 && (
              <div className="stage-section">
                <div className="current-stage">
                  <span className="stage-label">Current Stage</span>
                  <span className="stage-number">{client.stage}</span>
                </div>
                <button 
                  className="add-stage-btn"
                  onClick={handleAddStage}
                >
                  Add Stage
                </button>
              </div>
            )}
            <div className="estimate-section">
              {client.stage === 0 ? (
                <button 
                  className="prepare-estimate-btn"
                  onClick={handlePrepareEstimate}
                >
                  Prepare Estimate
                </button>
              ) : (
                <>
                  <button 
                    className="view-estimate-btn"
                    onClick={() => handleViewEstimate(id)}
                  >
                    View Estimate
                  </button>
                  {grandTotals.length > 0 && (
                    <div className="estimate-amount">
                      <span className="amount-label">Grand Total:</span>
                      <span className="amount-value">
                        ₹{parseFloat(grandTotals[0]).toLocaleString()}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientDetails; 