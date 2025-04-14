import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Cat_Management.css";
import { Plus, Pencil, Trash2, CirclePlus } from "lucide-react";
import axios from "axios";
import Swal from 'sweetalert2';
import { useNavigate } from "react-router-dom";

function Cat_Management() {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [categories, setCategories] = useState([]);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [newCategory, setNewCategory] = useState({ name: "" });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }
    fetchCategories();
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

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddCategory = async () => {
    if (newCategory.name.trim() === "") return;
    
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/categories/insert`, {
        name: newCategory.name
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category added successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCategories();
        setNewCategory({ name: "" });
        setShowAddModal(false);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to add category. Please try again.',
      });
    }
  };

  const handleEditCategory = async () => {
    if (currentCategory.name.trim() === "") return;
    
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/update/${currentCategory.id}`, {
        name: currentCategory.name,
        status: 1
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category updated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCategories();
        setShowEditModal(false);
      }
    } catch (error) {
      console.error('Error updating category:', error);
      let errorMessage = 'Failed to update category. Please try again.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Category not found.';
        } else if (error.response.status === 400) {
          errorMessage = 'Category with this name already exists.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  const openDeleteModal = (category) => {
    if (!category || !category._id) {
      console.error('Invalid category data:', category);
      return;
    }
    setCurrentCategory({
      id: category._id,
      name: category.name
    });
    setShowDeleteModal(true);
  };

  const handleDeleteCategory = async () => {
    if (!currentCategory || !currentCategory.id) {
      console.error('No category selected for deactivation');
      return;
    }

    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/categories/update/${currentCategory.id}`, {
        status: 0
      });
      
      if (response.data) {
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Category deactivated successfully!',
          timer: 2000,
          showConfirmButton: false
        });
        fetchCategories();
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deactivating category:', error);
      let errorMessage = 'Failed to deactivate category. Please try again.';
      
      if (error.response) {
        if (error.response.status === 404) {
          errorMessage = 'Category not found.';
        }
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage,
      });
    }
  };

  const openEditModal = (category) => {
    if (!category || !category._id) {
      console.error('Invalid category data:', category);
      return;
    }
    setCurrentCategory({
      id: category._id,
      name: category.name
    });
    setShowEditModal(true);
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        {/* <TopNavbar /> */}
        
        <div className="category-header">
          <h2>Category Management</h2>
          <button 
            className="btn btn-primary add-category-btn"
            onClick={() => setShowAddModal(true)}
          >
            <CirclePlus size={20} /> Add Category
          </button>
        </div>

        {/* Categories Grid */}
        {isLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.length > 0 ? (
              categories.map((category) => (
                <div key={category.id} className="category-card">
                  <div className="category-card-content">
                    <h3>{category.name}</h3>
                  </div>
                  <div className="category-card-actions">
                    <button 
                      className="btn-icon edit-btn"
                      onClick={() => openEditModal(category)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      className="btn-icon delete-btn"
                      onClick={() => openDeleteModal(category)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-categories-message">
                <p>No categories found. Add a new category to get started.</p>
              </div>
            )}
          </div>
        )}

        {/* Add Category Modal */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Add New Category</h3>
                <button className="close-btn" onClick={() => setShowAddModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    placeholder="Enter category name"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleAddCategory}>
                  Add Category
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Category Modal */}
        {showEditModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h3>Edit Category</h3>
                <button className="close-btn" onClick={() => setShowEditModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Category Name</label>
                  <input
                    type="text"
                    value={currentCategory.name}
                    onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-primary" onClick={handleEditCategory}>
                  Update Category
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
                <h3>Delete Category</h3>
                <button className="close-btn" onClick={() => setShowDeleteModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete the category "{currentCategory.name}"?</p>
                <p>This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn btn-danger" 
                  onClick={handleDeleteCategory}
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

export default Cat_Management;