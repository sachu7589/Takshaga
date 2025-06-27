import React, { useState, useRef } from 'react';
import Sidebar from '../components/Sidebar';
import '../assets/styles/Main.css';
import '../assets/styles/PdfTemplate.css';

const PdfTemplate = () => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (files) => {
    const newImages = Array.from(files).map((file, index) => ({
      id: Date.now() + index,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setUploadedImages(prev => [...prev, ...newImages]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    handleFileSelect(files);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) URL.revokeObjectURL(image.url);
      return prev.filter(img => img.id !== id);
    });
  };

  const moveImage = (id, direction) => {
    setUploadedImages(prev => {
      const index = prev.findIndex(img => img.id === id);
      if (index === -1) return prev;
      
      const newImages = [...prev];
      if (direction === 'up' && index > 0) {
        [newImages[index], newImages[index - 1]] = [newImages[index - 1], newImages[index]];
      } else if (direction === 'down' && index < newImages.length - 1) {
        [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      }
      return newImages;
    });
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Mobile optimization: smaller max size for mobile devices
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const maxSize = isMobile ? 400 : 800; // Smaller size for mobile
        
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress with lower quality for mobile
        ctx.drawImage(img, 0, 0, width, height);
        const quality = isMobile ? 0.5 : 0.7; // Lower quality for mobile
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const generatePDF = async () => {
    if (uploadedImages.length === 0) {
      alert('Please upload at least one image');
      return;
    }

    setIsGenerating(true);

    try {
      // Load jsPDF dynamically
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      // Add first page image (full page) - use public folder path
      try {
        const firstPageImg = new Image();
        firstPageImg.crossOrigin = 'anonymous';
        firstPageImg.src = '/first page.png'; // Public folder path
        
        await new Promise((resolve) => {
          firstPageImg.onload = () => {
            try {
              pdf.addImage(firstPageImg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
              resolve();
            } catch (error) {
              console.warn('Error adding first page image:', error);
              resolve(); // Continue without first page if error
            }
          };
          firstPageImg.onerror = () => {
            console.warn('Could not load first page image');
            resolve(); // Continue without first page if error
          };
        });
      } catch (error) {
        console.warn('Error with first page:', error);
      }

      // Add uploaded images starting from page 2 (with margins and watermarks)
      for (let i = 0; i < uploadedImages.length; i++) {
        pdf.addPage();
        
        try {
          // Compress the image first
          const compressedBlob = await compressImage(uploadedImages[i].file);
          const compressedUrl = URL.createObjectURL(compressedBlob);
          
          const img = new Image();
          img.src = compressedUrl;
          
          await new Promise((resolve) => {
            img.onload = () => {
              try {
                const margin = 20;
                const contentWidth = pageWidth - (2 * margin);
                const contentHeight = pageHeight - (2 * margin);
                
                const imgAspectRatio = img.width / img.height;
                let imgWidth = contentWidth;
                let imgHeight = contentWidth / imgAspectRatio;
                
                if (imgHeight > contentHeight) {
                  imgHeight = contentHeight;
                  imgWidth = contentHeight * imgAspectRatio;
                }
                
                const x = (pageWidth - imgWidth) / 2;
                const y = (pageHeight - imgHeight) / 2;
                
                pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight, undefined, 'FAST');
                
                // Add watermark
                pdf.setTextColor(255, 255, 255, 0.2); // White with low opacity
                pdf.setFontSize(12);
                pdf.setFont('helvetica', 'normal');
                const watermarkText = 'www.takshaga.com';
                const watermarkWidth = pdf.getTextWidth(watermarkText);
                const watermarkY = pageHeight / 2;
                
                // Calculate how many repetitions fit across the page
                const spacing = watermarkWidth + 20; // 20mm spacing between repetitions
                const repetitions = Math.ceil(pageWidth / spacing);
                
                // Center the pattern
                const totalWidth = repetitions * spacing;
                const startX = (pageWidth - totalWidth) / 2;
                
                // Draw repeated watermarks
                for (let j = 0; j < repetitions; j++) {
                  const watermarkX = startX + (j * spacing);
                  pdf.text(watermarkText, watermarkX, watermarkY);
                }
                
                // Clean up compressed URL
                URL.revokeObjectURL(compressedUrl);
                resolve();
              } catch (error) {
                console.error('Error processing image:', error);
                URL.revokeObjectURL(compressedUrl);
                resolve();
              }
            };
            img.onerror = () => {
              console.error('Error loading compressed image');
              URL.revokeObjectURL(compressedUrl);
              resolve();
            };
          });
        } catch (error) {
          console.error('Error processing uploaded image:', error);
        }
      }

      // Add last page image (full page) - use public folder path
      try {
        pdf.addPage();
        const lastPageImg = new Image();
        lastPageImg.crossOrigin = 'anonymous';
        lastPageImg.src = '/last page.png'; // Public folder path
        
        await new Promise((resolve) => {
          lastPageImg.onload = () => {
            try {
              pdf.addImage(lastPageImg, 'PNG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');
              resolve();
            } catch (error) {
              console.warn('Error adding last page image:', error);
              resolve(); // Continue without last page if error
            }
          };
          lastPageImg.onerror = () => {
            console.warn('Could not load last page image');
            resolve(); // Continue without last page if error
          };
        });
      } catch (error) {
        console.warn('Error with last page:', error);
      }

      pdf.save('takshaga.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`dashboard-container ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>
        &#9776;
      </button>
      <Sidebar isOpen={sidebarOpen} />
      <div className={`dashboard-content ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="content">
          <div className="pdf-generator-container">
            <div className="page-header">
              <h1>PDF Generator</h1>
              <p>Upload images to create a combined PDF with watermarks</p>
            </div>

            <div className="upload-section">
              <div 
                className={`upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="upload-content">
                  <div className="upload-icon">📁</div>
                  <h3>Upload Images</h3>
                  <p>Drag and drop images here or click to browse</p>
                  <p className="upload-hint">Supports: JPG, PNG, GIF</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e.target.files)}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {uploadedImages.length > 0 && (
              <div className="images-section">
                <h2>Uploaded Images ({uploadedImages.length})</h2>
                <div className="images-grid">
                  {uploadedImages.map((image, index) => (
                    <div key={image.id} className="image-card">
                      <div className="image-preview">
                        <img src={image.url} alt={image.name} />
                        <div className="image-overlay">
                          <button 
                            className="btn-remove"
                            onClick={() => removeImage(image.id)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                      <div className="image-info">
                        <p className="image-name">{image.name}</p>
                        <div className="image-actions">
                          <button 
                            className="btn-move"
                            onClick={() => moveImage(image.id, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button 
                            className="btn-move"
                            onClick={() => moveImage(image.id, 'down')}
                            disabled={index === uploadedImages.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="generate-section">
              <button 
                className={`btn-generate ${isGenerating ? 'generating' : ''}`}
                onClick={generatePDF}
                disabled={uploadedImages.length === 0 || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner"></span>
                    Generating PDF...
                  </>
                ) : (
                  'Generate and Download PDF'
                )}
              </button>
              <p className="generate-info">
                The PDF will include: First page image → Your images (with watermarks) → Last page image
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfTemplate; 