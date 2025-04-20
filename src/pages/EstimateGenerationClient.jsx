import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";

function EstimateGenerationClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [materials, setMaterials] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [materialDimensions, setMaterialDimensions] = useState({});
  const [customFields, setCustomFields] = useState([
    { 
      materialName: '',
      measurementType: 'area',
      price: ''
    }
  ]);

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch client details
        const clientResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display/${id}`);
        setClient(clientResponse.data);

        // Fetch categories
        const categoriesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/display`);
        setCategories(categoriesResponse.data);

        // Fetch all materials
        const materialsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/materials/display`);
        setMaterials(materialsResponse.data);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to fetch data',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        navigate('/client');
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const handleMaterialSelect = (materialId) => {
    const material = materials.find(m => m._id === materialId);
    if (material) {
      setSelectedMaterials(prev => {
        const exists = prev.find(m => m._id === materialId);
        if (exists) {
          return prev.filter(m => m._id !== materialId);
        }
        return [...prev, material];
      });
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Filter materials based on selected category
  const filteredMaterials = selectedCategory 
    ? materials.filter(material => material.category === selectedCategory)
    : [];

  const handleDimensionChange = (materialId, dimension, value) => {
    setMaterialDimensions(prev => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [dimension]: parseFloat(value) || 0
      }
    }));
  };

  const calculateArea = (materialId) => {
    const dimensions = materialDimensions[materialId];
    if (!dimensions || !dimensions.length || !dimensions.breadth) {
      return 0;
    }
    // Convert cm to ft (1 cm = 0.0328084 ft)
    const lengthInFeet = dimensions.length * 0.0328084;
    const breadthInFeet = dimensions.breadth * 0.0328084;
    // Calculate area in square feet
    const areaInSqFt = (lengthInFeet * breadthInFeet).toFixed(2);
    return areaInSqFt;
  };

  const calculateRowTotal = (materialId) => {
    const dimensions = materialDimensions[materialId];
    const material = selectedMaterials.find(m => m._id === materialId);
    if (!dimensions || !material) {
      return 0;
    }
    
    if (material.measurementType === 'area') {
      if (!dimensions.length || !dimensions.breadth) {
        return 0;
      }
      const lengthInFeet = dimensions.length * 0.0328084;
      const breadthInFeet = dimensions.breadth * 0.0328084;
      const areaInSqFt = lengthInFeet * breadthInFeet;
      return (areaInSqFt * material.price).toFixed(2);
    } else {
      const pieces = dimensions.pieces || 0;
      return (pieces * material.price).toFixed(2);
    }
  };

  const calculateGrandTotal = () => {
    return selectedMaterials.reduce((total, material) => {
      const rowTotal = parseFloat(calculateRowTotal(material._id)) || 0;
      return total + rowTotal;
    }, 0).toFixed(2);
  };

  const handleCustomFieldChange = (index, field, value) => {
    const updatedFields = [...customFields];
    updatedFields[index] = {
      ...updatedFields[index],
      [field]: value
    };
    setCustomFields(updatedFields);
  };

  const handleAddCustomMaterial = (index) => {
    const field = customFields[index];
    if (!field.materialName || !field.price) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill all required fields before adding',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    const newMaterial = {
      _id: `custom-${Date.now()}-${index}`,
      name: field.materialName,
      price: parseFloat(field.price),
      category: 'Custom',
      measurementType: field.measurementType
    };

    setSelectedMaterials(prev => [...prev, newMaterial]);
    
    // Clear the custom field
    const updatedFields = [...customFields];
    updatedFields[index] = {
      materialName: '',
      measurementType: 'area',
      price: ''
    };
    setCustomFields(updatedFields);
  };

  const handleSaveAndPreview = async () => {
    try {
      if (selectedMaterials.length === 0) {
        Swal.fire({
          title: 'Error!',
          text: 'Please select at least one material',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      const estimateData = {
        clientId: id,
        clientName: client.clientName,
        materials: selectedMaterials.map(material => {
          const dimensions = materialDimensions[material._id] || {};
          
          return {
            name: material.name,
            category: material.category,
            measurementType: material.measurementType,
            dimensions: material.measurementType === 'area' ? {
              length: dimensions.length || 0,
              breadth: dimensions.breadth || 0,
              area: parseFloat(calculateArea(material._id)) || 0
            } : {
              pieces: parseFloat(dimensions.pieces) || 0
            },
            price: parseFloat(material.price),
            total: parseFloat(calculateRowTotal(material._id))
          };
        }),
        grandTotal: parseFloat(calculateGrandTotal()),
        status: 'pending',
        createdAt: new Date()
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/estimates/create`,
        estimateData
      );

      if (response.data.success) {
        Swal.fire({
          title: 'Success!',
          text: 'Estimate saved successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        }).then(() => {
          // Navigate to preview page with the estimate ID
          navigate(`/estimatePreview/${response.data.data._id}`);
        });
      } else {
        throw new Error(response.data.error || 'Failed to save estimate');
      }
    } catch (error) {
      console.error('Error saving estimate:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.error || 'Failed to save estimate',
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

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="estimate-generation-container">
          <div className="estimate-header">
            <h2>Prepare Estimate</h2>
          </div>

          {/* First Row - Client Details */}
          <div className="client-details-row">
            <div className="client-details-card">
              <h3>Client Information</h3>
              <div className="client-details-grid">
                <div className="client-details-column">
                  <div className="detail-row">
                    <span className="detail-label">Client Name:</span>
                    <span className="detail-value">{client?.clientName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{client?.email}</span>
                  </div>
                </div>
                <div className="client-details-column">
                  <div className="detail-row">
                    <span className="detail-label">Phone Number:</span>
                    <span className="detail-value">{client?.phoneNumber}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Location:</span>
                    <span className="detail-value">{client?.location}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Second Row - Category and Materials Selection */}
          <div className="selection-row">
            <div className="selection-card">
              <h3>Select Category</h3>
              <select 
                className="category-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option key={category._id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            {selectedCategory && (
              <div className="materials-card">
                <h3>Select Materials</h3>
                <div className="materials-grid">
                  {filteredMaterials.map(material => (
                    <div 
                      key={material._id} 
                      className={`material-item ${selectedMaterials.find(m => m._id === material._id) ? 'selected' : ''}`}
                      onClick={() => handleMaterialSelect(material._id)}
                    >
                      <div className="material-name">{material.name}</div>
                      <div className="material-price">₹{material.price}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Third Row - Selected Materials Table */}
          {selectedMaterials.length > 0 && (
            <div className="selected-materials-table">
              <h3>Selected Materials Details</h3>
              <table>
                <thead>
                  <tr>
                    <th>Material Name</th>
                    <th>Dimensions</th>
                    <th>Area/Pieces</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaterials.map(material => (
                    <tr key={material._id}>
                      <td>{material.name}</td>
                      <td>
                        {material.measurementType === 'area' ? (
                          <>
                            <input 
                              type="number" 
                              className="dimension-input"
                              placeholder="Length (cm)"
                              onChange={(e) => handleDimensionChange(material._id, 'length', e.target.value)}
                            />
                            <input 
                              type="number" 
                              className="dimension-input"
                              placeholder="Breadth (cm)"
                              onChange={(e) => handleDimensionChange(material._id, 'breadth', e.target.value)}
                            />
                          </>
                        ) : (
                          <input 
                            type="number" 
                            className="dimension-input"
                            placeholder="No. of Pieces"
                            onChange={(e) => handleDimensionChange(material._id, 'pieces', e.target.value)}
                          />
                        )}
                      </td>
                      <td>
                        {material.measurementType === 'area' 
                          ? `${calculateArea(material._id)} sq ft`
                          : `${materialDimensions[material._id]?.pieces || 0} pieces`}
                      </td>
                      <td>₹{material.price}</td>
                      <td>₹{calculateRowTotal(material._id)}</td>
                      <td>
                        <button 
                          className="remove-row-btn"
                          onClick={() => setSelectedMaterials(prev => 
                            prev.filter(m => m._id !== material._id)
                          )}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="5" className="grand-total-label">Grand Total</td>
                    <td className="grand-total-value">₹{calculateGrandTotal()}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Custom Fields Section */}
          <div className="custom-fields-section">
            <h3>Custom Material Fields</h3>
            <div className="custom-fields-list">
              {customFields.map((field, index) => (
                <div key={index} className="custom-field-row">
                  <input
                    type="text"
                    className="custom-field-input"
                    placeholder="Material Name"
                    value={field.materialName}
                    onChange={(e) => handleCustomFieldChange(index, 'materialName', e.target.value)}
                  />
                  <div className="measurement-type">
                    <label>
                      <input
                        type="radio"
                        name={`measurementType-${index}`}
                        value="area"
                        checked={field.measurementType === 'area'}
                        onChange={(e) => handleCustomFieldChange(index, 'measurementType', e.target.value)}
                      />
                      Area
                    </label>
                    <label>
                      <input
                        type="radio"
                        name={`measurementType-${index}`}
                        value="pieces"
                        checked={field.measurementType === 'pieces'}
                        onChange={(e) => handleCustomFieldChange(index, 'measurementType', e.target.value)}
                      />
                      Pieces
                    </label>
                  </div>
                  <input
                    type="number"
                    className="custom-field-input"
                    placeholder="Price"
                    value={field.price}
                    onChange={(e) => handleCustomFieldChange(index, 'price', e.target.value)}
                  />
                  <button 
                    className="add-custom-btn"
                    onClick={() => handleAddCustomMaterial(index)}
                  >
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="save-preview-btn" onClick={handleSaveAndPreview}>
              Save & Preview Estimate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstimateGenerationClient; 