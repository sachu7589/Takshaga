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
  const [showAllDiscounts, setShowAllDiscounts] = useState(false);
  const [customPaymentTerms, setCustomPaymentTerms] = useState('');

  useEffect(() => {
    const fetchEstimate = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/${id}`);
        if (response.data.success) {
          setEstimate(response.data.data);
          setEditedEstimate(response.data.data);
          setGrandTotal(response.data.data.grandTotal);
          
          // Calculate subTotal from materials
          const calculatedSubTotal = response.data.data.materials.reduce((total, material) => {
            return total + parseFloat(material.total);
          }, 0);
          setSubTotal(calculatedSubTotal);
          
          // Calculate discount if subTotal and grandTotal are different
          if (calculatedSubTotal !== response.data.data.grandTotal) {
            setShowDiscount(true);
            setDiscountAmount((calculatedSubTotal - response.data.data.grandTotal).toFixed(2));
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
  };

  const handleSave = async () => {
    try {
      // Calculate sub-total from materials
      const calculatedSubTotal = editedEstimate.materials.reduce((total, material) => {
        return total + parseFloat(material.total);
      }, 0);

      const updatedEstimate = {
        estimateNumber: editedEstimate.estimateNumber,
        clientId: editedEstimate.clientId,
        clientName: editedEstimate.clientName,
        materials: editedEstimate.materials,
        grandTotal: Math.floor(calculatedSubTotal),
        status: editedEstimate.status
      };

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estimates/update/${id}`,
        updatedEstimate
      );
      
      if (response.data.success) {
        setEstimate(response.data.data);
        setEditedEstimate(response.data.data);
        setGrandTotal(Math.floor(calculatedSubTotal));
        setIsEditing(false);
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
        text: 'Failed to update estimate',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleSaveDiscount = async () => {
    try {
      const flooredGrandTotal = Math.floor(grandTotal);
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/estimates/updateGrandTotal/${id}`,
        { grandTotal: flooredGrandTotal }
      );
      
      if (response.data.success) {
        setEstimate({
          ...estimate,
          grandTotal: flooredGrandTotal,
          discount: showDiscount ? discountAmount : 0
        });
        setEditedEstimate({
          ...editedEstimate,
          grandTotal: flooredGrandTotal,
          discount: showDiscount ? discountAmount : 0
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

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = [...editedEstimate.materials];
    updatedMaterials[index] = {
      ...updatedMaterials[index],
      [field]: value
    };
    
    // Recalculate total for the material
    if (field === 'price' || field === 'dimensions' || field === 'measurementType') {
      if (updatedMaterials[index].measurementType === 'area') {
        const area = updatedMaterials[index].dimensions.area;
        updatedMaterials[index].total = (area * updatedMaterials[index].price).toFixed(2);
      } else {
        const pieces = updatedMaterials[index].dimensions.pieces;
        updatedMaterials[index].total = (pieces * updatedMaterials[index].price).toFixed(2);
      }
    }
    
    // Recalculate subTotal
    const newSubTotal = updatedMaterials.reduce((total, material) => {
      return total + parseFloat(material.total);
    }, 0);
    
    setSubTotal(newSubTotal);
    setEditedEstimate({
      ...editedEstimate,
      materials: updatedMaterials
    });
  };

  const handleDiscountChange = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setDiscountAmount(value);
    const newGrandTotal = parseFloat(editedEstimate.grandTotal) - value;
    setGrandTotal(newGrandTotal.toFixed(2));
  };

  const handleGrandTotalChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setGrandTotal(Math.floor(value));
    const newDiscount = parseFloat(editedEstimate.grandTotal) - Math.floor(value);
    setDiscountAmount(newDiscount.toFixed(2));
  };

  const handleDimensionChange = (materialIndex, dimension, value) => {
    const updatedMaterials = [...editedEstimate.materials];
    const material = updatedMaterials[materialIndex];
    
    if (material.measurementType === 'area') {
      const length = dimension === 'length' ? parseFloat(value) : material.dimensions.length;
      const breadth = dimension === 'breadth' ? parseFloat(value) : material.dimensions.breadth;
      const area = (length * breadth * 0.0328084 * 0.0328084).toFixed(2);
      
      updatedMaterials[materialIndex] = {
        ...material,
        dimensions: {
          ...material.dimensions,
          [dimension]: value,
          area: area
        },
        total: (area * material.price).toFixed(2)
      };
    } else {
      updatedMaterials[materialIndex] = {
        ...material,
        dimensions: {
          ...material.dimensions,
          pieces: value
        },
        total: (value * material.price).toFixed(2)
      };
    }
    
    // Recalculate grand total
    const newGrandTotal = updatedMaterials.reduce((total, material) => {
      return total + parseFloat(material.total);
    }, 0);
    
    setEditedEstimate({
      ...editedEstimate,
      materials: updatedMaterials,
      grandTotal: newGrandTotal.toFixed(2)
    });
  };

  const handleDownloadPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Add border to first page
      doc.rect(5, 5, 200, 287);
      
      // Add logo and company details only on first page
      const logoUrl = '/takshaga_white.png';
      doc.addImage(logoUrl, 'PNG', 8, 10, 50, 38);
      
      // Add company details below logo
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Takshaga", 20, 40);
      doc.text("Upputhara po", 20, 45);
      doc.text("Idukki", 20, 50);
      doc.text("685505", 20, 55);

      // Add contact details on right side
      doc.text("Phone: +91 9846660624", 140, 40);
      doc.text("Phone: +91 9544344332", 140, 45);
      doc.text("www.takshaga.com", 140, 50);
      
      // Add estimate title
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text("ESTIMATE", 105, 70, { align: "center" });
      
      // Add estimate details on left
      doc.setFontSize(10);
      doc.text(`Invoice No: ${estimate.estimateNumber || 'EST-' + new Date().getTime()}`, 20, 85);
      doc.text("Date: " + new Date(estimate.createdAt).toLocaleDateString(), 20, 90);

      // Add client details on right with "To:" prefix
      doc.text("To:", 155, 85);
      doc.text(estimate.clientName, 160, 90);
      
      let yPos = 110;
      let currentPage = 1;

      // Add materials table
      const tableData = estimate.materials.map(material => {
        if (material.measurementType === 'area') {
          return [
            material.name,
            material.category,
            `${material.dimensions.length} x ${material.dimensions.breadth}`,
            `${material.dimensions.area} sq ft`,
            `Rs. ${material.price}`,
            `Rs. ${material.total}`
          ];
        } else {
          return [
            material.name,
            material.category,
            `${material.dimensions.pieces} pieces`,
            '-',
            `Rs. ${material.price}`,
            `Rs. ${material.total}`
          ];
        }
      });

      // Create PDF table data without category column
      const pdfTableData = tableData.map(row => [row[0], row[2], row[3], row[4], row[5]]);

      autoTable(doc, {
        startY: yPos,
        head: [['Material', 'Dimensions', 'Area/Pieces', 'Price', 'Total']],
        body: pdfTableData,
        theme: 'grid',
        headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0] },
        styles: { fontSize: 8 },
        pageBreak: 'auto',
        didDrawPage: function(data) {
          // Add border to new pages created by autoTable
          if (data.pageNumber > currentPage) {
            currentPage = data.pageNumber;
            doc.rect(5, 5, 200, 287);
          }
        }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Calculate sub-total
      const subTotal = estimate.materials.reduce((total, material) => {
        return total + parseFloat(material.total);
      }, 0);

      // Add sub-total
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos - 10, 190, yPos - 10);
      
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.setFont(undefined, 'bold');
      doc.text(`Sub Total: Rs. ${subTotal.toFixed(2)}`, 190, yPos, { align: 'right' });
      
      // Add discount if exists
      if (subTotal !== parseFloat(estimate.grandTotal)) {
        yPos += 10;
        const discount = subTotal - parseFloat(estimate.grandTotal);
        doc.text(`Discount: Rs. ${discount.toFixed(2)}`, 190, yPos, { align: 'right' });
      }
      
      // Add grand total
      yPos += 10;
      doc.text(`Grand Total: Rs. ${Math.floor(estimate.grandTotal)}`, 190, yPos, { align: 'right' });
      
      // Add payment terms note
      yPos += 20;
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text("NOTE:", 20, yPos);
      yPos += 7;
      doc.setFontSize(8);
      doc.text("* The above rate inclusive of material cost, transportation, labour charges and service charges", 25, yPos);
      yPos += 5;
      doc.text("* Advance 50% of total amount along with the confirmed work order", 25, yPos);
      yPos += 5;
      doc.text("* 25% of the total amount after completion of carcass and cabin partition works", 25, yPos);
      yPos += 5;
      doc.text("* Balance 25% of the total amount after completing shutter works", 25, yPos);
      yPos += 5;
      doc.text("* Additional work and area are calculated separately", 25, yPos);
      
      // Add custom payment terms if they exist
      if (customPaymentTerms.trim()) {
        yPos += 5; // Add a single line break before custom terms
        doc.setFontSize(8);
        
        // Split the custom terms into lines that fit within the page width
        const customTermsLines = doc.splitTextToSize(customPaymentTerms, 170);
        customTermsLines.forEach(line => {
          doc.text(`* ${line}`, 25, yPos);
          yPos += 5;
        });
      }
      
      // Add footer
      yPos += 15;
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("Thank you !", 105, yPos, { align: "center" });
      
      // Add page numbers to all pages
      const pageCount = doc.internal.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
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
        `Estimate No: ${estimate.estimateNumber || 'N/A'}\n` +
        `Date: ${new Date(estimate.createdAt).toLocaleDateString()}\n` +
        `Status: ${estimate.status}\n\n` +
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

  const handleRemoveMaterial = (index) => {
    const updatedMaterials = [...editedEstimate.materials];
    updatedMaterials.splice(index, 1);
    
    // Recalculate subTotal
    const newSubTotal = updatedMaterials.reduce((total, material) => {
      return total + parseFloat(material.total);
    }, 0);
    
    setSubTotal(newSubTotal);
    setEditedEstimate({
      ...editedEstimate,
      materials: updatedMaterials
    });
  };

  const handleAddMaterial = () => {
    const newMaterial = {
      name: '',
      category: '',
      measurementType: 'area',
      dimensions: {
        length: 0,
        breadth: 0,
        area: 0,
        pieces: 0
      },
      price: 0,
      total: 0
    };
    
    setEditedEstimate({
      ...editedEstimate,
      materials: [...editedEstimate.materials, newMaterial]
    });
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
                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={showAllDiscounts}
                      onChange={(e) => setShowAllDiscounts(e.target.checked)}
                      style={{ width: '16px', height: '16px' }}
                    />
                    Show All Discounts
                  </label>
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
                        <strong>Estimate No:</strong> {editedEstimate.estimateNumber || 'N/A'}
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
                        <strong>Status:</strong> <span className={`status-badge status-${editedEstimate.status}`}>{editedEstimate.status}</span>
                      </p>
                      <p style={{color: '#64748b', marginBottom: '10px'}}>
                        <strong>Total Items:</strong> {editedEstimate.materials.length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Materials Table */}
              <div style={{marginBottom: '30px'}}>
                <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Materials Details</h3>
                <table className="preview-table" style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  marginBottom: '30px'
                }}>
                  <thead>
                    <tr style={{backgroundColor: '#f8fafc'}}>
                      <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Material</th>
                      <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Category</th>
                      <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Dimensions/Pieces</th>
                      <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Price</th>
                      <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Total</th>
                      {isEditing && (
                        <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {editedEstimate.materials.map((material, index) => (
                      <tr key={index} style={{borderBottom: '1px solid #e2e8f0'}}>
                        <td style={{padding: '12px'}}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={material.name}
                              onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                              style={{
                                padding: '5px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                width: '100%',
                                color: '#1e293b'
                              }}
                            />
                          ) : (
                            material.name
                          )}
                        </td>
                        <td style={{padding: '12px'}}>
                          {isEditing ? (
                            <input
                              type="text"
                              value={material.category}
                              onChange={(e) => handleMaterialChange(index, 'category', e.target.value)}
                              style={{
                                padding: '5px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                width: '100%',
                                color: '#1e293b'
                              }}
                            />
                          ) : (
                            <span className="category-badge">{material.category}</span>
                          )}
                        </td>
                        <td style={{padding: '12px'}}>
                          {material.measurementType === 'area' ? (
                            isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                      type="radio"
                                      name={`measurement-${index}`}
                                      checked={material.measurementType === 'area'}
                                      onChange={() => handleMaterialChange(index, 'measurementType', 'area')}
                                      style={{ width: '16px', height: '16px' }}
                                    />
                                    Dimensions
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                      type="radio"
                                      name={`measurement-${index}`}
                                      checked={material.measurementType === 'pieces'}
                                      onChange={() => handleMaterialChange(index, 'measurementType', 'pieces')}
                                      style={{ width: '16px', height: '16px' }}
                                    />
                                    Pieces
                                  </label>
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  <input
                                    type="number"
                                    value={material.dimensions.length}
                                    onChange={(e) => handleDimensionChange(index, 'length', e.target.value)}
                                    style={{
                                      padding: '5px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '80px',
                                      color: '#1e293b'
                                    }}
                                  />
                                  <span>×</span>
                                  <input
                                    type="number"
                                    value={material.dimensions.breadth}
                                    onChange={(e) => handleDimensionChange(index, 'breadth', e.target.value)}
                                    style={{
                                      padding: '5px',
                                      border: '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      width: '80px',
                                      color: '#1e293b'
                                    }}
                                  />
                                  <span>cm</span>
                                  <span className="area-value">({material.dimensions.area} sq ft)</span>
                                </div>
                              </div>
                            ) : (
                              <div className="dimensions-info">
                                <span>{material.dimensions.length} × {material.dimensions.breadth} cm</span>
                                <span className="area-value">({material.dimensions.area} sq ft)</span>
                              </div>
                            )
                          ) : (
                            isEditing ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                <div style={{ display: 'flex', gap: '20px', marginBottom: '10px' }}>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                      type="radio"
                                      name={`measurement-${index}`}
                                      checked={material.measurementType === 'area'}
                                      onChange={() => handleMaterialChange(index, 'measurementType', 'area')}
                                      style={{ width: '16px', height: '16px' }}
                                    />
                                    Dimensions
                                  </label>
                                  <label style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                    <input
                                      type="radio"
                                      name={`measurement-${index}`}
                                      checked={material.measurementType === 'pieces'}
                                      onChange={() => handleMaterialChange(index, 'measurementType', 'pieces')}
                                      style={{ width: '16px', height: '16px' }}
                                    />
                                    Pieces
                                  </label>
                                </div>
                                <input
                                  type="number"
                                  value={material.dimensions.pieces}
                                  onChange={(e) => handleDimensionChange(index, 'pieces', e.target.value)}
                                  style={{
                                    padding: '5px',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    width: '100px',
                                    color: '#1e293b'
                                  }}
                                />
                              </div>
                            ) : (
                              <span>{material.dimensions.pieces} pieces</span>
                            )
                          )}
                        </td>
                        <td style={{padding: '12px'}}>
                          {isEditing ? (
                            <input
                              type="number"
                              value={material.price}
                              onChange={(e) => handleMaterialChange(index, 'price', e.target.value)}
                              style={{
                                padding: '5px',
                                border: '1px solid #cbd5e1',
                                borderRadius: '4px',
                                width: '100px',
                                color: '#1e293b'
                              }}
                            />
                          ) : (
                            `₹${material.price}`
                          )}
                        </td>
                        <td style={{padding: '12px'}}>₹{material.total}</td>
                        {isEditing && (
                          <td style={{padding: '12px'}}>
                            <StyledButton
                              onClick={() => handleRemoveMaterial(index)}
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
                    {isEditing && (
                      <tr>
                        <td colSpan={isEditing ? 6 : 5} style={{padding: '12px', textAlign: 'center'}}>
                          <StyledButton
                            onClick={handleAddMaterial}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            style={{ 
                              padding: '5px 10px', 
                              fontSize: '14px',
                              background: '#10b981',
                              color: 'white'
                            }}
                          >
                            Add New Material
                          </StyledButton>
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="4" style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#1e293b'
                      }}>Sub Total</td>
                      <td style={{
                        padding: '12px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '16px'
                      }}>₹{subTotal.toFixed(2)}</td>
                    </tr>
                    {(showAllDiscounts || subTotal !== grandTotal) && (
                      <tr>
                        <td colSpan="4" style={{
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
                          padding: '12px',
                          color: '#1e293b',
                          fontSize: '14px'
                        }}>
                          {showDiscount && discountAmount > 0 && `-₹${discountAmount}`}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan="4" style={{
                        padding: '12px',
                        textAlign: 'right',
                        fontWeight: 'bold',
                        color: '#1e293b'
                      }}>Grand Total</td>
                      <td style={{
                        padding: '12px',
                        fontWeight: 'bold',
                        color: '#1e293b',
                        fontSize: '16px'
                      }}>
                        ₹{Math.floor(grandTotal)}
                      </td>
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
    </div>
  );
}

export default EstimatePreview; 