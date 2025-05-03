import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/SectionsManagement.css";
import { Plus, Pencil, Trash2, CirclePlus } from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

function Sections_Managment() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sections, setSections] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [currentSection, setCurrentSection] = useState(null);
  const [newSection, setNewSection] = useState({ 
    materialName: "",
    description: "",
    price: "",
    subcategory: "",
    unitType: "area"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchSections();
    fetchSubcategories();
  }, [navigate]);

  const fetchSections = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/sections/list`);
      if (response.data.success) {
        setSections(response.data.data);
      } else {
        console.error('Failed to fetch sections:', response.data.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: response.data.message || 'Failed to fetch sections',
        });
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to fetch sections. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/subcategories/display`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // Add this useEffect to monitor subcategories state changes
  useEffect(() => {
    console.log('Current subcategories state:', subcategories);
  }, [subcategories]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSubcategoryChange = (e) => {
    setNewSection({ 
      ...newSection, 
      subcategory: e.target.value
    });
  };

  const handleAddSection = async () => {
    if (!newSection.materialName || !newSection.description || !newSection.price || 
        !newSection.subcategory || !newSection.unitType) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill in all required fields',
      });
      return;
    }
    
    try {
      const selectedSubcategory = subcategories.find(sub => sub.subcategoryName === newSection.subcategory);
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/sections/create`, {
        materialName: newSection.materialName,
        description: newSection.description,
        price: Number(newSection.price),
        category: selectedSubcategory.categoryName,
        subcategory: newSection.subcategory,
        unitType: newSection.unitType,
        status: 1
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.data.message,
          timer: 2000,
          showConfirmButton: false
        });
        fetchSections();
        setNewSection({ 
          materialName: "",
          description: "",
          price: "",
          subcategory: "",
          unitType: "area"
        });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding section:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to add section. Please try again.',
      });
    }
  };

  const openEditModal = (section) => {
    setCurrentSection({
      _id: section._id,
      materialName: section.materialName,
      description: section.description,
      price: section.price,
      subcategory: section.subcategory,
      unitType: section.unitType
    });
    setShowEditModal(true);
  };

  const handleEditSection = async () => {
    if (!currentSection.materialName || !currentSection.description || !currentSection.price || 
        !currentSection.subcategory || !currentSection.unitType) {
      Swal.fire({
        icon: 'warning',
        title: 'Warning',
        text: 'Please fill in all required fields',
      });
      return;
    }
    
    try {
      const selectedSubcategory = subcategories.find(sub => sub.subcategoryName === currentSection.subcategory);
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/sections/${currentSection._id}`, {
        materialName: currentSection.materialName,
        description: currentSection.description,
        price: Number(currentSection.price),
        category: selectedSubcategory.categoryName,
        subcategory: currentSection.subcategory,
        unitType: currentSection.unitType,
        status: 1
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: response.data.message,
          timer: 2000,
          showConfirmButton: false
        });
        fetchSections();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating section:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to update section. Please try again.',
      });
    }
  };

  const openDeleteModal = (section) => {
    setCurrentSection({
      _id: section._id
    });
    setShowDeleteModal(true);
  };

  const handleDeleteSection = async () => {
    if (!currentSection || !currentSection._id) {
      console.error('No section selected for deactivation');
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/sections/${currentSection._id}`, {
        status: 0
      });
      
      if (response.data.success) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Section deactivated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchSections();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deactivating section:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.message || 'Failed to deactivate section. Please try again.',
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
        <div className="sections-management-container">
          <div className="sections-header">
            <h2>Section Management</h2>
            <button 
              className="sections-add-btn"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={18} /> Add Section
            </button>
          </div>

          {isLoading ? (
            <div className="sections-loading-container">
              <div className="sections-loading-spinner"></div>
            </div>
          ) : (
            <div className="sections-grid">
              {sections.length > 0 ? (
                sections.map((section) => (
                  <div key={section._id} className="section-item-card">
                    <div className="section-item-header">
                      <h3>{section.materialName}</h3>
                      <div className="section-item-actions">
                        <button 
                          className="section-action-btn section-edit-btn"
                          onClick={() => openEditModal(section)}
                        >
                          <Pencil size={16} />
                        </button>
                        <button 
                          className="section-action-btn section-delete-btn"
                          onClick={() => openDeleteModal(section)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="section-item-content">
                      <p className="section-item-description">{section.description}</p>
                      <div className="section-item-details">
                        <div className="section-detail-item">
                          <span className="section-detail-label">Category</span>
                          <span className="section-detail-value">{section.category}</span>
                        </div>
                        <div className="section-detail-item">
                          <span className="section-detail-label">Subcategory</span>
                          <span className="section-detail-value">{section.subcategory}</span>
                        </div>
                        <div className="section-detail-item">
                          <span className="section-detail-label">Price</span>
                          <span className="section-detail-value">₹{section.price}</span>
                        </div>
                        <div className="section-detail-item">
                          <span className="section-detail-label">Unit Type</span>
                          <span className="section-detail-value">{section.unitType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-data">
                  No sections found. Add a new section to get started.
                </div>
              )}
            </div>
          )}

          {/* Add Section Modal */}
          {showAddModal && (
            <div className="sections-modal-overlay">
              <div className="sections-modal">
                <div className="sections-modal-header">
                  <h3>Add New Section</h3>
                  <button className="sections-modal-close" onClick={() => setShowAddModal(false)}>
                    &times;
                  </button>
                </div>
                <div className="sections-modal-body">
                  <div className="sections-form-grid">
                    <div className="sections-form-group">
                      <label>Material Name *</label>
                      <input
                        type="text"
                        value={newSection.materialName}
                        onChange={(e) => setNewSection({ ...newSection, materialName: e.target.value })}
                        placeholder="Enter material name"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        value={newSection.price}
                        onChange={(e) => setNewSection({ ...newSection, price: e.target.value })}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Unit Type *</label>
                      <div className="sections-radio-group">
                        <label>
                          <input
                            type="radio"
                            value="area"
                            checked={newSection.unitType === "area"}
                            onChange={(e) => setNewSection({ ...newSection, unitType: e.target.value })}
                          />
                          Area
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="pieces"
                            checked={newSection.unitType === "pieces"}
                            onChange={(e) => setNewSection({ ...newSection, unitType: e.target.value })}
                          />
                          Pieces
                        </label>
                      </div>
                    </div>
                    <div className="sections-form-group">
                      <label>Description *</label>
                      <textarea
                        value={newSection.description}
                        onChange={(e) => setNewSection({ ...newSection, description: e.target.value })}
                        placeholder="Enter description"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Subcategory *</label>
                      <select
                        value={newSection.subcategory}
                        onChange={handleSubcategoryChange}
                        required
                      >
                        <option value="">Select a subcategory</option>
                        {subcategories.map((subcategory) => (
                          <option key={subcategory._id} value={subcategory.subcategoryName}>
                            {subcategory.subcategoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="sections-modal-footer">
                  <button className="sections-btn sections-btn-secondary" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button className="sections-btn sections-btn-primary" onClick={handleAddSection}>
                    Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Section Modal */}
          {showEditModal && (
            <div className="sections-modal-overlay">
              <div className="sections-modal">
                <div className="sections-modal-header">
                  <h3>Edit Section</h3>
                  <button className="sections-modal-close" onClick={() => setShowEditModal(false)}>
                    &times;
                  </button>
                </div>
                <div className="sections-modal-body">
                  <div className="sections-form-grid">
                    <div className="sections-form-group">
                      <label>Material Name *</label>
                      <input
                        type="text"
                        value={currentSection.materialName}
                        onChange={(e) => setCurrentSection({ ...currentSection, materialName: e.target.value })}
                        placeholder="Enter material name"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Price *</label>
                      <input
                        type="number"
                        value={currentSection.price}
                        onChange={(e) => setCurrentSection({ ...currentSection, price: e.target.value })}
                        placeholder="Enter price"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Unit Type *</label>
                      <div className="sections-radio-group">
                        <label>
                          <input
                            type="radio"
                            value="area"
                            checked={currentSection.unitType === "area"}
                            onChange={(e) => setCurrentSection({ ...currentSection, unitType: e.target.value })}
                          />
                          Area
                        </label>
                        <label>
                          <input
                            type="radio"
                            value="pieces"
                            checked={currentSection.unitType === "pieces"}
                            onChange={(e) => setCurrentSection({ ...currentSection, unitType: e.target.value })}
                          />
                          Pieces
                        </label>
                      </div>
                    </div>
                    <div className="sections-form-group">
                      <label>Description *</label>
                      <textarea
                        value={currentSection.description}
                        onChange={(e) => setCurrentSection({ ...currentSection, description: e.target.value })}
                        placeholder="Enter description"
                        required
                      />
                    </div>
                    <div className="sections-form-group">
                      <label>Subcategory *</label>
                      <select
                        value={currentSection.subcategory}
                        onChange={(e) => setCurrentSection({ ...currentSection, subcategory: e.target.value })}
                        required
                      >
                        <option value="">Select a subcategory</option>
                        {subcategories.map((subcategory) => (
                          <option key={subcategory._id} value={subcategory.subcategoryName}>
                            {subcategory.subcategoryName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="sections-modal-footer">
                  <button className="sections-btn sections-btn-secondary" onClick={() => setShowEditModal(false)}>
                    Cancel
                  </button>
                  <button className="sections-btn sections-btn-primary" onClick={handleEditSection}>
                    Update
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="sections-modal-overlay">
              <div className="sections-modal">
                <div className="sections-modal-header">
                  <h3>Confirm Deactivation</h3>
                  <button className="sections-modal-close" onClick={() => setShowDeleteModal(false)}>
                    &times;
                  </button>
                </div>
                <div className="sections-modal-body">
                  <p>Are you sure you want to deactivate this section?</p>
                </div>
                <div className="sections-modal-footer">
                  <button className="sections-btn sections-btn-secondary" onClick={() => setShowDeleteModal(false)}>
                    Cancel
                  </button>
                  <button className="sections-btn sections-btn-danger" onClick={handleDeleteSection}>
                    Deactivate
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Sections_Managment; 