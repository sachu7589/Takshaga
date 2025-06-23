import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Bank = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [banks, setBanks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBank, setCurrentBank] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: '',
    upiId: ''
  });
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load banks from API on component mount
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    fetchBanks();
  }, [navigate, user]);

  const fetchBanks = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/banks/display`);
      setBanks(response.data);
    } catch (error) {
      console.error('Error fetching banks:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load banks'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      bankName: '',
      accountName: '',
      accountNumber: '',
      ifscCode: '',
      accountType: '',
      upiId: ''
    });
    setCurrentBank(null);
    setEditMode(false);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (bank) => {
    setFormData(bank);
    setCurrentBank(bank);
    setEditMode(true);
    setShowModal(true);
  };

    const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.bankName || !formData.accountName || !formData.accountNumber || !formData.ifscCode) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setLoading(true);
      const userId = sessionStorage.getItem('userId');

      if (!userId) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'User not authenticated'
        });
        return;
      }

      if (editMode) {
        // Update existing bank
        await axios.put(`${import.meta.env.VITE_API_URL}/api/banks/${currentBank._id}`, formData);
        
        Swal.fire({
          icon: 'success',
          title: 'Bank Updated',
          text: 'Bank details updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        // Add new bank
        const bankData = { ...formData, userId };
        await axios.post(`${import.meta.env.VITE_API_URL}/api/banks`, bankData);
        
        Swal.fire({
          icon: 'success',
          title: 'Bank Added',
          text: 'New bank added successfully!',
          timer: 2000,
          showConfirmButton: false
        });
      }

      closeModal();
      fetchBanks(); // Refresh the list
    } catch (error) {
      console.error('Error saving bank:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to save bank details'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (bankId) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          setLoading(true);
          await axios.delete(`${import.meta.env.VITE_API_URL}/api/banks/${bankId}`);
          
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Bank has been deleted.',
            timer: 2000,
            showConfirmButton: false
          });
          
          fetchBanks(); // Refresh the list
        } catch (error) {
          console.error('Error deleting bank:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.response?.data?.message || 'Failed to delete bank'
          });
        } finally {
          setLoading(false);
        }
      }
    });
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        &#9776;
      </button>
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="page-header">
          <div className="header-content">
            <h1>Bank Management</h1>
            <button className="add-bank-btn" onClick={openAddModal}>
              <Plus size={20} />
              Add Bank
            </button>
          </div>
        </div>

        <div className="page-content">

          {/* Banks List */}
          <div className="banks-container">
            {loading ? (
              <div className="loading-container">
                <p>Loading banks...</p>
              </div>
            ) : banks.length === 0 ? (
              <div className="no-banks">
                <p>No banks added yet. Click "Add Bank" to get started.</p>
              </div>
            ) : (
              <div className="banks-grid">
                {banks.map((bank) => (
                  <div key={bank._id} className="bank-card">
                    <div className="bank-header-card">
                      <h3>{bank.bankName}</h3>
                      <div className="bank-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => openEditModal(bank)}
                          title="Edit Bank"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(bank._id)}
                          title="Delete Bank"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="bank-details">
                      <div className="detail-row">
                        <span className="label">Account Name:</span>
                        <span className="value">{bank.accountName}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Account Number:</span>
                        <span className="value">{bank.accountNumber}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">IFSC Code:</span>
                        <span className="value">{bank.ifscCode}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">Account Type:</span>
                        <span className="value">{bank.accountType}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">UPI ID:</span>
                        <span className="value">{bank.upiId || 'Not provided'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editMode ? 'Update Bank' : 'Add New Bank'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="bankName">Bank Name *</label>
                    <input
                      type="text"
                      id="bankName"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter bank name"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="accountName">Account Name *</label>
                    <input
                      type="text"
                      id="accountName"
                      name="accountName"
                      value={formData.accountName}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter account holder name"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountNumber">Account Number *</label>
                    <input
                      type="text"
                      id="accountNumber"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter account number"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="ifscCode">IFSC Code *</label>
                    <input
                      type="text"
                      id="ifscCode"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter IFSC code"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="accountType">Account Type</label>
                    <select
                      id="accountType"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleInputChange}
                    >
                      <option value="">Select account type</option>
                      <option value="Savings">Savings</option>
                      <option value="Current">Current</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="upiId">UPI ID</label>
                    <input
                      type="text"
                      id="upiId"
                      name="upiId"
                      value={formData.upiId}
                      onChange={handleInputChange}
                      placeholder="Enter UPI ID (e.g., name@paytm)"
                    />
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (editMode ? 'Updating...' : 'Adding...') : (editMode ? 'Update Bank' : 'Add Bank')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          display: flex;
          min-height: 100vh;
          overflow: hidden;
          background-color: #f0f7ff;
          color: #343a40;
        }

        .dashboard-content {
          flex: 1;
          margin-left: 250px;
          transition: margin-left 0.3s ease;
          overflow-y: auto;
          height: 100vh;
        }

        .dashboard-content.sidebar-open {
          margin-left: 250px;
        }

        .hamburger {
          position: fixed;
          top: 20px;
          left: 20px;
          z-index: 1001;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #1e3a8a;
          padding: 0.5rem;
          border-radius: 4px;
          transition: background-color 0.2s;
        }

        .hamburger:hover {
          background-color: rgba(30, 58, 138, 0.1);
        }

        .page-header {
          background: white;
          padding: 2rem;
          border-bottom: 1px solid #e9ecef;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header h1 {
          margin: 0;
          color: #1e3a8a;
          font-size: 2rem;
          font-weight: 600;
        }

        .page-content {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }

        @media (max-width: 768px) {
          .dashboard-content {
            margin-left: 0;
          }
          
          .dashboard-content.sidebar-open {
            margin-left: 0;
          }

          .header-content {
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
          }

          .page-header h1 {
            font-size: 1.5rem;
          }
        }

        .add-bank-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background-color 0.2s;
          position: relative;
          z-index: 1;
          visibility: visible;
        }

        .add-bank-btn:hover {
          background: #0056b3;
        }

        .banks-container {
          min-height: 200px;
        }

        .no-banks,
        .loading-container {
          text-align: center;
          padding: 3rem;
          color: #6c757d;
        }

        .banks-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .bank-card {
          background: white;
          border: 1px solid #e9ecef;
          border-radius: 12px;
          padding: 1.5rem;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }

        .bank-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }

        .bank-header-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e9ecef;
        }

        .bank-header-card h3 {
          margin: 0;
          color: #343a40;
          font-size: 1.25rem;
        }

        .bank-actions {
          display: flex;
          gap: 8px;
        }

        .edit-btn, .delete-btn {
          padding: 8px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .edit-btn {
          background: #e3f2fd;
          color: #1976d2;
          border: 1px solid #bbdefb;
        }

        .edit-btn:hover {
          background: #1976d2;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(25,118,210,0.3);
        }

        .delete-btn {
          background: #ffebee;
          color: #d32f2f;
          border: 1px solid #ffcdd2;
        }

        .delete-btn:hover {
          background: #d32f2f;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(211,47,47,0.3);
        }

        .bank-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .label {
          font-weight: 500;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .value {
          color: #343a40;
          font-weight: 500;
        }

        .value.balance {
          color: #28a745;
          font-weight: 600;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal {
          background: white;
          border-radius: 12px;
          width: 90%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid #e9ecef;
        }

        .modal-header h2 {
          margin: 0;
          color: #343a40;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #6c757d;
        }

        .close-btn:hover {
          color: #343a40;
        }

        .modal-form {
          padding: 1.5rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #343a40;
        }

        .form-group input,
        .form-group select {
          padding: 0.75rem;
          border: 1px solid #ced4da;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.2s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 1rem;
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid #e9ecef;
        }

        .cancel-btn {
          background: #6c757d;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .cancel-btn:hover {
          background: #545b62;
        }

        .submit-btn {
          background: #007bff;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .submit-btn:hover {
          background: #0056b3;
        }

        @media (max-width: 768px) {
          .banks-grid {
            grid-template-columns: 1fr;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 1200px) and (min-width: 769px) {
          .banks-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default Bank; 