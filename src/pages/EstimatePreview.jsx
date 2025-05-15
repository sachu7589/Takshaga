import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Swal from 'sweetalert2';
import Sidebar from "../components/Sidebar";
import '../assets/styles/EstimatePreview.css';
import { FileDown, Send, Edit2, Save } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { motion } from "framer-motion";
import styled from "styled-components";

// Styled Components
const PageContainer = styled(motion.div)`
  background: linear-gradient(135deg, #f6f9fc 0%, #f1f5f9 100%);
  min-height: 100vh;
  max-height: 100vh;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
    
    &:hover {
      background: #64748b;
    }
  }
`;

const ContentWrapper = styled.div`
  padding: 2rem;
  height: calc(100vh - 60px);
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #94a3b8;
    border-radius: 4px;
    
    &:hover {
      background: #64748b;
    }
  }
`;

const Card = styled(motion.div)`
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  overflow-y: visible;
`;

const StyledButton = styled(motion.button)`
  background: ${props => props.variant === 'primary' ? '#3b82f6' : '#2563eb'};
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(59, 130, 246, 0.2);
  }
`;

// Define constants
const CM_TO_FT_CONVERSION = 0.0328084; // Conversion factor: 1 cm = 0.0328084 ft
const CM2_TO_FT2_CONVERSION = 0.00107639; // Conversion factor: 1 cm² = 0.00107639 ft²

function EstimatePreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [estimate, setEstimate] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedEstimate, setEditedEstimate] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [useCustomTotal, setUseCustomTotal] = useState(false);
  const [subTotal, setSubTotal] = useState(0);

  const [customPaymentTerms, setCustomPaymentTerms] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    category: "",
    subcategory: "",
    material: "",
    description: "",
    price: "",
    unitType: "pieces" // Default unit type
  });
  
  // Add state for multiple measurements (for area unit type)
  const [multipleMeasurements, setMultipleMeasurements] = useState({});
  
  // Add state for running feet measurements
  const [runningLengths, setRunningLengths] = useState({});

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/display/${id}`);
        if (response.data) {
          const estimateData = response.data;
          setEstimate(estimateData);
          setEditedEstimate(estimateData);
          setGrandTotal(estimateData.grandTotal);
          
          // Calculate subTotal from sections
          const calculatedSubTotal = estimateData.sections.reduce((total, section) => {
            return total + parseFloat(section.total || 0);
          }, 0);
          setSubTotal(calculatedSubTotal);
          
          // Calculate discount if subTotal and grandTotal are different
          if (calculatedSubTotal !== estimateData.grandTotal) {
            setShowDiscount(true);
            setDiscountAmount((calculatedSubTotal - estimateData.grandTotal).toFixed(2));
          } else {
            // Always set up the discount checkbox, but with 0 amount
            setShowDiscount(true);
            setDiscountAmount(0);
          }
          
          // Set custom payment terms if available
          if (estimateData.paymentTerms) {
            setCustomPaymentTerms(estimateData.paymentTerms);
          }
        } else {
          throw new Error('Failed to fetch estimate');
        }
      } catch (error) {
        console.error('Error fetching estimate:', error);
        Swal.fire({
          title: 'Error!',
          text: 'Failed to load estimate',
          icon: 'error',
          confirmButtonText: 'OK'
        }).then(() => {
          navigate('/dashboard');
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEstimate();
  }, [id, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleEdit = () => {
    setIsEditing(true);
    
    // Initialize measurements for sections with area or running sq ft type
    if (editedEstimate && editedEstimate.sections) {
      const areaInitializations = {};
      const runningInitializations = {};
      
      editedEstimate.sections.forEach(section => {
        const sectionId = section._id || section.id;
        if (!sectionId) return; // Skip if no id
        
        const unitType = getSectionUnitType(section);
        
        // Initialize measurements for area sections
        if (unitType === 'area') {
          // If measurements exist in the database, use them
          if (section.measurements && section.measurements.length > 0) {
            // Use the first measurement as primary inputs
            const primaryMeasurement = section.measurements[0];
            if (primaryMeasurement) {
              section.length = primaryMeasurement.length || '';
              section.breadth = primaryMeasurement.breadth || '';
            }
            
            // Add additional measurements (skip the first one as it's the primary)
            if (section.measurements.length > 1) {
              areaInitializations[sectionId] = section.measurements.slice(1).map(m => ({
                length: m.length,
                breadth: m.breadth,
                area: m.area || (m.length * m.breadth * CM2_TO_FT2_CONVERSION).toFixed(2)
              }));
            }
          }
        }
        
        // Initialize running length sections
        if (unitType === 'running_sqft') {
          // If there are actual measurements stored, convert them to running lengths
          if (section.measurements && section.measurements.length > 0) {
            // Extract lengths from measurements
            runningInitializations[sectionId] = section.measurements.map(m => ({
              length: m.length.toString()
            }));
          } else if (section.runningLengths && section.runningLengths.length > 0) {
            // If already has runningLengths property
            runningInitializations[sectionId] = section.runningLengths;
          } else if (section.quantity) {
            // If no measurements but has quantity, create a single measurement
            // that would approximate the same total
            const totalCm = parseFloat(section.quantity) / CM_TO_FT_CONVERSION;
            runningInitializations[sectionId] = [{ length: totalCm.toFixed(2) }];
          } else {
            // Default empty initialization
            runningInitializations[sectionId] = [{ length: '' }];
          }
        }
      });
      
      // Set initialized measurements
      if (Object.keys(areaInitializations).length > 0) {
        setMultipleMeasurements(areaInitializations);
      }
      
      if (Object.keys(runningInitializations).length > 0) {
        setRunningLengths(runningInitializations);
      }
    }
  };

  const handleSave = async () => {
    try {
      // Calculate sub-total from sections
      const calculatedSubTotal = editedEstimate.sections.reduce((total, section) => {
        return total + parseFloat(section.total || 0);
      }, 0);

      // Apply ceiling to the grand total to match EstimateGenerationClient
      const ceiledGrandTotal = Math.ceil(grandTotal);

      // Prepare sections with measurements included
      const sectionsWithMeasurements = editedEstimate.sections.map(section => {
        const sectionId = section._id || section.id;
        const unitType = getSectionUnitType(section);
        
        // Create a clean section object that matches the mongoose schema
        const sectionCopy = {
          // Only include _id if it's not a temporary client-side ID
          ...(section._id && !section._id.toString().startsWith('custom_') ? { _id: section._id } : {}),
          
          // Required fields from schema
          category: section.category || 'Uncategorized',
          subcategory: section.subcategory || 'Other',
          material: section.material || '',
          description: section.description || '',
          unitPrice: parseFloat(section.unitPrice) || 0,
          quantity: parseFloat(section.quantity) || 0,
          total: parseFloat(section.total) || 0
        };
        
        // Handle area measurements
        if (unitType === 'area') {
          const allMeasurements = [];
          
          // Add primary measurement if it exists
          const primaryLength = parseFloat(section.length) || 0;
          const primaryBreadth = parseFloat(section.breadth) || 0;
          
          if (primaryLength > 0 && primaryBreadth > 0) {
            allMeasurements.push({
              length: primaryLength,
              breadth: primaryBreadth,
              area: parseFloat((primaryLength * primaryBreadth * CM2_TO_FT2_CONVERSION).toFixed(2))
            });
          }
          
          // Add additional measurements
          const additionalMeasurements = multipleMeasurements[sectionId] || [];
          additionalMeasurements.forEach(m => {
            const mLength = parseFloat(m.length) || 0;
            const mBreadth = parseFloat(m.breadth) || 0;
            if (mLength > 0 && mBreadth > 0) {
              allMeasurements.push({
                length: mLength,
                breadth: mBreadth,
                area: parseFloat((mLength * mBreadth * CM2_TO_FT2_CONVERSION).toFixed(2))
              });
            }
          });
          
          // Add measurements to section - ensure this matches the schema
          if (allMeasurements.length > 0) {
            sectionCopy.measurements = allMeasurements;
          } else {
            // If no measurements, provide an empty array
            sectionCopy.measurements = [];
          }
        }
        
        // Handle running lengths
        if (unitType === 'running_sqft') {
          const sectionRunningLengths = runningLengths[sectionId] || [];
          if (sectionRunningLengths.length > 0) {
            // Filter out empty measurements
            const validLengths = sectionRunningLengths.filter(l => l.length && parseFloat(l.length) > 0);
            if (validLengths.length > 0) {
              // Store running lengths in a format compatible with measurements schema
              const formattedLengths = validLengths.map(l => ({
                length: parseFloat(l.length) || 0,
                breadth: 1, // Default breadth for running measurement
                area: parseFloat((parseFloat(l.length) || 0) * CM_TO_FT_CONVERSION).toFixed(2)
              }));
              
              // Store properly formatted measurements
              sectionCopy.measurements = formattedLengths;
              
              // Remove runningLengths property before sending to server
              // as it's not in the schema and only used for UI
              delete sectionCopy.runningLengths;
            } else {
              sectionCopy.measurements = [];
            }
          } else {
            sectionCopy.measurements = [];
          }
        }
        
        // For standard "pieces" type, ensure no measurements are sent
        if (unitType === 'pieces') {
          sectionCopy.measurements = [];
        }
        
        // Remove unitType property before sending to server
        // as it's not in the schema and only used for UI
        delete sectionCopy.unitType;
        
        // Remove any client-side only properties that aren't in the schema
        delete sectionCopy.length;
        delete sectionCopy.breadth;
        delete sectionCopy.id;
        
        return sectionCopy;
      });

      const updatedEstimate = {
        name: editedEstimate.name,
        clientId: editedEstimate.clientId,
        clientName: editedEstimate.clientName,
        sections: sectionsWithMeasurements,
        discount: showDiscount ? parseFloat(discountAmount) : 0,
        total: calculatedSubTotal,
        grandTotal: ceiledGrandTotal,
        status: editedEstimate.status || 1,
        paymentTerms: customPaymentTerms
      };

      console.log("Sending to server:", JSON.stringify(updatedEstimate, null, 2));
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estimates/update/${id}`,
        updatedEstimate
      );
      
      if (response.data) {
        console.log("Response from server:", response.data);
        
        // Update state with the newly returned data from the server
        setEstimate(response.data);
        setEditedEstimate(response.data);
        setGrandTotal(ceiledGrandTotal);
        setIsEditing(false);
        
        // Reinitialize measurements data structures with the returned data
        // This ensures state consistency with what's in the database
        const newMultipleMeasurements = {};
        const newRunningLengths = {};
        
        if (response.data.sections) {
          response.data.sections.forEach(section => {
            const sectionId = section._id;
            if (!sectionId) return; // Skip if no valid ID
            
            const unitType = getSectionUnitType(section);
            
            // Handle area measurements
            if (unitType === 'area' && section.measurements && section.measurements.length > 0) {
              // First measurement is used as primary
              const firstMeasurement = section.measurements[0];
              if (firstMeasurement) {
                section.length = firstMeasurement.length;
                section.breadth = firstMeasurement.breadth;
              }
              
              // Additional measurements go to the multipleMeasurements state
              if (section.measurements.length > 1) {
                newMultipleMeasurements[sectionId] = section.measurements.slice(1);
              }
            }
            
            // Handle running lengths
            if (unitType === 'running_sqft' && section.measurements && section.measurements.length > 0) {
              newRunningLengths[sectionId] = section.measurements.map(m => ({
                length: m.length.toString()
              }));
            }
          });
        }
        
        // Update state with new measurements data
        setMultipleMeasurements(newMultipleMeasurements);
        setRunningLengths(newRunningLengths);
        
        Swal.fire({
          title: 'Success!',
          text: 'Estimate updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        throw new Error('Failed to update estimate');
      }
    } catch (error) {
      console.error('Error updating estimate:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update estimate',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSaveDiscount = async () => {
    try {
      // Apply ceiling to grand total to match EstimateGenerationClient
      const ceiledGrandTotal = Math.ceil(grandTotal);
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estimates/update/${id}`,
        { 
          discount: showDiscount ? parseFloat(discountAmount) : 0,
          grandTotal: ceiledGrandTotal 
        }
      );
      
      if (response.data) {
        setEstimate({
          ...estimate,
          grandTotal: ceiledGrandTotal,
          discount: showDiscount ? parseFloat(discountAmount) : 0
        });
        setEditedEstimate({
          ...editedEstimate,
          grandTotal: ceiledGrandTotal,
          discount: showDiscount ? parseFloat(discountAmount) : 0
        });
        Swal.fire({
          title: 'Success!',
          text: 'Grand total updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      } else {
        throw new Error('Failed to update grand total');
      }
    } catch (error) {
      console.error('Error updating grand total:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to update grand total',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...editedEstimate.sections];
    updatedSections[index] = {
      ...updatedSections[index],
      [field]: value
    };
    
    // Recalculate total for the section
    if (field === 'unitPrice' || field === 'quantity') {
      const quantity = parseFloat(updatedSections[index].quantity) || 0;
      const unitPrice = parseFloat(updatedSections[index].unitPrice) || 0;
      updatedSections[index].total = (quantity * unitPrice).toFixed(2);
    }
    
    // Calculate quantity if length and breadth are set for area unit type
    if ((field === 'length' || field === 'breadth') && getSectionUnitType(updatedSections[index]) === 'area') {
      const section = updatedSections[index];
      const sectionId = section._id || section.id;
      
      // Calculate the total area using all measurements
      let totalAreaCm = 0;
      
      // Add area from primary measurement if both length and breadth exist
      const primaryLength = parseFloat(section.length) || 0;
      const primaryBreadth = parseFloat(section.breadth) || 0;
      
      if (primaryLength > 0 && primaryBreadth > 0) {
        totalAreaCm += primaryLength * primaryBreadth;
      }
      
      // Add areas from additional measurements
      const additionalMeasurements = multipleMeasurements[sectionId] || [];
      additionalMeasurements.forEach((m) => {
        const mLength = parseFloat(m.length) || 0;
        const mBreadth = parseFloat(m.breadth) || 0;
        if (mLength > 0 && mBreadth > 0) {
          const area = mLength * mBreadth;
          totalAreaCm += area;
        }
      });
      
      // Convert total area from cm² to ft²
      const totalAreaFt = (totalAreaCm * CM2_TO_FT2_CONVERSION).toFixed(2);
      
      if (totalAreaCm > 0) {
        // Update quantity with calculated area
        updatedSections[index].quantity = totalAreaFt;
        
        // Update total price
        const unitPrice = parseFloat(section.unitPrice) || 0;
        updatedSections[index].total = (parseFloat(totalAreaFt) * unitPrice).toFixed(2);
      }
    }
    
    // Recalculate subTotal
    const newSubTotal = updatedSections.reduce((total, section) => {
      return total + parseFloat(section.total || 0);
    }, 0);
    
    setSubTotal(newSubTotal);
    
    // Update grand total if discount is applied
    if (showDiscount) {
      const discountValue = parseFloat(discountAmount) || 0;
      setGrandTotal((newSubTotal - discountValue).toFixed(2));
    } else {
      setGrandTotal(newSubTotal.toFixed(2));
    }
    
    setEditedEstimate({
      ...editedEstimate,
      sections: updatedSections
    });
  };
  
  // Add handler for multiple measurements
  const handleAddMeasurement = (sectionId) => {
    setMultipleMeasurements(prev => {
      const currentMeasurements = prev[sectionId] || [];
      // Add a new measurement with default empty values
      const updatedMeasurements = [
        ...currentMeasurements,
        { length: '', breadth: '', area: 0 }
      ];
      
      // Return updated measurements
      return {
        ...prev,
        [sectionId]: updatedMeasurements
      };
    });
    
    // Find the section in the editedEstimate to trigger recalculation
    const sectionIndex = editedEstimate.sections.findIndex(s => (s._id === sectionId || s.id === sectionId));
    
    // If we found the section, trigger a recalculation
    if (sectionIndex !== -1) {
      // Get the section's current values
      const section = editedEstimate.sections[sectionIndex];
      
      // Simulate a change to force recalculation
      if (section.length || section.breadth) {
        // Force a recalculation by setting the primary length to its current value
        setTimeout(() => {
          handleSectionChange(
            sectionIndex, 
            'length', 
            section.length || ''
          );
        }, 0);
      }
    }
  };

  // Add handler to update multiple measurements
  const updateMeasurement = (sectionId, index, field, value) => {
    setMultipleMeasurements(prev => {
      const newMeasurements = [...(prev[sectionId] || [])];
      
      if (!newMeasurements[index]) {
        newMeasurements[index] = { length: '', breadth: '', area: 0 };
      }
      
      // Update the specific field in the measurement at the given index
      newMeasurements[index] = {
        ...newMeasurements[index],
        [field]: value
      };
      
      // Find the section in the editedEstimate
      const sectionIndex = editedEstimate.sections.findIndex(s => s._id === sectionId || s.id === sectionId);
      if (sectionIndex === -1) return prev;
      
      // Get the section
      const section = editedEstimate.sections[sectionIndex];
      
      // Calculate the total area using all measurements
      let totalAreaCm = 0;
      
      // Add area from primary measurement if both length and breadth exist
      const primaryLength = parseFloat(section.length) || 0;
      const primaryBreadth = parseFloat(section.breadth) || 0;
      
      if (primaryLength > 0 && primaryBreadth > 0) {
        totalAreaCm += primaryLength * primaryBreadth;
      }
      
      // Add areas from additional measurements
      for (const m of newMeasurements) {
        const mLength = parseFloat(m.length) || 0;
        const mBreadth = parseFloat(m.breadth) || 0;
        if (mLength > 0 && mBreadth > 0) {
          totalAreaCm += mLength * mBreadth;
        }
      }
      
      // Convert total area from cm² to ft²
      const totalAreaFt = (totalAreaCm * CM2_TO_FT2_CONVERSION).toFixed(2);
      
      if (totalAreaCm > 0) {
        // Update the section with the calculated quantity
        const updatedSections = [...editedEstimate.sections];
        updatedSections[sectionIndex].quantity = totalAreaFt;
        
        // Update total
        const unitPrice = parseFloat(updatedSections[sectionIndex].unitPrice) || 0;
        updatedSections[sectionIndex].total = (parseFloat(totalAreaFt) * unitPrice).toFixed(2);
        
        // Update the edited estimate
        setEditedEstimate({
          ...editedEstimate,
          sections: updatedSections
        });
        
        // Calculate new subtotal directly
        const newSubTotal = updatedSections.reduce((total, section) => {
          return total + parseFloat(section.total || 0);
        }, 0);
        
        // Update subtotal
        setSubTotal(newSubTotal);
        
        // Update grand total if discount is applied
        if (showDiscount) {
          const discountValue = parseFloat(discountAmount) || 0;
          setGrandTotal((newSubTotal - discountValue).toFixed(2));
        } else {
          setGrandTotal(newSubTotal.toFixed(2));
        }
      }
      
      return {
        ...prev,
        [sectionId]: newMeasurements
      };
    });
  };

  // Add handler to remove measurement
  const removeMeasurement = (sectionId, index) => {
    setMultipleMeasurements(prev => {
      const currentMeasurements = [...(prev[sectionId] || [])];
      
      // Store the removed measurement before removing it
      const removedMeasurement = currentMeasurements[index];
      
      // Remove the measurement
      currentMeasurements.splice(index, 1);
      
      // Find the section in the editedEstimate
      const sectionIndex = editedEstimate.sections.findIndex(s => s._id === sectionId || s.id === sectionId);
      if (sectionIndex !== -1) {
        // Get the section
        const section = editedEstimate.sections[sectionIndex];
        
        // Calculate the total area using all remaining measurements
        let totalAreaCm = 0;
        
        // Add area from primary measurement if both length and breadth exist
        const primaryLength = parseFloat(section.length) || 0;
        const primaryBreadth = parseFloat(section.breadth) || 0;
        
        if (primaryLength > 0 && primaryBreadth > 0) {
          totalAreaCm += primaryLength * primaryBreadth;
        }
        
        // Add areas from additional measurements
        for (const m of currentMeasurements) {
          const mLength = parseFloat(m.length) || 0;
          const mBreadth = parseFloat(m.breadth) || 0;
          if (mLength > 0 && mBreadth > 0) {
            totalAreaCm += mLength * mBreadth;
          }
        }
        
        // Convert total area from cm² to ft²
        const totalAreaFt = (totalAreaCm * CM2_TO_FT2_CONVERSION).toFixed(2);
        
        if (totalAreaCm > 0 || (removedMeasurement && (parseFloat(removedMeasurement.length) || parseFloat(removedMeasurement.breadth)))) {
          // Update the section with the calculated quantity
          const updatedSections = [...editedEstimate.sections];
          updatedSections[sectionIndex].quantity = totalAreaFt;
          
          // Update total
          const unitPrice = parseFloat(updatedSections[sectionIndex].unitPrice) || 0;
          updatedSections[sectionIndex].total = (parseFloat(totalAreaFt) * unitPrice).toFixed(2);
          
          // Update the edited estimate
          setEditedEstimate({
            ...editedEstimate,
            sections: updatedSections
          });
          
          // Calculate new subtotal directly
          const newSubTotal = updatedSections.reduce((total, section) => {
            return total + parseFloat(section.total || 0);
          }, 0);
          
          // Update subtotal
          setSubTotal(newSubTotal);
          
          // Update grand total if discount is applied
          if (showDiscount) {
            const discountValue = parseFloat(discountAmount) || 0;
            setGrandTotal((newSubTotal - discountValue).toFixed(2));
          } else {
            setGrandTotal(newSubTotal.toFixed(2));
          }
        }
      }
      
      // Return updated measurements
      return {
        ...prev,
        [sectionId]: currentMeasurements
      };
    });
  };
  
  // Add handler for running feet measurements
  const handleAddRunningLength = (sectionId) => {
    setRunningLengths(prev => {
      // Check if we already have any lengths for this section
      const currentLengths = prev[sectionId] || [];
      
      // If we already have at least one length, only then add a new one
      // Otherwise, just initialize with a single empty length
      if (currentLengths.length > 0) {
        return {
          ...prev,
          [sectionId]: [
            ...currentLengths,
            { length: '' }
          ]
        };
      } else {
        // Initialize with just one measurement
        return {
          ...prev,
          [sectionId]: [{ length: '' }]
        };
      }
    });
  };

  // Update running length measurement
  const updateRunningLength = (sectionId, index, value) => {
    setRunningLengths(prev => {
      const newLengths = [...(prev[sectionId] || [])];
      
      // Update the length value
      if (!newLengths[index]) {
        newLengths[index] = { length: value };
      } else {
        newLengths[index] = {
          ...newLengths[index],
          length: value
        };
      }
      
      // Find the section in the editedEstimate
      const sectionIndex = editedEstimate.sections.findIndex(s => s._id === sectionId || s.id === sectionId);
      if (sectionIndex === -1) return prev;
      
      // Calculate the sum of all lengths
      let totalLengthCm = 0;
      
      newLengths.forEach(l => {
        if (l.length) totalLengthCm += parseFloat(l.length) || 0;
      });
      
      // Convert cm to feet
      const totalLengthFt = (totalLengthCm * CM_TO_FT_CONVERSION).toFixed(2);
      
      // Update the section with the new quantity
      const updatedSections = [...editedEstimate.sections];
      updatedSections[sectionIndex].quantity = totalLengthFt;
      
      // Update total price
      const unitPrice = parseFloat(updatedSections[sectionIndex].unitPrice) || 0;
      updatedSections[sectionIndex].total = (parseFloat(totalLengthFt) * unitPrice).toFixed(2);
      
      // Update the edited estimate
      setEditedEstimate({
        ...editedEstimate,
        sections: updatedSections
      });
      
      // Calculate new subtotal
      const newSubTotal = updatedSections.reduce((total, section) => {
        return total + parseFloat(section.total || 0);
      }, 0);
      
      // Update subtotal
      setSubTotal(newSubTotal);
      
      // Update grand total if discount is applied
      if (showDiscount) {
        const discountValue = parseFloat(discountAmount) || 0;
        setGrandTotal((newSubTotal - discountValue));
      } else {
        setGrandTotal(newSubTotal);
      }
      
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
      
      // Remove the length entry
      newLengths.splice(index, 1);
      
      // Find the section in the editedEstimate
      const sectionIndex = editedEstimate.sections.findIndex(s => s._id === sectionId || s.id === sectionId);
      if (sectionIndex === -1) return prev;
      
      // Calculate the sum of all lengths
      let totalLengthCm = 0;
      
      newLengths.forEach(l => {
        if (l.length) totalLengthCm += parseFloat(l.length) || 0;
      });
      
      // Convert cm to feet
      const totalLengthFt = (totalLengthCm * CM_TO_FT_CONVERSION).toFixed(2);
      
      // Update the section with the new quantity
      const updatedSections = [...editedEstimate.sections];
      updatedSections[sectionIndex].quantity = totalLengthFt;
      
      // Update total
      const unitPrice = parseFloat(updatedSections[sectionIndex].unitPrice) || 0;
      updatedSections[sectionIndex].total = (parseFloat(totalLengthFt) * unitPrice).toFixed(2);
      
      // Update the edited estimate
      setEditedEstimate({
        ...editedEstimate,
        sections: updatedSections
      });
      
      // Calculate new subtotal
      const newSubTotal = updatedSections.reduce((total, section) => {
        return total + parseFloat(section.total || 0);
      }, 0);
      
      // Update subtotal
      setSubTotal(newSubTotal);
      
      // Update grand total if discount is applied
      if (showDiscount) {
        const discountValue = parseFloat(discountAmount) || 0;
        setGrandTotal(newSubTotal - discountValue);
      } else {
        setGrandTotal(newSubTotal);
      }
      
      // If all lengths are removed, add one empty length measurement
      if (newLengths.length === 0) {
        // Just initialize with a single empty length
        return {
          ...prev,
          [sectionId]: [{ length: '' }]
        };
      }
      
      return {
        ...prev,
        [sectionId]: newLengths
      };
    });
  };
  
  // Helper function to determine unit type based on section data
  const getSectionUnitType = (section) => {
    if (!section) return 'pieces'; // Default if no section
    
    // If explicitly set in UI, use that
    if (section.unitType) return section.unitType;
    
    // Check if it has measurements property for area type
    if (section.measurements && section.measurements.length > 0) {
      // Check the first measurement to see if it's an area measurement
      const firstMeasurement = section.measurements[0];
      if (firstMeasurement && 
          firstMeasurement.length > 0 && 
          firstMeasurement.breadth > 0) {
        return 'area';
      }
      
      // If it has measurements but they don't have breadth > 0, it's likely running feet
      return 'running_sqft';
    }
    
    // Has running lengths property (UI-specific)
    if (section.runningLengths && section.runningLengths.length > 0) {
      return 'running_sqft';
    }
    
    // Try to infer from other properties or names
    const nameInLowerCase = (section.description || '').toLowerCase();
    
    // Check for area-related terms
    if (nameInLowerCase.includes('area') || 
        nameInLowerCase.includes('square') || 
        nameInLowerCase.includes('sq ft') || 
        nameInLowerCase.includes('sqft')) {
      return 'area';
    }
    
    // Check for running-length related terms
    if (nameInLowerCase.includes('running') || 
        nameInLowerCase.includes('r.ft') || 
        nameInLowerCase.includes('rft') ||
        nameInLowerCase.includes('length')) {
      return 'running_sqft';
    }
    
    // Default to pieces
    return 'pieces';
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscountAmount(value);
    // Calculate new grand total by subtracting discount from subtotal
    const newGrandTotal = subTotal - value;
    setGrandTotal(newGrandTotal);
  };

  const handleGrandTotalChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setGrandTotal(value); // Store the exact value entered
    // Calculate new discount amount based on the difference between subtotal and entered grand total
    const newDiscount = subTotal - value;
    setDiscountAmount(newDiscount.toFixed(2));
  };

  const handleQuantityChange = (sectionIndex, value) => {
    const updatedSections = [...editedEstimate.sections];
    const section = updatedSections[sectionIndex];
    
    // Update quantity and recalculate total
    updatedSections[sectionIndex] = {
      ...section,
      quantity: value,
      total: (value * section.unitPrice).toFixed(2)
    };
    
    // Recalculate subTotal
    const newSubTotal = updatedSections.reduce((total, section) => {
      return total + parseFloat(section.total || 0);
    }, 0);
    
    setSubTotal(newSubTotal);
    setEditedEstimate({
      ...editedEstimate,
      sections: updatedSections,
      total: newSubTotal.toFixed(2)
    });
  };

  const handleRemoveSection = (index) => {
    const updatedSections = [...editedEstimate.sections];
    
    // Get the section before removing it to clean up related state
    const removingSection = updatedSections[index];
    const sectionId = removingSection._id || removingSection.id;
    
    // Remove section
    updatedSections.splice(index, 1);
    
    // Clean up measurements state for this section
    if (sectionId) {
      // Clean up multiple measurements if they exist
      setMultipleMeasurements(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
      
      // Clean up running lengths if they exist
      setRunningLengths(prev => {
        const updated = { ...prev };
        delete updated[sectionId];
        return updated;
      });
    }
    
    // Recalculate subTotal
    const newSubTotal = updatedSections.reduce((total, section) => {
      return total + parseFloat(section.total || 0);
    }, 0);
    
    // Update subtotal
    setSubTotal(newSubTotal);
    
    // Update grand total based on discount
    if (showDiscount) {
      const discountValue = parseFloat(discountAmount) || 0;
      // Ensure discount doesn't make grand total negative
      const newGrandTotal = Math.max(0, newSubTotal - discountValue);
      setGrandTotal(newGrandTotal);
    } else {
      // If no discount, grand total equals subtotal
      setGrandTotal(newSubTotal);
    }
    
    // Update edited estimate with new sections
    setEditedEstimate({
      ...editedEstimate,
      sections: updatedSections,
      total: newSubTotal.toFixed(2),
      grandTotal: showDiscount ? 
        Math.max(0, newSubTotal - parseFloat(discountAmount) || 0).toFixed(2) : 
        newSubTotal.toFixed(2)
    });
  };

  const handleAddSection = () => {
    setShowCustomModal(true);
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

    // Create a new section object from the custom item with unit type specific properties
    const unitPrice = parseFloat(customItem.price) || 0;
    
    // Create base section that follows mongoose schema requirements
    const baseSection = {
      // Use a temporary client ID - this will be removed during save
      _id: `custom_${Date.now()}`,
      
      // Required schema fields - ensure all are present
      category: customItem.category,
      subcategory: customItem.subcategory,
      material: customItem.material || '',
      description: customItem.description,
      unitPrice: unitPrice,
      quantity: 1, // Default quantity, will be updated for area/running types
      total: unitPrice, // Initial total, will be updated if needed
      measurements: [], // Initialize empty measurements array (required by schema)
      
      // UI-specific field, not in schema but used for tracking
      unitType: customItem.unitType
    };

    let newSection;
    
    // Handle different unit types
    if (customItem.unitType === 'area') {
      // For area measurements
      newSection = {
        ...baseSection,
        length: '', // For primary measurement (UI only)
        breadth: '' // For primary measurement (UI only)
      };
    } else if (customItem.unitType === 'running_sqft') {
      // For running feet measurements
      newSection = {
        ...baseSection,
        // This will be used only for UI - will be converted to measurements on save
        runningLengths: []
      };
    } else {
      // For pieces/default - no extra fields needed
      newSection = {
        ...baseSection
      };
    }
    
    // Add to sections
    const sectionsWithNewItem = [...editedEstimate.sections, newSection];
    
    // Recalculate subTotal after adding the new section
    const updatedSubTotal = sectionsWithNewItem.reduce((total, section) => {
      return total + parseFloat(section.total || 0);
    }, 0);
    
    // Update subtotal
    setSubTotal(updatedSubTotal);
    
    // Update grand total based on discount
    if (showDiscount) {
      const discountValue = parseFloat(discountAmount) || 0;
      // Ensure discount doesn't make grand total negative
      const newGrandTotal = Math.max(0, updatedSubTotal - discountValue);
      setGrandTotal(newGrandTotal);
    } else {
      // If no discount, grand total equals subtotal
      setGrandTotal(updatedSubTotal);
    }
    
    // Update edited estimate
    setEditedEstimate({
      ...editedEstimate,
      sections: sectionsWithNewItem,
      total: updatedSubTotal.toFixed(2),
      grandTotal: showDiscount ? 
        Math.max(0, updatedSubTotal - parseFloat(discountAmount) || 0).toFixed(2) : 
        updatedSubTotal.toFixed(2)
    });
    
    // If it's a running_sqft type, initialize with one empty measurement
    if (newSection.unitType === 'running_sqft') {
      // Initialize with a single measurement field in the UI state
      setRunningLengths(prev => ({
        ...prev,
        [newSection._id]: [{ length: '' }]
      }));
    }

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

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add border to first page
      doc.setDrawColor(41, 128, 185); // Blue border
      doc.setLineWidth(1.5);
      doc.rect(5, 5, 200, 287);
      
      // Add header background
      doc.setFillColor(52, 152, 219); // Light blue header
      doc.rect(5, 5, 200, 45, 'F');
      
      // Add logo and company details only on first page
      const logoUrl = '/takshaga.png';
      // x: 10, y: 12, width: 40, height: 25 (reduced height)
      doc.addImage(logoUrl, 'PNG', 10, 18, 40, 25);
      
      // Add company details below logo with improved styling
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255); // White text on blue background
      doc.setFont(undefined, 'bold');
      doc.text("Takshaga", 70, 20);
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.text("Upputhara po", 70, 27);
      doc.text("Idukki", 70, 34);
      doc.text("685505", 70, 41);

      // Add contact details on right side with text instead of icons
      doc.setFontSize(9);
      doc.text("Phone: +91 9846660624", 140, 27);
      doc.text("Phone: +91 9544344332", 140, 34);
      doc.text("Website: www.takshaga.com", 140, 41);
      
      // Add estimate details section
      doc.setFillColor(240, 240, 240); // Light gray background
      doc.roundedRect(5, 55, 200, 25, 3, 3, 'F');
      
      // Add estimate details on left
      doc.setFontSize(10);
      doc.setTextColor(0);
      doc.setFont(undefined, 'bold');
      doc.text(`Invoice No: ${estimate.name || 'EST-' + new Date().getTime()}`, 20, 65);
      doc.setFont(undefined, 'normal');
      doc.text("Date: " + new Date(estimate.createdAt).toLocaleDateString(), 20, 75);

      // Add client details on right with "To:" prefix
      doc.setFont(undefined, 'bold');
      doc.text("To:", 155, 65);
      doc.setFont(undefined, 'normal');
      doc.text(estimate.clientName, 160, 75);
      
      // Add ESTIMATE heading centered with proper spacing
      doc.setFontSize(14);
      doc.setTextColor(52, 152, 219); // Blue text
      doc.setFont(undefined, 'bold');
      doc.text("ESTIMATE", 105, 90, { align: "center" });
      
      let yPos = 100; // Reduced spacing after the ESTIMATE heading
      let currentPage = 1;

      // Organize sections by category and subcategory like in the UI
      const organizedSections = {};
      estimate.sections.forEach(section => {
        const categoryName = section.category || 'Uncategorized';
        const subcategoryName = section.subcategory || 'Other';
        
        if (!organizedSections[categoryName]) {
          organizedSections[categoryName] = {};
        }
        
        if (!organizedSections[categoryName][subcategoryName]) {
          organizedSections[categoryName][subcategoryName] = [];
        }
        
        organizedSections[categoryName][subcategoryName].push(section);
      });

      // Process each category and its subcategories
      Object.entries(organizedSections).forEach(([category, subcategories]) => {
        // Check if we need to add a page break
        if (yPos > 250) {
          doc.addPage();
          currentPage++;
          doc.setDrawColor(41, 128, 185); // Blue border
          doc.setLineWidth(1.5);
          doc.rect(5, 5, 200, 287); // Add border to new page
          yPos = 20; // Reset y position for new page
        }

        // Add category heading with modern styling
        doc.setFillColor(52, 152, 219); // Blue background
        doc.rect(10, yPos - 5, 190, 10, 'F');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255); // White text
        doc.setFont(undefined, 'bold');
        doc.text(category, 20, yPos);
        yPos += 15; // Increased spacing after category

        // Process each subcategory and its sections
        Object.entries(subcategories).forEach(([subcategory, sections]) => {
          // Add subcategory name with styling
          doc.setFillColor(236, 240, 241); // Light gray background
          doc.rect(15, yPos - 5, 180, 8, 'F');
          doc.setFontSize(10);
          doc.setTextColor(44, 62, 80); // Dark text
          doc.setFont(undefined, 'bold');
          doc.text(subcategory, 25, yPos);
          yPos += 10; // Increased spacing after subcategory

          // Create table data for this subcategory
          const tableData = sections.map(section => {
            // Format description to include subcategory and material
            let descriptionText ;
            
            if (section.material) {
              descriptionText = `Material: ${section.material}\n`;
            }
            
            descriptionText += section.description;
            
            // Handle different types of sections based on what data is present
            const unitType = getSectionUnitType(section);
            
            if (unitType === 'area' && section.measurements && section.measurements.length > 0) {
              // This is an area measurement
              const dimensions = section.measurements.map(m => 
                `${m.length}×${m.breadth}cm`
              ).join(', ');
              
              return [
                descriptionText,
                dimensions,
                `${section.quantity} sq ft`,
                `Rs. ${section.unitPrice}`,
                `Rs. ${section.total}`
              ];
            } else if (unitType === 'running_sqft' && section.runningLengths && section.runningLengths.length > 0) {
              // This is a running length measurement
              const dimensions = section.runningLengths.map(l => 
                `${l.length}cm`
              ).join(', ');
              
              return [
                descriptionText,
                dimensions,
                `${section.quantity} ft`,
                `Rs. ${section.unitPrice}`,
                `Rs. ${section.total}`
              ];
            } else {
              // This is either pieces or a type without specific measurements
              return [
                descriptionText,
                `${section.quantity} ${section.quantity > 1 ? 'units' : 'unit'}`,
                '-',
                `Rs. ${section.unitPrice}`,
                `Rs. ${section.total}`
              ];
            }
          });

          // Draw the table for this subcategory
          autoTable(doc, {
            startY: yPos,
            head: [['Description', 'Dimensions/Qty', 'Area/Unit', 'Price', 'Total']],
            body: tableData,
            theme: 'grid',
            headStyles: { 
              fillColor: [52, 152, 219], 
              textColor: [255, 255, 255],
              fontStyle: 'bold'
            },
            alternateRowStyles: {
              fillColor: [240, 248, 255] // Light blue for alternate rows
            },
            styles: { fontSize: 8 },
            pageBreak: 'auto',
            margin: { left: 20, right: 20 },
            didDrawPage: function(data) {
              // Add border to new pages created by autoTable
              if (data.pageNumber > currentPage) {
                currentPage = data.pageNumber;
                doc.setDrawColor(41, 128, 185); // Blue border
                doc.setLineWidth(1.5);
                doc.rect(5, 5, 200, 287);
              }
            }
          });
          
          yPos = doc.lastAutoTable.finalY + 10;
        });
      });

      // Calculate sub-total
      const subTotal = estimate.sections.reduce((total, section) => {
        return total + parseFloat(section.total || 0);
      }, 0);

      // Add sub-total with styling
      doc.setDrawColor(189, 195, 199); // Light gray line
      doc.setLineWidth(0.5);
      doc.line(20, yPos - 5, 190, yPos - 5);
      
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80); // Dark text
      doc.setFont(undefined, 'bold');
      doc.text(`Sub Total:`, 149, yPos);
      
      // Simple formatting with Rs. prefix
      const formattedSubTotal = `Rs. ${subTotal.toFixed(2)}`;
      doc.text(formattedSubTotal, 191, yPos, { align: 'right' });
      
      // Add discount if exists
      if (estimate.discount && estimate.discount > 0) {
        yPos += 7;
        doc.text(``, 150, yPos);
        
        // Simple formatting with Rs. prefix for discount
        const formattedDiscount = `- ${estimate.discount.toFixed(2)}`;
        doc.text(formattedDiscount, 190, yPos, { align: 'right' });
      }
      
      // Add grand total without background highlight
      yPos += 7;
      doc.setFontSize(12); // Increased font size for grand total
      doc.setTextColor(44, 62, 80); // Dark text
      doc.setFont(undefined, 'bold');
      doc.text(`Grand Total:`, 135, yPos);
      
      // Simple formatting with Rs. prefix for grand total
      const formattedGrandTotal = `Rs. ${Math.floor(estimate.grandTotal).toFixed(2)}`;
      doc.text(formattedGrandTotal, 190, yPos, { align: 'right' });
      
      // Always add notes section on a new page or with sufficient space
      // Check if we need to add a page break before notes section
      if (yPos > 200) {
        doc.addPage();
        currentPage++;
        doc.setDrawColor(41, 128, 185); // Blue border
        doc.setLineWidth(1.5);
        doc.rect(5, 5, 200, 287); // Add border to new page
        yPos = 30; // Reset y position for new page with more space for notes
      } else {
        // Add some space before notes section
        yPos += 30;
      }
      
      // Add Notes and Terms section with styling
      doc.setFillColor(52, 152, 219); // Blue background
      doc.rect(10, yPos - 5, 190, 10, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255); // White text
      doc.setFont(undefined, 'bold');
      doc.text("Notes & Terms", 20, yPos);
      yPos += 10;
      
      // Add standard terms with styling
      doc.setFontSize(9);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(44, 62, 80); // Dark text
      
      const standardTerms = [
        "• Price includes materials, transport, labor and service",
        "• 50% payment needed upfront with order",
        "• 25% payment after basic structure work",
        "• Final 25% payment after finishing work",
        "• Extra work costs extra"
      ];
      
      standardTerms.forEach(term => {
        doc.text(term, 25, yPos);
        yPos += 6;
      });
      
      // Add custom payment terms if available
      if (customPaymentTerms && customPaymentTerms.trim()) {
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont(undefined, 'bold');
        doc.text("Custom Terms:", 20, yPos);
        yPos += 7;
        
        doc.setFont(undefined, 'normal');
        doc.setFontSize(9);
        
        // Split the custom terms into lines to fit the page width
        const splitCustomTerms = doc.splitTextToSize(customPaymentTerms, 160);
        doc.text(splitCustomTerms, 25, yPos);
        
        // Move yPos down based on how many lines were created
        yPos += splitCustomTerms.length * 6 + 10;
      } else {
        yPos += 15;
      }
      
      // Add signature section with styling
      if (yPos < 250) {
        doc.setDrawColor(189, 195, 199); // Light gray line
        doc.setLineWidth(0.5);
        doc.line(20, yPos, 80, yPos);
        doc.line(120, yPos, 180, yPos);
        
        yPos += 5;
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80); // Dark text
        doc.text("Customer Signature", 20, yPos);
        doc.text("For Takshaga", 120, yPos);
      }
      
      // Add thank you note at the bottom with styling
      yPos = 270;
      doc.setFillColor(52, 152, 219); // Blue background
      doc.roundedRect(65, yPos - 5, 80, 10, 3, 3, 'F');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255); // White text
      doc.text("Thank you for your business!", 105, yPos, { align: "center" });
      
      // Add page numbers to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ensure every page has a border
        doc.setDrawColor(41, 128, 185); // Blue border
        doc.setLineWidth(1.5);
        doc.rect(5, 5, 200, 287);
        
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80); // Dark text
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      // Save the PDF
      const fileName = `${estimate.clientName.trim().replace(/\s+/g, '_')}_estimate.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleWhatsAppSend = async () => {
    try {
      // Format the message with estimate details
      const message = `Dear ${estimate.clientName},\n\n` +
        `Thank you for choosing Takshaga for your project. Please find the estimate details below:\n\n` +
        `📋 *Estimate Details*\n` +
        `Estimate Name: ${estimate.name || 'N/A'}\n` +
        `Date: ${new Date(estimate.createdAt).toLocaleDateString()}\n` +
        `Status: ${estimate.status || 'Pending'}\n\n` +
        `💰 *Total Amount: Rs. ${estimate.grandTotal}*\n\n` +
        `📞 *Contact Us*\n` +
        `Phone: +91 9846660624\n` +
        `Phone: +91 9544344332\n` +
        `Website: www.takshaga.com\n\n` +
        `📍 *Our Address*\n` +
        `Takshaga\n` +
        `Upputhara po\n` +
        `Idukki\n` +
        `685505\n\n` +
        `Thank you for your trust in our services!\n\n` +
        `Best regards,\n` +
        `Team Takshaga`;

      // Encode the message for URL
      const encodedMessage = encodeURIComponent(message);
      
      // Open WhatsApp with the message
      window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    } catch (error) {
      console.error("Error preparing WhatsApp message:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to prepare WhatsApp message',
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

  if (!estimate) {
    return <div>No estimate found</div>;
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <PageContainer
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { duration: 0.5 } }
        }}
        className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <ContentWrapper>
          <Card>
            <motion.div 
              className="preview-section"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <motion.h2 
                  className="text-3xl font-bold"
                  style={{ 
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Estimate Preview
                </motion.h2>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {!isEditing ? (
                    <StyledButton
                      onClick={handleEdit}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit2 size={18} />
                      Edit Estimate
                    </StyledButton>
                  ) : (
                    <StyledButton
                      onClick={handleSave}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Save size={18} />
                      Save Changes
                    </StyledButton>
                  )}
                </div>
              </div>

              {/* Client Details Preview - Read Only */}
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Client Details</h3>
                <div style={{
                  backgroundColor: '#f8fafc',
                  padding: '20px',
                  borderRadius: '12px'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: '20px'
                  }}>
                    <div>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Estimate Name:</strong> {editedEstimate.name || 'N/A'}
                      </p>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Client Name:</strong> {editedEstimate.clientName}
                      </p>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Date:</strong> {new Date(editedEstimate.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Status:</strong> <span className={`status-badge status-${editedEstimate.status || 'pending'}`}>{editedEstimate.status || 'Pending'}</span>
                      </p>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Total Items:</strong> {editedEstimate.sections?.length || 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sections Table */}
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Sections Details</h3>
                
                {/* Group sections by category and subcategory */}
                {(() => {
                  // Organize data by category and subcategory
                  const groupedSections = {};
                  
                  editedEstimate.sections?.forEach(section => {
                    const categoryName = section.category || 'Uncategorized';
                    const subcategoryName = section.subcategory || 'Other';
                    
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
                        borderBottom: '2px solid #3b82f6',
                        paddingBottom: '8px',
                        marginBottom: '16px'
                      }}>
                        {category}
                      </h3>
                      
                      {/* Subcategories */}
                      {Object.entries(subcategories).map(([subcategory, sections]) => (
                        <div key={subcategory} style={{ marginBottom: '24px' }}>
                          {/* Subcategory heading */}
                          <h4 style={{ 
                            fontSize: '16px', 
                            color: '#1e293b',
                            marginBottom: '12px',
                            paddingLeft: '8px'
                          }}>
                            {subcategory}
                          </h4>
                          
                          {/* Sections Table */}
                          <table className="preview-table" style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            marginBottom: '16px'
                          }}>
                            <thead>
                              <tr style={{backgroundColor: '#f8fafc'}}>
                                <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Description</th>
                                <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Material</th>
                                <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Quantity</th>
                                <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Price</th>
                                <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Total</th>
                                {isEditing && (
                                  <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Actions</th>
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {sections.map((section, index) => (
                                <tr key={index} style={{borderBottom: '1px solid #e2e8f0'}}>
                                  <td style={{padding: '12px'}}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={section.description || ''}
                                        onChange={(e) => handleSectionChange(editedEstimate.sections.findIndex(s => s === section), 'description', e.target.value)}
                                        style={{
                                          padding: '5px',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          width: '100%',
                                          color: '#1e293b'
                                        }}
                                      />
                                    ) : (
                                      section.description
                                    )}
                                  </td>
                                  <td style={{padding: '12px'}}>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        value={section.material || ''}
                                        onChange={(e) => handleSectionChange(editedEstimate.sections.findIndex(s => s === section), 'material', e.target.value)}
                                        style={{
                                          padding: '5px',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          width: '100%',
                                          color: '#1e293b'
                                        }}
                                      />
                                    ) : (
                                      section.material || 'N/A'
                                    )}
                                  </td>
                                  <td style={{padding: '12px'}}>
                                    {isEditing ? (
                                      (() => {
                                        const unitType = getSectionUnitType(section);
                                        
                                        if (unitType === 'area') {
                                          return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {/* Primary measurement fields */}
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                                  <input 
                                                    type="number"
                                                    placeholder="L (cm)"
                                                    value={section.length || ''}
                                                    onChange={(e) => handleSectionChange(editedEstimate.sections.findIndex(s => s === section), 'length', e.target.value)}
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
                                                    value={section.breadth || ''}
                                                    onChange={(e) => handleSectionChange(editedEstimate.sections.findIndex(s => s === section), 'breadth', e.target.value)}
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
                                              {(multipleMeasurements[section._id] || []).map((measurement, idx) => (
                                                <div key={idx} style={{ 
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
                                                      onChange={(e) => updateMeasurement(section._id, idx, 'length', e.target.value)}
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
                                                      onChange={(e) => updateMeasurement(section._id, idx, 'breadth', e.target.value)}
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
                                                    onClick={() => removeMeasurement(section._id, idx)}
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
                                                  {section.quantity || 0} ft²
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        } else if (unitType === 'running_sqft') {
                                          return (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                              {/* Running lengths measurements */}
                                              {(runningLengths[section._id] || []).map((item, idx) => (
                                                <div key={idx} style={{ 
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
                                                      onChange={(e) => updateRunningLength(section._id, idx, e.target.value)}
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
                                                    onClick={() => removeRunningLength(section._id, idx)}
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
                                              
                                              {/* If no running length entries yet, add one automatically */}
                                              {(!runningLengths[section._id] || runningLengths[section._id].length === 0) && (
                                                (() => {
                                                  // Initialize with one measurement on first render
                                                  setTimeout(() => handleAddRunningLength(section._id), 0);
                                                  return (
                                                    <div style={{ 
                                                      fontSize: '13px', 
                                                      color: '#666', 
                                                      fontStyle: 'italic' 
                                                    }}>
                                                      Add length measurements
                                                    </div>
                                                  );
                                                })()
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
                                              
                                              <div style={{ fontSize: '12px', color: '#555', marginTop: '4px', display: 'flex', flexDirection: 'column' }}>
                                                <div>
                                                  <span>Total Length: <span style={{ fontWeight: '500', color: '#0077B6' }}>
                                                    {(() => {
                                                      // Recalculate for display consistency
                                                      const lengths = runningLengths[section._id] || [];
                                                      let totalLengthCm = 0;
                                                      
                                                      lengths.forEach(l => {
                                                        if (l.length) totalLengthCm += parseFloat(l.length) || 0;
                                                      });
                                                      
                                                      if (totalLengthCm > 0) {
                                                        return (totalLengthCm * CM_TO_FT_CONVERSION).toFixed(2);
                                                      }
                                                      
                                                      return section.quantity || 0;
                                                    })()}
                                                     ft
                                                  </span></span>
                                                </div>
                                                {(() => {
                                                  // Calculate total length for display
                                                  const lengths = runningLengths[section._id] || [];
                                                  let totalLengthCm = 0;
                                                  
                                                  lengths.forEach(l => {
                                                    if (l.length) totalLengthCm += parseFloat(l.length) || 0;
                                                  });
                                                  
                                                  if (totalLengthCm > 0) {
                                                    // Recalculate feet for display to ensure accuracy
                                                    const calculatedFt = (totalLengthCm * CM_TO_FT_CONVERSION).toFixed(2);
                                                    
                                                    return (
                                                      <div style={{ fontSize: '11px', color: '#777', marginTop: '2px' }}>
                                                        (Total: {totalLengthCm} cm = {calculatedFt} ft)
                                                      </div>
                                                    );
                                                  }
                                                  return null;
                                                })()}
                                              </div>
                                            </div>
                                          );
                                        } else {
                                          // Default pieces input
                                          return (
                                            <input
                                              type="number"
                                              value={section.quantity || 0}
                                              onChange={(e) => handleQuantityChange(editedEstimate.sections.findIndex(s => s === section), e.target.value)}
                                              style={{
                                                padding: '5px',
                                                border: '1px solid #cbd5e1',
                                                borderRadius: '4px',
                                                width: '100px',
                                                color: '#1e293b'
                                              }}
                                            />
                                          );
                                        }
                                      })()
                                    ) : (
                                      <div>
                                        {section.quantity}
                                        {section.measurements && section.measurements.length > 0 && (
                                          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '5px' }}>
                                            {section.measurements.map((m, i) => (
                                              <div key={i}>{m.length}×{m.breadth}cm</div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </td>
                                  <td style={{padding: '12px'}}>
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        value={section.unitPrice || 0}
                                        onChange={(e) => handleSectionChange(editedEstimate.sections.findIndex(s => s === section), 'unitPrice', e.target.value)}
                                        style={{
                                          padding: '5px',
                                          border: '1px solid #cbd5e1',
                                          borderRadius: '4px',
                                          width: '100px',
                                          color: '#1e293b'
                                        }}
                                      />
                                    ) : (
                                      `Rs. ${section.unitPrice}`
                                    )}
                                  </td>
                                  <td style={{padding: '12px'}}>Rs. {section.total}</td>
                                  {isEditing && (
                                    <td style={{padding: '12px'}}>
                                      <StyledButton
                                        onClick={() => handleRemoveSection(editedEstimate.sections.findIndex(s => s === section))}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        style={{ 
                                          padding: '5px 10px', 
                                          fontSize: '14px',
                                          background: '#ef4444',
                                          color: 'white'
                                        }}
                                      >
                                        Remove
                                      </StyledButton>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ));
                })()}
                
                {isEditing && (
                  <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <StyledButton
                      onClick={handleAddSection}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
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
                    </StyledButton>
                  </div>
                )}
                
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginTop: '20px'
                }}>
                  <tfoot>
                    <tr>
                      <td colSpan={isEditing ? 4 : 3} style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#1e293b'
                      }}>Sub Total</td>
                      <td style={{
                        padding: '12px 16px 12px 12px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '16px',
                        textAlign: 'right',
                        width: '120px'
                      }}>Rs. {subTotal.toFixed(2)}</td>
                      {isEditing && <td></td>}
                    </tr>
                    <tr>
                        <td colSpan={isEditing ? 4 : 3} style={{
                          padding: '12px',
                          textAlign: 'right',
                          color: '#1e293b'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <input
                                type="checkbox"
                                checked={showDiscount}
                                onChange={(e) => {
                                  setShowDiscount(e.target.checked);
                                  if (!e.target.checked) {
                                    setDiscountAmount(0);
                                    setGrandTotal(subTotal);
                                  }
                                }}
                                style={{ width: '16px', height: '16px' }}
                              />
                              Apply Discount
                            </label>
                            {showDiscount && (
                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <input
                                  type="number"
                                  value={discountAmount}
                                  onChange={handleDiscountChange}
                                  placeholder="Enter discount amount"
                                  style={{
                                    padding: '5px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    width: '120px',
                                    color: '#1e293b'
                                  }}
                                />
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                  <input
                                    type="checkbox"
                                    checked={useCustomTotal}
                                    onChange={(e) => {
                                      setUseCustomTotal(e.target.checked);
                                      if (!e.target.checked) {
                                        setGrandTotal(subTotal);
                                        setDiscountAmount(0);
                                      }
                                    }}
                                    style={{ width: '16px', height: '16px' }}
                                  />
                                  Use Custom Total
                                </label>
                                {useCustomTotal && (
                                  <input
                                    type="number"
                                    value={grandTotal}
                                    onChange={handleGrandTotalChange}
                                    placeholder="Enter grand total"
                                    step="1"
                                    min="0"
                                    style={{
                                      padding: '5px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '120px',
                                      color: '#1e293b'
                                    }}
                                  />
                                )}
                                <StyledButton
                                  onClick={handleSaveDiscount}
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                  style={{ padding: '5px 10px', fontSize: '14px' }}
                                >
                                  <Save size={16} />
                                  Save Discount
                                </StyledButton>
                              </div>
                            )}
                          </div>
                        </td>
                        <td style={{
                          padding: '12px 16px 12px 12px',
                          color: '#1e293b',
                          fontSize: '14px',
                          textAlign: 'right',
                          width: '120px'
                        }}>
                          {showDiscount && discountAmount > 0 && `-Rs. ${discountAmount}`}
                        </td>
                        {isEditing && <td></td>}
                      </tr>
                    <tr>
                      <td colSpan={isEditing ? 4 : 3} style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#1e293b'
                      }}>Grand Total</td>
                      <td style={{
                        padding: '12px 16px 12px 12px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '16px',
                        textAlign: 'right',
                        width: '120px',
                        borderTop: '2px solid #e2e8f0'
                      }}>
                        Rs. {Math.ceil(grandTotal)}
                      </td>
                      {isEditing && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Terms and Conditions */}
              <div className="terms-section" style={{
                backgroundColor: '#f8fafc',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '30px'
              }}>
                <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Terms & Conditions</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                  gap: '15px'
                }}>
                  <div className="term-item">
                    <span className="term-bullet">•</span>
                    <span>Price includes materials, transport, labor and service</span>
                  </div>
                  <div className="term-item">
                    <span className="term-bullet">•</span>
                    <span>50% payment needed upfront with order</span>
                  </div>
                  <div className="term-item">
                    <span className="term-bullet">•</span>
                    <span>25% payment after basic structure work</span>
                  </div>
                  <div className="term-item">
                    <span className="term-bullet">•</span>
                    <span>Final 25% payment after finishing work</span>
                  </div>
                  <div className="term-item">
                    <span className="term-bullet">•</span>
                    <span>Extra work costs extra</span>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <h4 style={{ color: '#1e293b', marginBottom: '10px' }}>Custom Terms</h4>
                  <textarea
                    value={customPaymentTerms}
                    onChange={(e) => setCustomPaymentTerms(e.target.value)}
                    placeholder="Enter custom terms here..."
                    style={{
                      width: '100%',
                      minHeight: '100px',
                      padding: '10px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      color: '#1e293b'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <motion.div 
                className="button-group"
                style={{
                  display: 'flex',
                  gap: '1rem',
                  marginTop: '2rem',
                  justifyContent: 'flex-end'
                }}
              >
                <StyledButton
                  onClick={handleDownloadPDF}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FileDown size={18} />
                  Download PDF
                </StyledButton>
                <StyledButton
                  onClick={handleWhatsAppSend}
                  style={{ background: '#25D366' }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send size={18} />
                  Share on WhatsApp
                </StyledButton>
              </motion.div>
            </motion.div>
          </Card>
        </ContentWrapper>
      </PageContainer>

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

export default EstimatePreview; 