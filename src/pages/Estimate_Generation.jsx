import { useState } from "react";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/Topbar";
import "../assets/styles/Estimate.css";
import { Edit, Trash2, FileDown, Eye } from "lucide-react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function Estimate_Generation() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [clientName, setClientName] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [categories, setCategories] = useState([{
    category: "",
    subCategories: [{
      name: "",
      materials: [{
        name: "",
        length: 0,
        breadth: 0,
        quantity: 0,
        unitPrice: 0
      }]
    }]
  }]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const calculateArea = (length, breadth) => {
    const areaInSqUnits = length * breadth;
    return areaInSqUnits / 929;
  };

  const calculateTotal = (area, quantity, unitPrice) => {
    return area * quantity * unitPrice;
  };

  const handleCategoryChange = (categoryIndex, value) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].category = value;
    setCategories(updatedCategories);
  };

  const handleSubCategoryChange = (categoryIndex, subCategoryIndex, value) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].subCategories[subCategoryIndex].name = value;
    setCategories(updatedCategories);
  };

  const handleMaterialChange = (categoryIndex, subCategoryIndex, materialIndex, field, value) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].subCategories[subCategoryIndex].materials[materialIndex] = {
      ...updatedCategories[categoryIndex].subCategories[subCategoryIndex].materials[materialIndex],
      [field]: value
    };
    setCategories(updatedCategories);
  };

  const addNewMaterial = (categoryIndex, subCategoryIndex) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].subCategories[subCategoryIndex].materials.push({
      name: "",
      length: 0,
      breadth: 0,
      quantity: 0,
      unitPrice: 0
    });
    setCategories(updatedCategories);
  };

  const addNewSubCategory = (categoryIndex) => {
    const updatedCategories = [...categories];
    updatedCategories[categoryIndex].subCategories.push({
      name: "",
      materials: [{
        name: "",
        length: 0,
        breadth: 0,
        quantity: 0,
        unitPrice: 0
      }]
    });
    setCategories(updatedCategories);
  };

  const addNewCategory = () => {
    setCategories([...categories, {
      category: "",
      subCategories: [{
        name: "",
        materials: [{
          name: "",
          length: 0,
          breadth: 0,
          quantity: 0,
          unitPrice: 0
        }]
      }]
    }]);
  };

  const handleDownloadPDF = () => {
    try {
      // Validate client details
      if (!clientName.trim()) {
        throw new Error("Client name is required");
      }
      if (!clientAddress.trim()) {
        throw new Error("Client address is required");
      }

      // Validate required fields
      for (const category of categories) {
        if (!category.category.trim()) {
          throw new Error("Category name is required");
        }
        
        for (const subCategory of category.subCategories) {
          if (!subCategory.name.trim()) {
            throw new Error("Sub category name is required");
          }
          
          for (const material of subCategory.materials) {
            if (!material.name.trim()) {
              throw new Error("Material name is required");
            }
            if (material.length <= 0) {
              throw new Error("Length must be greater than 0");
            }
            if (material.breadth <= 0) {
              throw new Error("Breadth must be greater than 0");
            }
            if (material.quantity <= 0) {
              throw new Error("Quantity must be greater than 0");
            }
            if (material.unitPrice <= 0) {
              throw new Error("Unit price must be greater than 0");
            }
          }
        }
      }

      const doc = new jsPDF();
      
      // Add border to first page
      doc.rect(5, 5, 200, 287);
      
      // Add logo and company details only on first page
      const logoUrl = 'public/takshaga_white.png';
      doc.addImage(logoUrl, 'PNG', 8, 10, 50, 38);
      
      // Add company details below logo
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text("Takshaka", 20, 40);
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
      doc.text("Invoice No: EST-" + new Date().getTime(), 20, 85);
      doc.text("Date: " + new Date().toLocaleDateString(), 20, 90);

      // Add client details on right with "To:" prefix
      doc.text("To:", 155, 85);
      doc.text(clientName, 160, 90);
      doc.text(clientAddress, 160, 95);
      
      let yPos = 110;
      let currentPage = 1;
      
      categories.forEach((category) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          currentPage++;
          doc.rect(5, 5, 200, 287); // Add border to new page
          yPos = 30; // Start from top on new pages
        }

        // Add category details
        doc.setFontSize(12);
        doc.setTextColor(30, 41, 59);
        doc.text(`${category.category}`, 20, yPos);
        
        yPos += 10;
        
        category.subCategories.forEach((subCategory) => {
          // Check if we need a new page
          if (yPos > 250) {
            doc.addPage();
            currentPage++;
            doc.rect(5, 5, 200, 287); // Add border to new page
            yPos = 30; // Start from top on new pages
          }

          doc.setFontSize(10);
          doc.setTextColor(100, 116, 139);
          doc.text(`${subCategory.name}`, 20, yPos);
          
          // Add materials table
          const tableData = subCategory.materials.map(material => {
            const area = calculateArea(material.length, material.breadth);
            const total = calculateTotal(area, material.quantity, material.unitPrice);
            return [
              material.name,
              `${material.length} x ${material.breadth}`,
              `${area.toFixed(2)} sq ft`,
              material.quantity,
              `Rs. ${material.unitPrice}`,
              `Rs. ${total.toFixed(2)}`
            ];
          });

          autoTable(doc, {
            startY: yPos + 5,
            head: [['Material', 'Dimensions', 'Area', 'Quantity', 'Unit Price', 'Total']],
            body: tableData,
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
          
          yPos = doc.lastAutoTable.finalY + 15;
        });
      });

      // Add final page with grand total and payment terms
      if (yPos > 200) { // If not enough space, create new page
        doc.addPage();
        doc.rect(5, 5, 200, 287); // Add border to new page
        yPos = 30; // Start from top
      }

      // Add grand total
      doc.setDrawColor(226, 232, 240);
      doc.line(20, yPos - 10, 190, yPos - 10);
      
      doc.setFontSize(12);
      doc.setTextColor(30, 41, 59);
      doc.setFont(undefined, 'bold');
      doc.text(`Grand Total: Rs. ${calculateGrandTotal().toFixed(2)}`, 190, yPos, { align: 'right' });
      
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

      // Save the PDF with client name
      const fileName = `${clientName.trim().replace(/\s+/g, '_')}_estimate.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert(error.message || "There was an error generating the PDF. Please try again.");
    }
  };

  const calculateGrandTotal = () => {
    return categories.reduce((categoryTotal, category) => {
      return categoryTotal + category.subCategories.reduce((subCategoryTotal, subCategory) => {
        return subCategoryTotal + subCategory.materials.reduce((materialTotal, material) => {
          const area = calculateArea(material.length, material.breadth);
          return materialTotal + calculateTotal(area, material.quantity, material.unitPrice);
        }, 0);
      }, 0);
    }, 0);
  };

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`} style={{minHeight: '100vh', overflowY: 'auto'}}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`} style={{minHeight: '100vh', overflowY: 'auto', paddingBottom: '50px'}}>
        <TopNavbar />

        <div className="card-container">
          <div className="card">
            {!showPreview ? (
              <>
                <h2 style={{color: '#2563eb', marginBottom: '30px'}}>Generate Estimate</h2>

                {/* Client Details Section */}
                <div className="client-details" style={{
                  backgroundColor: '#f1f5f9',
                  padding: '25px',
                  borderRadius: '8px',
                  marginBottom: '35px'
                }}>
                  <h3 style={{color: '#3b82f6', marginBottom: '25px'}}>Client Details</h3>

                  <div className="form-group" style={{marginBottom: '25px'}}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#1e293b',
                      fontWeight: '500'
                    }}>
                      Client Name
                    </label>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Enter client name"
                      style={{
                        padding: '10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '16px',
                        color: '#1e293b'
                      }}
                    />
                  </div>

                  <div className="form-group" style={{marginBottom: '25px'}}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: '#1e293b',
                      fontWeight: '500'
                    }}>
                      Client Address
                    </label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      placeholder="Enter client address"
                      style={{
                        padding: '10px',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        width: '100%',
                        fontSize: '16px',
                        color: '#1e293b',
                        minHeight: '100px'
                      }}
                    />
                  </div>
                </div>

                {categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} className="category-section" style={{
                    backgroundColor: '#f1f5f9',
                    padding: '25px',
                    borderRadius: '8px',
                    marginBottom: '35px'
                  }}>
                    <h3 style={{color: '#3b82f6', marginBottom: '25px'}}>Category {categoryIndex + 1}</h3>

                    <div className="form-group" style={{marginBottom: '25px'}}>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        color: '#1e293b',
                        fontWeight: '500'
                      }}>
                        Category Name
                      </label>
                      <input
                        type="text"
                        value={category.category}
                        onChange={(e) => handleCategoryChange(categoryIndex, e.target.value)}
                        placeholder="Enter category name"
                        style={{
                          padding: '10px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '6px',
                          width: '100%',
                          fontSize: '16px',
                          color: '#1e293b'
                        }}
                      />
                    </div>

                    {category.subCategories.map((subCategory, subCategoryIndex) => (
                      <div key={subCategoryIndex} className="subcategory-section" style={{
                        backgroundColor: '#f8fafc',
                        padding: '20px',
                        borderRadius: '8px',
                        marginBottom: '20px'
                      }}>
                        <h4 style={{color: '#64748b', marginBottom: '20px'}}>Sub Category {subCategoryIndex + 1}</h4>

                        <div className="form-group" style={{marginBottom: '20px'}}>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#1e293b',
                            fontWeight: '500'
                          }}>
                            Sub Category Name
                          </label>
                          <input
                            type="text"
                            value={subCategory.name}
                            onChange={(e) => handleSubCategoryChange(categoryIndex, subCategoryIndex, e.target.value)}
                            placeholder="Enter sub category name"
                            style={{
                              padding: '10px',
                              border: '1px solid #e2e8f0',
                              borderRadius: '6px',
                              width: '100%',
                              fontSize: '16px',
                              color: '#1e293b'
                            }}
                          />
                        </div>

                        {subCategory.materials.map((material, materialIndex) => (
                          <div key={materialIndex} className="material-section" style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            marginBottom: '20px'
                          }}>
                            <h5 style={{color: '#64748b', marginBottom: '20px'}}>Material {materialIndex + 1}</h5>

                            <div className="form-group" style={{marginBottom: '20px'}}>
                              <label style={{
                                display: 'block',
                                marginBottom: '8px',
                                color: '#1e293b',
                                fontWeight: '500'
                              }}>
                                Material Name
                              </label>
                              <input
                                type="text"
                                value={material.name}
                                onChange={(e) => handleMaterialChange(categoryIndex, subCategoryIndex, materialIndex, 'name', e.target.value)}
                                placeholder="Enter material name"
                                style={{
                                  padding: '10px',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: '6px',
                                  width: '100%',
                                  fontSize: '16px',
                                  color: '#1e293b'
                                }}
                              />
                            </div>

                            <div className="dimensions" style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                              <div style={{flex: 1}}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  color: '#1e293b',
                                  fontWeight: '500'
                                }}>
                                  Length
                                </label>
                                <input
                                  type="number"
                                  value={material.length}
                                  onChange={(e) => handleMaterialChange(categoryIndex, subCategoryIndex, materialIndex, 'length', parseFloat(e.target.value))}
                                  placeholder="Enter length"
                                  style={{
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    width: '100%',
                                    fontSize: '16px',
                                    color: '#1e293b'
                                  }}
                                />
                              </div>
                              <div style={{flex: 1}}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  color: '#1e293b',
                                  fontWeight: '500'
                                }}>
                                  Breadth
                                </label>
                                <input
                                  type="number"
                                  value={material.breadth}
                                  onChange={(e) => handleMaterialChange(categoryIndex, subCategoryIndex, materialIndex, 'breadth', parseFloat(e.target.value))}
                                  placeholder="Enter breadth"
                                  style={{
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    width: '100%',
                                    fontSize: '16px',
                                    color: '#1e293b'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="quantity-price" style={{display: 'flex', gap: '10px', marginBottom: '20px'}}>
                              <div style={{flex: 1}}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  color: '#1e293b',
                                  fontWeight: '500'
                                }}>
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={material.quantity}
                                  onChange={(e) => handleMaterialChange(categoryIndex, subCategoryIndex, materialIndex, 'quantity', parseInt(e.target.value))}
                                  placeholder="Enter quantity"
                                  style={{
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    width: '100%',
                                    fontSize: '16px',
                                    color: '#1e293b'
                                  }}
                                />
                              </div>
                              <div style={{flex: 1}}>
                                <label style={{
                                  display: 'block',
                                  marginBottom: '8px',
                                  color: '#1e293b',
                                  fontWeight: '500'
                                }}>
                                  Unit Price (Rs.)
                                </label>
                                <input
                                  type="number"
                                  value={material.unitPrice}
                                  onChange={(e) => handleMaterialChange(categoryIndex, subCategoryIndex, materialIndex, 'unitPrice', parseFloat(e.target.value))}
                                  placeholder="Enter unit price"
                                  style={{
                                    padding: '10px',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '6px',
                                    width: '100%',
                                    fontSize: '16px',
                                    color: '#1e293b'
                                  }}
                                />
                              </div>
                            </div>

                            <div className="calculations" style={{
                              backgroundColor: '#f8fafc',
                              padding: '15px',
                              borderRadius: '6px'
                            }}>
                              <p style={{color: '#64748b', marginBottom: '10px'}}>
                                Area: {calculateArea(material.length, material.breadth).toFixed(2)} square feet
                              </p>
                              <p style={{color: '#64748b'}}>
                                Total Amount: Rs. {calculateTotal(
                                  calculateArea(material.length, material.breadth),
                                  material.quantity,
                                  material.unitPrice
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}

                        <button
                          onClick={() => addNewMaterial(categoryIndex, subCategoryIndex)}
                          style={{
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            padding: '8px 15px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          Add Another Material
                        </button>
                      </div>
                    ))}

                    <button
                      onClick={() => addNewSubCategory(categoryIndex)}
                      style={{
                        backgroundColor: '#3b82f6',
                        color: 'white',
                        padding: '8px 15px',
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        marginTop: '10px'
                      }}
                    >
                      Add Another Sub Category
                    </button>
                  </div>
                ))}

                <div className="button-group" style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
                  <button
                    onClick={addNewCategory}
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    Add Another Category
                  </button>
                  <button
                    onClick={() => setShowPreview(true)}
                    className="preview-btn"
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Eye size={16} /> Preview
                  </button>
                </div>
              </>
            ) : (
              <div className="preview-section">
                <h2 style={{color: '#2563eb', marginBottom: '30px'}}>Estimate Preview</h2>

                {/* Client Details Preview */}
                <div style={{marginBottom: '30px'}}>
                  <h3 style={{color: '#1e293b', marginBottom: '15px'}}>Client Details</h3>
                  <p style={{color: '#64748b', marginBottom: '10px'}}><strong>Name:</strong> {clientName}</p>
                  <p style={{color: '#64748b', marginBottom: '20px'}}><strong>Address:</strong> {clientAddress}</p>
                </div>

                {categories.map((category, categoryIndex) => (
                  <div key={categoryIndex} style={{marginBottom: '40px'}}>
                    <h3 style={{color: '#1e293b', marginBottom: '15px'}}>{category.category}</h3>
                    
                    {category.subCategories.map((subCategory, subCategoryIndex) => (
                      <div key={subCategoryIndex} style={{marginBottom: '30px'}}>
                        <h4 style={{color: '#64748b', marginBottom: '20px'}}>{subCategory.name}</h4>

                        <table className="preview-table" style={{
                          width: '100%',
                          borderCollapse: 'collapse',
                          marginBottom: '30px'
                        }}>
                          <thead>
                            <tr style={{backgroundColor: '#f8fafc'}}>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Material</th>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Dimensions</th>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Area</th>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Quantity</th>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Unit Price</th>
                              <th style={{padding: '12px', borderBottom: '2px solid #e2e8f0', textAlign: 'left'}}>Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {subCategory.materials.map((material, materialIndex) => {
                              const area = calculateArea(material.length, material.breadth);
                              const total = calculateTotal(area, material.quantity, material.unitPrice);
                              return (
                                <tr key={materialIndex} style={{borderBottom: '1px solid #e2e8f0'}}>
                                  <td style={{padding: '12px'}}>{material.name}</td>
                                  <td style={{padding: '12px'}}>{`${material.length} x ${material.breadth}`}</td>
                                  <td style={{padding: '12px'}}>{area.toFixed(2)} sq ft</td>
                                  <td style={{padding: '12px'}}>{material.quantity}</td>
                                  <td style={{padding: '12px'}}>Rs. {material.unitPrice}</td>
                                  <td style={{padding: '12px'}}>Rs. {total.toFixed(2)}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ))}
                  </div>
                ))}

                <div style={{borderTop: '2px solid #e2e8f0', paddingTop: '20px', marginTop: '20px'}}>
                  <p style={{
                    color: '#1e293b',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    textAlign: 'right'
                  }}>
                    Grand Total: Rs. {calculateGrandTotal().toFixed(2)}
                  </p>
                </div>

                <div className="button-group" style={{display: 'flex', gap: '10px', marginTop: '30px'}}>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="edit-btn"
                    style={{
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <Edit size={16} /> Edit
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="download-btn"
                    style={{
                      backgroundColor: '#2563eb',
                      color: 'white',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <FileDown size={16} /> Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Estimate_Generation;
