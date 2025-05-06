import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import Sidebar from "../components/Sidebar";
import "../assets/styles/ClientDetails.css";

function EstimateGenerationClient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Data states
  const [allCategories, setAllCategories] = useState([]);
  const [allSubcategories, setAllSubcategories] = useState([]);
  const [allSections, setAllSections] = useState([]);
  
  // Selection states
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedSections, setSelectedSections] = useState([]);
  const [sectionDetails, setSectionDetails] = useState({});

  // Add state for multiple measurements
  const [multipleMeasurements, setMultipleMeasurements] = useState({});
  
  // Add state for running feet measurements
  const [runningLengths, setRunningLengths] = useState({});

  // Custom Item Modal States
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    category: "",
    subcategory: "",
    material: "",
    description: "",
    price: "",
    unitType: "pieces" // Default unit type
  });

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchAllData = async () => {
      try {
        // Fetch client details
        const clientResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display/${id}`);
        setClient(clientResponse.data);

        // Fetch all categories
        const categoriesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/categories/display`);
        setAllCategories(categoriesResponse.data);
        console.log("Categories:", categoriesResponse.data);

        // Fetch all subcategories
        const subcategoriesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/subcategories/display`);
        setAllSubcategories(subcategoriesResponse.data);
        console.log("Subcategories:", subcategoriesResponse.data);

        // Fetch all sections
        const sectionsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/sections/list`);
        setAllSections(sectionsResponse.data.data);
        console.log("Sections:", sectionsResponse.data.data);

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to fetch data. Please try again later.',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        navigate('/client');
      }
    };

    fetchAllData();
  }, [id, navigate]);

  // Filter subcategories based on selected category
  const filteredSubcategories = selectedCategory
    ? allSubcategories.filter(subcategory => 
        subcategory.categoryName === selectedCategory || 
        subcategory.category === selectedCategory)
    : [];

  // Filter sections based on selected category and subcategory
  const filteredSections = selectedSubcategory
    ? allSections.filter(section => 
        (section.subcategoryName === selectedSubcategory || 
         section.subcategory === selectedSubcategory) &&
        (section.categoryName === selectedCategory || 
         section.category === selectedCategory))
    : [];

  useEffect(() => {
    // Debug logging when category changes
    if (selectedCategory) {
      console.log("Selected Category:", selectedCategory);
      console.log("Filtered Subcategories:", filteredSubcategories);
    }
  }, [selectedCategory, filteredSubcategories]);

  useEffect(() => {
    // Debug logging when subcategory changes
    if (selectedSubcategory) {
      console.log("Selected Subcategory:", selectedSubcategory);
      console.log("Filtered Sections:", filteredSections);
    }
  }, [selectedSubcategory, filteredSections]);

  const handleCategoryChange = (event) => {
    const categoryName = event.target.value;
    console.log("Category changed to:", categoryName);
    setSelectedCategory(categoryName);
    setSelectedSubcategory("");
  };

  const handleSubcategoryChange = (event) => {
    const subcategoryName = event.target.value;
    console.log("Subcategory changed to:", subcategoryName);
    setSelectedSubcategory(subcategoryName);
  };

  const handleSectionSelect = (section) => {
    setSelectedSections(prev => {
      const exists = prev.find(s => s._id === section._id);
      if (exists) {
        setSectionDetails(prevDetails => {
          const newDetails = { ...prevDetails };
          delete newDetails[section._id];
          return newDetails;
        });
        return prev.filter(s => s._id !== section._id);
      }
      if (!sectionDetails[section._id]) {
        setSectionDetails(prevDetails => ({
          ...prevDetails,
          [section._id]: {
            quantity: 1,
            unitPrice: section.price || 0
          }
        }));
      }
      return [...prev, section];
    });
  };

  const handleSectionDetailChange = (sectionId, field, value) => {
    setSectionDetails(prev => {
      const newDetails = {
        ...prev,
        [sectionId]: {
          ...prev[sectionId],
          [field]: value
        }
      };

      // Calculate quantity if length and breadth are set, including multiple measurements
      if (field === 'length' || field === 'breadth') {
        const details = newDetails[sectionId];
        
        // Calculate the sums including multiple measurements
        let totalLength = parseFloat(details.length) || 0;
        let totalBreadth = parseFloat(details.breadth) || 0;
        
        // Add lengths and breadths from multiple measurements
        const measurements = multipleMeasurements[sectionId] || [];
        measurements.forEach(m => {
          if (m.length) totalLength += parseFloat(m.length) || 0;
          if (m.breadth) totalBreadth += parseFloat(m.breadth) || 0;
        });
        
        if (totalLength > 0 && totalBreadth > 0) {
          // Calculate area in cm² then convert to ft²
          const areaCm = totalLength * totalBreadth;
          const areaFt = (areaCm * 0.00107639).toFixed(2);
          newDetails[sectionId].quantity = areaFt;
        }
      }

      return newDetails;
    });
  };

  // Add handler for multiple measurements
  const handleAddMeasurement = (sectionId) => {
    setMultipleMeasurements(prev => {
      const currentMeasurements = prev[sectionId] || [];
      // Add a new measurement with default empty values
      return {
        ...prev,
        [sectionId]: [
          ...currentMeasurements,
          { length: '', breadth: '', area: 0 }
        ]
      };
    });
  };

  // Add handler to update multiple measurements
  const updateMeasurement = (sectionId, index, field, value) => {
    setMultipleMeasurements(prev => {
      const newMeasurements = [...(prev[sectionId] || [])];
      
      if (!newMeasurements[index]) {
        newMeasurements[index] = { length: '', breadth: '', area: 0 };
      }
      
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: value
      };
      
      // Calculate the sums of all lengths and breadths
      let totalLength = 0;
      let totalBreadth = 0;
      
      newMeasurements.forEach(m => {
        if (m.length) totalLength += parseFloat(m.length) || 0;
        if (m.breadth) totalBreadth += parseFloat(m.breadth) || 0;
      });
      
      // Add the primary measurement if it exists
      if (sectionDetails[sectionId]?.length) {
        totalLength += parseFloat(sectionDetails[sectionId].length) || 0;
      }
      if (sectionDetails[sectionId]?.breadth) {
        totalBreadth += parseFloat(sectionDetails[sectionId].breadth) || 0;
      }
      
      // Calculate total area using the sums
      let totalArea = 0;
      if (totalLength > 0 && totalBreadth > 0) {
        // Calculate area in cm² then convert to ft²
        const areaCm = totalLength * totalBreadth;
        totalArea = (areaCm * 0.00107639).toFixed(2);
      }
      
      // Update the quantity with the total area
      setSectionDetails(prevDetails => ({
        ...prevDetails,
        [sectionId]: {
          ...prevDetails[sectionId],
          quantity: totalArea
        }
      }));
      
      return {
        ...prev,
        [sectionId]: newMeasurements
      };
    });
  };

  // Add handler to remove measurement
  const removeMeasurement = (sectionId, index) => {
    setMultipleMeasurements(prev => {
      const newMeasurements = [...(prev[sectionId] || [])];
      newMeasurements.splice(index, 1);
      
      // Calculate the sums of all lengths and breadths
      let totalLength = 0;
      let totalBreadth = 0;
      
      newMeasurements.forEach(m => {
        if (m.length) totalLength += parseFloat(m.length) || 0;
        if (m.breadth) totalBreadth += parseFloat(m.breadth) || 0;
      });
      
      // Add the primary measurement if it exists
      if (sectionDetails[sectionId]?.length) {
        totalLength += parseFloat(sectionDetails[sectionId].length) || 0;
      }
      if (sectionDetails[sectionId]?.breadth) {
        totalBreadth += parseFloat(sectionDetails[sectionId].breadth) || 0;
      }
      
      // Calculate total area using the sums
      let totalArea = 0;
      if (totalLength > 0 && totalBreadth > 0) {
        // Calculate area in cm² then convert to ft²
        const areaCm = totalLength * totalBreadth;
        totalArea = (areaCm * 0.00107639).toFixed(2);
      }
      
      // Update the quantity with the total area
      setSectionDetails(prevDetails => ({
        ...prevDetails,
        [sectionId]: {
          ...prevDetails[sectionId],
          quantity: totalArea
        }
      }));
      
      return {
        ...prev,
        [sectionId]: newMeasurements
      };
    });
  };

  // Add handler for running feet measurements
  const handleAddRunningLength = (sectionId) => {
    setRunningLengths(prev => {
      const currentLengths = prev[sectionId] || [];
      return {
        ...prev,
        [sectionId]: [
          ...currentLengths,
          { length: '' }
        ]
      };
    });
  };

  // Update running length measurement
  const updateRunningLength = (sectionId, index, value) => {
    setRunningLengths(prev => {
      const newLengths = [...(prev[sectionId] || [])];
      
      if (!newLengths[index]) {
        newLengths[index] = { length: '' };
      }
      
      newLengths[index] = {
        ...newLengths[index],
        length: value
      };
      
      // Calculate the sum of all lengths
      let totalLengthCm = 0;
      
      newLengths.forEach(l => {
        if (l.length) totalLengthCm += parseFloat(l.length) || 0;
      });
      
      // Convert cm to feet (1 cm = 0.0328084 ft)
      const totalLengthFt = (totalLengthCm * 0.0328084).toFixed(2);
      
      // Update the quantity with the total length in feet
      setSectionDetails(prevDetails => ({
        ...prevDetails,
        [sectionId]: {
          ...prevDetails[sectionId],
          quantity: totalLengthFt
        }
      }));
      
      return {
        ...prev,
        [sectionId]: newLengths
      };
    });
  };

  // Remove running length measurement
  const removeRunningLength = (sectionId, index) => {
    setRunningLengths(prev => {
      const newLengths = [...(prev[sectionId] || [])];
      newLengths.splice(index, 1);
      
      // Calculate the sum of all lengths
      let totalLengthCm = 0;
      
      newLengths.forEach(l => {
        if (l.length) totalLengthCm += parseFloat(l.length) || 0;
      });
      
      // Convert cm to feet (1 cm = 0.0328084 ft)
      const totalLengthFt = (totalLengthCm * 0.0328084).toFixed(2);
      
      // Update the quantity with the total length in feet
      setSectionDetails(prevDetails => ({
        ...prevDetails,
        [sectionId]: {
          ...prevDetails[sectionId],
          quantity: totalLengthFt
        }
      }));
      
      return {
        ...prev,
        [sectionId]: newLengths
      };
    });
  };

  // Helper function to determine unit type based on section data
  const getSectionUnitType = (section) => {
    // This is just an example logic - adjust based on your actual data structure
    if (section.unitType) return section.unitType;
    
    // If no explicit unitType, try to infer from other properties or names
    const nameInLowerCase = (section.name || section.description || section.sectionName || '').toLowerCase();
    if (nameInLowerCase.includes('area') || nameInLowerCase.includes('square')) return 'area';
    if (nameInLowerCase.includes('running') || nameInLowerCase.includes('r.ft') || nameInLowerCase.includes('rft')) return 'running_sqft';
    if (nameInLowerCase.includes('piece') || nameInLowerCase.includes('item') || nameInLowerCase.includes('unit')) return 'pieces';
    
    // Default to pieces
    return 'pieces';
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleGenerateEstimate = async () => {
    // Validate inputs
    if (selectedSections.length === 0) {
      Swal.fire({
        title: 'Error!',
        text: 'Please select at least one section',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Check if all selected sections have quantity and unit price
    const invalidSections = selectedSections.filter(section => {
      const details = sectionDetails[section._id];
      return !details || !details.quantity || !details.unitPrice;
    });

    if (invalidSections.length > 0) {
      Swal.fire({
        title: 'Error!',
        text: 'Please provide quantity and unit price for all selected sections',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Calculate total amount
      const totalAmount = selectedSections.reduce((total, section) => {
        const details = sectionDetails[section._id] || {};
        return total + ((details.quantity || 0) * (details.unitPrice || 0));
      }, 0);

      // Apply ceiling to total amount
      const roundedTotal = Math.ceil(totalAmount);
      
      // Generate a default name using client name and date
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
      const defaultName = `${client.clientName} - ${currentDate}`;
      
      // Prepare sections data with simplified structure
      const sectionsData = selectedSections.map(section => {
        const details = sectionDetails[section._id] || {};
        
        // Get all measurements including primary and additional
        const allMeasurements = [];
        
        // Add primary measurement if it exists
        if (details.length && details.breadth) {
          allMeasurements.push({
            length: parseFloat(details.length),
            breadth: parseFloat(details.breadth),
            area: parseFloat((parseFloat(details.length) * parseFloat(details.breadth) * 0.00107639).toFixed(2))
          });
        }
        
        // Add additional measurements
        const additionalMeasurements = multipleMeasurements[section._id] || [];
        additionalMeasurements.forEach(m => {
          if (m.length && m.breadth) {
            allMeasurements.push({
              length: parseFloat(m.length),
              breadth: parseFloat(m.breadth),
              area: parseFloat((parseFloat(m.length) * parseFloat(m.breadth) * 0.00107639).toFixed(2))
            });
          }
        });
        
        // Calculate section total with ceiling
        const sectionTotal = Math.ceil((details.quantity || 0) * (details.unitPrice || section.price || 0));
        
        // Return simplified section data
        return {
          category: section.categoryName || section.category || '',
          subcategory: section.subcategoryName || section.subcategory || '',
          material: section.materialName || '',
          description: section.description || section.name || section.sectionName,
          measurements: allMeasurements.length > 0 ? allMeasurements : null,
          unitPrice: details.unitPrice || section.price || 0,
          quantity: details.quantity || 0,
          total: sectionTotal
        };  
      });

      // Prepare simplified estimate object
      const estimateData = {
        clientId: id,
        clientName: client.clientName,
        name: defaultName,
        discount: 0, // Default discount as 0
        sections: sectionsData,
        total: roundedTotal,
        grandTotal: roundedTotal // Same as total when discount is 0
      };

      // Send estimate data to the server
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/estimates/insert`, estimateData);

      Swal.fire({
        title: 'Success!',
        text: 'Estimate generated successfully',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      // Redirect to the estimate preview page with the correct route
      navigate(`/estimatePreview/${response.data.id}`);
    } catch (error) {
      console.error('Error generating estimate:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate estimate. Please try again later.',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomItemChange = (field, value) => {
    setCustomItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddCustomItem = () => {
    // Validate custom item
    if (!customItem.category || !customItem.subcategory || !customItem.description || !customItem.price) {
      Swal.fire({
        title: 'Error!',
        text: 'Please fill in all required fields',
        icon: 'error',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Create a new section object from the custom item
    const newSection = {
      _id: 'custom_' + Date.now(), // Generate a unique ID
      categoryName: customItem.category,
      subcategoryName: customItem.subcategory,
      materialName: customItem.material,
      description: customItem.description,
      price: parseFloat(customItem.price),
      unitType: customItem.unitType
    };

    // Add to selected sections
    setSelectedSections(prev => [...prev, newSection]);

    // Initialize section details
    setSectionDetails(prev => ({
      ...prev,
      [newSection._id]: {
        quantity: 1,
        unitPrice: parseFloat(customItem.price)
      }
    }));

    // Reset custom item form and close modal
    setCustomItem({
      category: "",
      subcategory: "",
      material: "",
      description: "",
      price: "",
      unitType: "pieces"
    });
    setShowCustomModal(false);

    // Show success message
    Swal.fire({
      title: 'Success!',
      text: 'Custom item added to estimate',
      icon: 'success',
      confirmButtonText: 'OK'
    });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // Calculate total amount
  const totalAmount = Math.ceil(selectedSections.reduce((total, section) => {
    const details = sectionDetails[section._id] || {};
    return total + ((details.quantity || 0) * (details.unitPrice || section.price || 0));
  }, 0));

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        {/* Main container with modern layout */}
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto', 
          padding: '20px',
          fontFamily: 'Inter, system-ui, sans-serif'
        }}>
          {/* Page header with breadcrumb and title */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '24px'
          }}>
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                margin: '0 0 8px 0',
                fontWeight: '600',
                color: '#1a1a1a'
              }}>Estimate Generation</h1>
              <div style={{ 
                color: '#666', 
                fontSize: '14px' 
              }}>Client: {client?.clientName}</div>
            </div>
            
            {/* Client summary card - compact format */}
            <div style={{ 
              display: 'flex',
              padding: '12px 20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <div style={{ marginRight: '24px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Email</div>
                <div style={{ fontWeight: '500' }}>{client?.email}</div>
              </div>
              <div style={{ marginRight: '24px' }}>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Phone</div>
                <div style={{ fontWeight: '500' }}>{client?.phoneNumber}</div>
              </div>
              <div>
                <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>Location</div>
                <div style={{ fontWeight: '500' }}>{client?.location}</div>
              </div>
            </div>
          </div>
          
          {/* Vertical layout with cards stacked */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            {/* Selection area card */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              padding: '24px',
              width: '100%'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
              }}>
                <h2 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginTop: '0',
                  marginBottom: '0',
                  color: '#333'
                }}>Select Items</h2>
                
                {/* Custom Item Button */}
                <button
                  onClick={() => setShowCustomModal(true)}
                  style={{
                    backgroundColor: '#0077B6',
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span style={{ fontSize: '16px' }}>+</span> Add Custom Item
                </button>
              </div>
              
              {/* Selection status */}
              {selectedSections.length > 0 && (
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  padding: '10px 16px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  <div style={{ 
                    backgroundColor: '#0077B6',
                    color: 'white',
                    borderRadius: '50%',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px',
                    fontWeight: '600'
                  }}>{selectedSections.length}</div>
                  <div>
                    <span style={{ fontWeight: '500' }}>Items selected</span>
                    <span style={{ color: '#555', marginLeft: '6px' }}>You can add more from any category</span>
                  </div>
                </div>
              )}
              
              {/* Form group style */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>Category</label>
                <select 
                  value={selectedCategory}
                  onChange={handleCategoryChange}
                  style={{ 
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontSize: '15px',
                    appearance: 'none',
                    backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 12px center',
                    backgroundSize: '16px'
                  }}
                >
                  <option value="">Select a category</option>
                  {allCategories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Subcategory Selection */}
              {selectedCategory && filteredSubcategories.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#444'
                  }}>Subcategory</label>
                  <select 
                    value={selectedSubcategory}
                    onChange={handleSubcategoryChange}
                    style={{ 
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      border: '1px solid #ddd',
                      backgroundColor: '#fff',
                      color: '#333',
                      fontSize: '15px',
                      appearance: 'none',
                      backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23333\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpolyline points=\'6 9 12 15 18 9\'%3E%3C/polyline%3E%3C/svg%3E")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="">Select a subcategory</option>
                    {filteredSubcategories.map(subcategory => (
                      <option key={subcategory._id} value={subcategory.subcategoryName}>
                        {subcategory.subcategoryName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Sections Grid */}
              {selectedSubcategory && filteredSections.length > 0 && (
                <div>
                  <label style={{ 
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#444'
                  }}>Available Sections</label>
                  <div style={{ 
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                    gap: '12px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    padding: '4px'
                  }}>
                    {filteredSections.map(section => (
                      <div 
                        key={section._id}
                        onClick={() => handleSectionSelect(section)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: selectedSections.find(s => s._id === section._id) 
                            ? 'rgba(0, 119, 182, 0.1)' 
                            : '#f8f9fa',
                          border: selectedSections.find(s => s._id === section._id)
                            ? '1px solid #0077B6'
                            : '1px solid #eee',
                          padding: '16px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative',
                          overflow: 'hidden'
                        }}
                      >
                        {selectedSections.find(s => s._id === section._id) && (
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: '#0077B6',
                            color: 'white',
                            borderRadius: '50%',
                            width: '20px',
                            height: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px'
                          }}>✓</div>
                        )}
                        <div style={{ 
                          fontWeight: '600', 
                          marginBottom: '8px',
                          color: '#333',
                          fontSize: '15px'
                        }}>
                          {section.description || section.name || section.sectionName}
                        </div>
                        <div style={{ 
                          fontSize: '13px', 
                          color: '#666', 
                          marginBottom: '8px',
                          display: 'flex',
                          alignItems: 'center'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            backgroundColor: '#ddd',
                            borderRadius: '50%',
                            marginRight: '6px'
                          }}></span>
                          {section.materialName || 'N/A'}
                        </div>
                        <div style={{ 
                          fontSize: '16px', 
                          color: '#0077B6', 
                          fontWeight: '600',
                          marginTop: 'auto'
                        }}>
                          ₹{section.price || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Estimate Details card - placed below the selection card */}
            {selectedSections.length > 0 && (
              <div style={{
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                padding: '24px',
                width: '100%'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px'
                }}>
                  <h2 style={{ 
                    fontSize: '18px', 
                    fontWeight: '600', 
                    margin: '0',
                    color: '#333'
                  }}>Estimate Details</h2>
                  
                  {/* Selected sections table with modern styling */}
                  <div style={{ 
                    backgroundColor: '#f8f9fa',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#666' }}>Total:</span>
                    <span style={{ 
                      fontWeight: '700',
                      color: '#0077B6',
                      fontSize: '16px',
                      marginLeft: '8px'
                    }}>₹{Math.ceil(totalAmount)}</span>
                  </div>
                </div>
                
                {/* Selected sections table with modern styling */}
                <div style={{ 
                  overflow: 'auto',
                  marginBottom: '20px'
                }}>
                  {/* Group sections by category and subcategory */}
                  {(() => {
                    // Organize data by category and subcategory
                    const groupedSections = {};
                    
                    selectedSections.forEach(section => {
                      const categoryName = section.categoryName || section.category || 'Uncategorized';
                      const subcategoryName = section.subcategoryName || section.subcategory || 'Other';
                      
                      if (!groupedSections[categoryName]) {
                        groupedSections[categoryName] = {};
                      }
                      
                      if (!groupedSections[categoryName][subcategoryName]) {
                        groupedSections[categoryName][subcategoryName] = [];
                      }
                      
                      groupedSections[categoryName][subcategoryName].push(section);
                    });
                    
                    // Render groups
                    return Object.entries(groupedSections).map(([category, subcategories]) => (
                      <div key={category} style={{ marginBottom: '32px' }}>
                        {/* Category Heading */}
                        <h3 style={{ 
                          fontSize: '18px', 
                          color: '#333', 
                          borderBottom: '2px solid #0077B6',
                          paddingBottom: '8px',
                          marginBottom: '16px'
                        }}>
                          {category}
                        </h3>
                        
                        {/* Subcategories */}
                        {Object.entries(subcategories).map(([subcategory, sections]) => (
                          <div key={subcategory} style={{ marginBottom: '24px' }}>
                            {/* Sections Table - Without subcategory heading since it will be in the table */}
                            <table style={{
                              width: '100%',
                              borderCollapse: 'collapse',
                              fontSize: '14px',
                              marginBottom: '16px'
                            }}>
                              <thead>
                                <tr style={{
                                  backgroundColor: '#f8f9fa',
                                  textAlign: 'left'
                                }}>
                                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Section</th>
                                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Qty</th>
                                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Unit Price</th>
                                  <th style={{ padding: '10px 16px', fontWeight: '600' }}>Total</th>
                                  <th style={{ padding: '10px 16px', fontWeight: '600' }}></th>
                                </tr>
                              </thead>
                              <tbody>
                                {sections.map((section, index) => (
                                  <tr key={section._id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                      {/* Show subcategory name on first row only */}
                                      {index === 0 && (
                                        <div style={{ 
                                          fontWeight: '600', 
                                          color: '#333', 
                                          fontSize: '15px',
                                          marginBottom: '8px',
                                          borderBottom: '1px dashed #eee',
                                          paddingBottom: '4px'
                                        }}>
                                          {subcategory}
                                        </div>
                                      )}
                                      <div style={{ 
                                        fontWeight: '500',
                                        fontSize: '14px',
                                        color: '#444'
                                      }}>
                                        {section.materialName || 'N/A'}
                                      </div>
                                      <div style={{ 
                                        fontSize: '13px', 
                                        color: '#666', 
                                        marginTop: '4px' 
                                      }}>
                                        {section.description || section.name || section.sectionName}
                                      </div>
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                      {getSectionUnitType(section) === 'area' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {/* Primary measurement fields */}
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                              <input 
                                                type="number"
                                                placeholder="L (cm)"
                                                value={sectionDetails[section._id]?.length || ''}
                                                onChange={(e) => handleSectionDetailChange(section._id, 'length', e.target.value)}
                                                style={{
                                                  width: '60px',
                                                  padding: '6px',
                                                  border: '1px solid #ddd',
                                                  borderRadius: '6px',
                                                  textAlign: 'center',
                                                  color: '#000'
                                                }}
                                              />
                                              <span style={{ margin: '0 8px', color: '#666' }}>×</span>
                                              <input 
                                                type="number"
                                                placeholder="B (cm)"
                                                value={sectionDetails[section._id]?.breadth || ''}
                                                onChange={(e) => handleSectionDetailChange(section._id, 'breadth', e.target.value)}
                                                style={{
                                                  width: '60px',
                                                  padding: '6px',
                                                  border: '1px solid #ddd',
                                                  borderRadius: '6px',
                                                  textAlign: 'center',
                                                  color: '#000'
                                                }}
                                              />
                                            </div>
                                          </div>
                                          
                                          {/* Multiple measurements section */}
                                          {(multipleMeasurements[section._id] || []).map((measurement, index) => (
                                            <div key={index} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '8px',
                                              backgroundColor: '#f8f9fa',
                                              padding: '6px 10px',
                                              borderRadius: '6px'
                                            }}>
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <input 
                                                  type="number"
                                                  placeholder="L (cm)"
                                                  value={measurement.length}
                                                  onChange={(e) => updateMeasurement(section._id, index, 'length', e.target.value)}
                                                  style={{
                                                    width: '60px',
                                                    padding: '6px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '6px',
                                                    textAlign: 'center',
                                                    color: '#000'
                                                  }}
                                                />
                                                <span style={{ margin: '0 8px', color: '#666' }}>×</span>
                                                <input 
                                                  type="number"
                                                  placeholder="B (cm)"
                                                  value={measurement.breadth}
                                                  onChange={(e) => updateMeasurement(section._id, index, 'breadth', e.target.value)}
                                                  style={{
                                                    width: '60px',
                                                    padding: '6px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '6px',
                                                    textAlign: 'center',
                                                    color: '#000'
                                                  }}
                                                />
                                              </div>
                                              <button
                                                onClick={() => removeMeasurement(section._id, index)}
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#dc3545',
                                                  cursor: 'pointer',
                                                  fontSize: '16px',
                                                  marginLeft: 'auto'
                                                }}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                          
                                          {/* Add measurement button */}
                                          <button
                                            onClick={() => handleAddMeasurement(section._id)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: 'none',
                                              border: '1px dashed #0077B6',
                                              borderRadius: '6px',
                                              padding: '4px 10px',
                                              fontSize: '12px',
                                              color: '#0077B6',
                                              fontWeight: '500',
                                              cursor: 'pointer',
                                              marginTop: '4px',
                                              alignSelf: 'flex-start'
                                            }}
                                          >
                                            <span>+</span> Add Measurement
                                          </button>
                                          
                                          <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                            Total Area: <span style={{ fontWeight: '500', color: '#0077B6' }}>
                                              {sectionDetails[section._id]?.quantity || 0} ft²
                                            </span>
                                            {/* Add summary of calculations */}
                                            {(() => {
                                              // Calculate total length and breadth
                                              let totalLength = parseFloat(sectionDetails[section._id]?.length || 0);
                                              let totalBreadth = parseFloat(sectionDetails[section._id]?.breadth || 0);
                                              
                                              // Add from multiple measurements
                                              const measurements = multipleMeasurements[section._id] || [];
                                              measurements.forEach(m => {
                                                if (m.length) totalLength += parseFloat(m.length) || 0;
                                                if (m.breadth) totalBreadth += parseFloat(m.breadth) || 0;
                                              });
                                              
                                              if (totalLength > 0 && totalBreadth > 0) {
                                                return (
                                                  <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                                                    (Total: {totalLength} cm × {totalBreadth} cm)
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </div>
                                      ) : getSectionUnitType(section) === 'running_sqft' ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                          {/* Running lengths measurements */}
                                          {(runningLengths[section._id] || []).map((item, index) => (
                                            <div key={index} style={{ 
                                              display: 'flex', 
                                              alignItems: 'center', 
                                              gap: '8px',
                                              backgroundColor: '#f8f9fa',
                                              padding: '6px 10px',
                                              borderRadius: '6px'
                                            }}>
                                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <input 
                                                  type="number"
                                                  placeholder="Length (cm)"
                                                  value={item.length}
                                                  onChange={(e) => updateRunningLength(section._id, index, e.target.value)}
                                                  style={{
                                                    width: '100px',
                                                    padding: '6px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '6px',
                                                    textAlign: 'center',
                                                    color: '#000'
                                                  }}
                                                />
                                              </div>
                                              <button
                                                onClick={() => removeRunningLength(section._id, index)}
                                                style={{
                                                  background: 'none',
                                                  border: 'none',
                                                  color: '#dc3545',
                                                  cursor: 'pointer',
                                                  fontSize: '16px',
                                                  marginLeft: 'auto'
                                                }}
                                              >
                                                ×
                                              </button>
                                            </div>
                                          ))}
                                          
                                          {/* If no running length entries yet, show a prompt */}
                                          {(!runningLengths[section._id] || runningLengths[section._id].length === 0) && (
                                            <div style={{ 
                                              fontSize: '13px', 
                                              color: '#666', 
                                              fontStyle: 'italic' 
                                            }}>
                                              Add one or more length measurements
                                            </div>
                                          )}
                                          
                                          {/* Add running length button */}
                                          <button
                                            onClick={() => handleAddRunningLength(section._id)}
                                            style={{
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '6px',
                                              background: 'none',
                                              border: '1px dashed #0077B6',
                                              borderRadius: '6px',
                                              padding: '4px 10px',
                                              fontSize: '12px',
                                              color: '#0077B6',
                                              fontWeight: '500',
                                              cursor: 'pointer',
                                              marginTop: '4px',
                                              alignSelf: 'flex-start'
                                            }}
                                          >
                                            <span>+</span> Add Length
                                          </button>
                                          
                                          <div style={{ fontSize: '12px', color: '#555', marginTop: '4px' }}>
                                            Total Length: <span style={{ fontWeight: '500', color: '#0077B6' }}>
                                              {sectionDetails[section._id]?.quantity || 0} ft
                                            </span>
                                            {/* Add summary of calculations */}
                                            {(() => {
                                              // Calculate total length in cm
                                              let totalLengthCm = 0;
                                              
                                              // Add from running lengths
                                              const lengths = runningLengths[section._id] || [];
                                              lengths.forEach(l => {
                                                if (l.length) totalLengthCm += parseFloat(l.length) || 0;
                                              });
                                              
                                              if (totalLengthCm > 0) {
                                                return (
                                                  <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                                                    (Total: {totalLengthCm} cm)
                                                  </div>
                                                );
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </div>
                                      ) : (
                                        <input 
                                          type="number"
                                          placeholder="Pieces"
                                          value={sectionDetails[section._id]?.quantity || ''}
                                          onChange={(e) => handleSectionDetailChange(section._id, 'quantity', e.target.value)}
                                          style={{
                                            width: '60px',
                                            padding: '8px',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            color: '#000'
                                          }}
                                        />
                                      )}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                      <input 
                                        type="number"
                                        value={sectionDetails[section._id]?.unitPrice || section.price || ''}
                                        onChange={(e) => handleSectionDetailChange(section._id, 'unitPrice', e.target.value)}
                                        style={{
                                          width: '80px',
                                          padding: '8px',
                                          border: '1px solid #ddd',
                                          borderRadius: '6px',
                                          textAlign: 'center',
                                          color: '#000'
                                        }}
                                      />
                                    </td>
                                    <td style={{ 
                                      padding: '12px 16px', 
                                      fontWeight: '600',
                                      color: '#0077B6'
                                    }}>
                                      ₹{Math.ceil((sectionDetails[section._id]?.quantity || 0) * (sectionDetails[section._id]?.unitPrice || section.price || 0))}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                      <button 
                                        onClick={() => handleSectionSelect(section)}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: '#dc3545',
                                          cursor: 'pointer',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          fontSize: '14px',
                                          transition: 'background-color 0.2s'
                                        }}
                                      >
                                        ✕
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ))}
                      </div>
                    ));
                  })()}
                </div>
                
                {/* Total and generate button */}
                <div style={{ 
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #eee',
                  paddingTop: '20px'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600'
                  }}>
                    <span>Grand Total: </span>
                    <span style={{ color: '#0077B6' }}>₹{Math.ceil(totalAmount)}</span>
                  </div>
                  
                  <button 
                    onClick={handleGenerateEstimate}
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: '#0077B6',
                      color: 'white',
                      border: 'none',
                      padding: '12px 24px',
                      borderRadius: '8px',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer',
                      fontWeight: '600',
                      fontSize: '15px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background-color 0.2s',
                      opacity: isSubmitting ? 0.7 : 1
                    }}
                  >
                    {isSubmitting ? 'Generating...' : 'Save and Preview Estimate'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Item Modal */}
      {showCustomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            padding: '24px',
            width: '90%',
            maxWidth: '550px',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600', 
                margin: 0,
                color: '#333'
              }}>Add Custom Item</h3>
              <button
                onClick={() => setShowCustomModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#666'
                }}
              >
                ×
              </button>
            </div>

            {/* Custom Item Form */}
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Category */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Category *
                </label>
                <input
                  type="text"
                  value={customItem.category}
                  onChange={(e) => handleCustomItemChange('category', e.target.value)}
                  placeholder="Enter category name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    color: '#000'
                  }}
                />
              </div>

              {/* Subcategory */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Subcategory *
                </label>
                <input
                  type="text"
                  value={customItem.subcategory}
                  onChange={(e) => handleCustomItemChange('subcategory', e.target.value)}
                  placeholder="Enter subcategory name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    color: '#000'
                  }}
                />
              </div>

              {/* Material */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Material
                </label>
                <input
                  type="text"
                  value={customItem.material}
                  onChange={(e) => handleCustomItemChange('material', e.target.value)}
                  placeholder="Enter material name"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    color: '#000'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Description *
                </label>
                <input
                  type="text"
                  value={customItem.description}
                  onChange={(e) => handleCustomItemChange('description', e.target.value)}
                  placeholder="Enter item description"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    color: '#000'
                  }}
                />
              </div>

              {/* Price */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Unit Price *
                </label>
                <input
                  type="number"
                  value={customItem.price}
                  onChange={(e) => handleCustomItemChange('price', e.target.value)}
                  placeholder="Enter price"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    fontSize: '14px',
                    color: '#000'
                  }}
                />
              </div>

              {/* Unit Type Radio */}
              <div>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '8px', 
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#444'
                }}>
                  Unit Type
                </label>
                <div style={{ 
                  display: 'flex', 
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="unitType"
                      value="pieces"
                      checked={customItem.unitType === "pieces"}
                      onChange={() => handleCustomItemChange('unitType', 'pieces')}
                    />
                    Pieces
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="unitType"
                      value="area"
                      checked={customItem.unitType === "area"}
                      onChange={() => handleCustomItemChange('unitType', 'area')}
                    />
                    Area (L × W)
                  </label>
                  <label style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="unitType"
                      value="running_sqft"
                      checked={customItem.unitType === "running_sqft"}
                      onChange={() => handleCustomItemChange('unitType', 'running_sqft')}
                    />
                    Running Sq. Feet
                  </label>
                </div>
              </div>

              {/* Form Actions */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'flex-end',
                gap: '12px',
                marginTop: '8px'
              }}>
                <button
                  onClick={() => setShowCustomModal(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddCustomItem}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: '#0077B6',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EstimateGenerationClient; 