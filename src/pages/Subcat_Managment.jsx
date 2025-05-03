import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Cat_Management.css";
import { Plus, Pencil, Trash2, CirclePlus } from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

function Subcat_Managment() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [subcategories, setSubcategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [currentSubcategory, setCurrentSubcategory] = useState(null);
  const [newSubcategory, setNewSubcategory] = useState({ name: "", categoryName: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchSubcategories();
    fetchCategories();
  }, [navigate]);

  const fetchSubcategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/subcategories/display`);
      if (response.data) {
        const activeSubcategories = response.data.filter(subcat => subcat.status === 1);
        setSubcategories(activeSubcategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/display`);
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddSubcategory = async () => {
    if (newSubcategory.name.trim() === "" || !newSubcategory.categoryName) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/subcategories/insert`, {
        subcategoryName: newSubcategory.name,
        categoryName: newSubcategory.categoryName,
        status: 1
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Subcategory added successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchSubcategories();
        setNewSubcategory({ name: "", categoryName: "" });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding subcategory:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add subcategory. Please try again.',
      });
    }
  };

  const handleEditSubcategory = async () => {
    if (currentSubcategory.name.trim() === "" || !currentSubcategory.categoryName) return;
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/subcategories/update/${currentSubcategory.id}`, {
        subcategoryName: currentSubcategory.name,
        categoryName: currentSubcategory.categoryName,
        status: 1
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Subcategory updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchSubcategories();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating subcategory:', error);
      let errorMessage = 'Failed to update subcategory. Please try again.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Subcategory not found.';
        } else if (error.response.status === 400) {
          errorMessage = 'Subcategory with this name already exists.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  const openDeleteModal = (subcategory) => {
    if (!subcategory || !subcategory._id) {
      console.error('Invalid subcategory data:', subcategory);
      return;
    }
    setCurrentSubcategory({
      id: subcategory._id,
      name: subcategory.name,
      categoryName: subcategory.category
    });
    setShowDeleteModal(true);
  };

  const handleDeleteSubcategory = async () => {
    if (!currentSubcategory || !currentSubcategory.id) {
      console.error('No subcategory selected for deactivation');
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/subcategories/update/${currentSubcategory.id}`, {
        status: 0
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Subcategory deactivated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchSubcategories();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deactivating subcategory:', error);
      let errorMessage = 'Failed to deactivate subcategory. Please try again.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Subcategory not found.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  const openEditModal = async (subcategory) => {
    if (!subcategory || !subcategory._id) {
      console.error('Invalid subcategory data:', subcategory);
      return;
    }

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/subcategories/display/${subcategory._id}`);
      if (response.data) {
        setCurrentSubcategory({
          id: response.data._id,
          name: response.data.subcategoryName,
          categoryName: response.data.categoryName
        });
        setShowEditModal(true);
      }
    } catch (error) {
      console.error('Error fetching subcategory details:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch subcategory details. Please try again.',
      });
    }
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="category-header">
          <h2>Subcategory Management</h2>
          <button 
            className="btn btn-primary add-category-btn"
            onClick={() => setShowAddModal(true)}
          >
            <CirclePlus size={20} /> Add Subcategory
          </button>
        </div>

        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="categories-grid">
            {subcategories.length > 0 ? (
              subcategories.map((subcategory) => (
                <div key={subcategory._id} className="category-card">
                  <div className="category-card-content">
                    <h3>{subcategory.subcategoryName}</h3>
                    <p>Category: {subcategory.categoryName}</p>
                  </div>
                  <div className="category-card-actions">
                    <button 
                      className="btn-icon edit-btn"
                      onClick={() => openEditModal(subcategory)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn-icon delete-btn"
                      onClick={() => openDeleteModal(subcategory)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-categories-message">
                <p>No subcategories found. Add a new subcategory to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Add Subcategory Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Subcategory</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subcategory Name</label>
                  <input
                    type="text"
                    value={newSubcategory.name}
                    onChange={(e) => setNewSubcategory({ ...newSubcategory, name: e.target.value })}
                    placeholder="Enter subcategory name"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={newSubcategory.categoryName}
                    onChange={(e) => setNewSubcategory({ ...newSubcategory, categoryName: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddSubcategory}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Subcategory Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Subcategory</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Subcategory Name</label>
                  <input
                    type="text"
                    value={currentSubcategory.name}
                    onChange={(e) => setCurrentSubcategory({ ...currentSubcategory, name: e.target.value })}
                    placeholder="Enter subcategory name"
                  />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    value={currentSubcategory.categoryName}
                    onChange={(e) => setCurrentSubcategory({ ...currentSubcategory, categoryName: e.target.value })}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category._id} value={category.name}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditSubcategory}>
                  Update
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Confirm Deactivation</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to deactivate this subcategory?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-danger" onClick={handleDeleteSubcategory}>
                  Deactivate
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Subcat_Managment; 