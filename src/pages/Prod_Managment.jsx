import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Product.css";
import { Plus, Pencil, Trash2, CirclePlus } from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

function Prod_Managment() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [currentMaterial, setCurrentMaterial] = useState({ id: 0, name: "", price: 0, category: "", measurementType: "pieces" });
  const [newMaterial, setNewMaterial] = useState({ name: "", price: 0, category: "", measurementType: "pieces" });
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchCategories();
    fetchMaterials();
  }, [navigate]);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/display`);
      if (response.data) {
        setCategories(response.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMaterials = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/materials/display`);
      if (response.data) {
        setMaterials(response.data);
      }
    } catch (error) {
      console.error('Error fetching materials:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to fetch materials. Please try again.',
        timer: 1500,
        showConfirmButton: false
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddMaterial = async () => {
    if (newMaterial.name.trim() === "" || !newMaterial.category) return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/materials/insert`, {
        name: newMaterial.name,
        price: newMaterial.price,
        category: newMaterial.category,
        measurementType: newMaterial.measurementType
      });

      if (response.data) {
        setMaterials([...materials, response.data]);
        setNewMaterial({ name: "", price: 0, category: "", measurementType: "pieces" });
        setShowAddModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Material added successfully',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error adding material:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to add material. Please try again.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleEditMaterial = async () => {
    if (currentMaterial.name.trim() === "") return;
    
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/materials/update/${currentMaterial._id}`,
        {
          name: currentMaterial.name,
          price: currentMaterial.price,
          category: currentMaterial.category,
          measurementType: currentMaterial.measurementType
        }
      );

      if (response.data) {
        setMaterials(materials.map(mat => 
          mat._id === currentMaterial._id ? response.data : mat
        ));
        setShowEditModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Material updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error updating material:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to update material. Please try again.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const handleDeleteMaterial = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/materials/update/${currentMaterial._id}`,
        {
          status: 0
        }
      );

      if (response.data) {
        setMaterials(materials.filter(mat => mat._id !== currentMaterial._id));
        setShowDeleteModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Material deleted successfully',
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      console.error('Error deleting material:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to delete material. Please try again.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  };

  const openEditModal = (material) => {
    setCurrentMaterial({
      _id: material._id,
      name: material.name,
      price: material.price,
      category: material.category,
      measurementType: material.measurementType || "pieces"
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (material) => {
    setCurrentMaterial(material);
    setShowDeleteModal(true);
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="material-header">
          <h2>Materials Management</h2>
          <button 
            className="btn btn-primary add-material-btn"
            onClick={() => setShowAddModal(true)}
          >
            <CirclePlus size={20} /> Add Material
          </button>
        </div>

        <div className="materials-grid">
          {isLoading ? (
            <div className="loading">Loading materials...</div>
          ) : materials.length === 0 ? (
            <div className="no-materials">No materials found</div>
          ) : (
            materials.map((material) => (
              <div key={material._id} className="material-card">
                <div className="material-card-content">
                  <h3>{material.name}</h3>
                  <p className="price">₹{material.price.toLocaleString()}</p>
                  <p className="category">{material.category}</p>
                </div>
                <div className="material-card-actions">
                  <button 
                    className="btn-icon edit-btn"
                    onClick={() => openEditModal(material)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button 
                    className="btn-icon delete-btn"
                    onClick={() => openDeleteModal(material)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Material Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Material</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Material Name</label>
                  <input
                    type="text"
                    value={newMaterial.name}
                    onChange={(e) => setNewMaterial({...newMaterial, name: e.target.value})}
                    placeholder="Enter material name"
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={newMaterial.price}
                    onChange={(e) => setNewMaterial({...newMaterial, price: parseFloat(e.target.value)})}
                    placeholder="Enter price"
                  />
                </div>
                <div className="form-group">
                  <label>Measurement Type</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        value="pieces"
                        checked={newMaterial.measurementType === "pieces"}
                        onChange={(e) => setNewMaterial({...newMaterial, measurementType: e.target.value})}
                      />
                      Pieces
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="area"
                        checked={newMaterial.measurementType === "area"}
                        onChange={(e) => setNewMaterial({...newMaterial, measurementType: e.target.value})}
                      />
                      Area
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="category-select"
                    value={newMaterial.category}
                    onChange={(e) => setNewMaterial({...newMaterial, category: e.target.value})}
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
                <button className="btn btn-primary" onClick={handleAddMaterial}>
                  Add Material
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Material Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Material</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Material Name</label>
                  <input
                    type="text"
                    value={currentMaterial.name}
                    onChange={(e) => setCurrentMaterial({...currentMaterial, name: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    value={currentMaterial.price}
                    onChange={(e) => setCurrentMaterial({...currentMaterial, price: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="form-group">
                  <label>Measurement Type</label>
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        value="pieces"
                        checked={currentMaterial.measurementType === "pieces"}
                        onChange={(e) => setCurrentMaterial({...currentMaterial, measurementType: e.target.value})}
                      />
                      Pieces
                    </label>
                    <label>
                      <input
                        type="radio"
                        value="area"
                        checked={currentMaterial.measurementType === "area"}
                        onChange={(e) => setCurrentMaterial({...currentMaterial, measurementType: e.target.value})}
                      />
                      Area
                    </label>
                  </div>
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select
                    className="category-select"
                    value={currentMaterial.category}
                    onChange={(e) => setCurrentMaterial({...currentMaterial, category: e.target.value})}
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
                <button className="btn btn-primary" onClick={handleEditMaterial}>
                  Update Material
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
                <h3>Delete Material</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the material "{currentMaterial.name}"?</p>
                <p>This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDeleteMaterial}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Prod_Managment;
