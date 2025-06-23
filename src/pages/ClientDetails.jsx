import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as QRCode from 'qrcode';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";

// Create a reusable function for adding the PAID seal
const addPaidSeal = (doc) => {
  // Set the color and font for the seal
  doc.setFillColor(135, 206, 235); // Sky blue color
  doc.setTextColor(255, 255, 255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(48);
  
  // Apply transparency
  doc.setGState(new doc.GState({ opacity: 0.3 }));
  
  // Add the text with rotation
  doc.text('PAID', 150, 150, {
    angle: -30,
    align: 'center'
  });
};

function ClientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [grandTotals, setGrandTotals] = useState([]);
  const [estimateStatus, setEstimateStatus] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [stageNote, setStageNote] = useState("");
  const [stages, setStages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [editPaymentData, setEditPaymentData] = useState({
    id: '',
    amount: ''
  });
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    clientName: "",
    email: "",
    phoneNumber: "",
    location: ""
  });
  // New state variables for expenses
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    purpose: 'labour',
    notes: ''  // Initialize notes as empty string
  });
  const [userNames, setUserNames] = useState({});
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const editClientButtonRef = useRef(null);
  const addStageButtonRef = useRef(null);

  // Add these new state variables for bank selection
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState(null);

  // Add styles for expense details and financial summary
  const styles = {
    financialSummarySection: {
      marginBottom: '2rem',
      padding: '1.5rem',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    },
    summaryCards: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '1.5rem',
      marginTop: '1rem'
    },
    summaryCard: {
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    summaryIcon: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '1.2rem'
    },
    paymentsIcon: {
      backgroundColor: '#e3f2fd',
      color: '#1976d2'
    },
    expensesIcon: {
      backgroundColor: '#fbe9e7',
      color: '#d84315'
    },
    balanceIcon: {
      backgroundColor: '#e8f5e9',
      color: '#2e7d32'
    },
    summaryDetails: {
      flex: 1
    },
    summaryTitle: {
      fontSize: '0.9rem',
      color: '#666',
      marginBottom: '0.5rem'
    },
    summaryAmount: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333'
    }
  };

  // Function to fetch user name
  const fetchUserName = async (userId) => {
    try {
      if (!userId || userNames[userId]) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
      if (response.data && response.data.user) {
        setUserNames(prev => ({
          ...prev,
          [userId]: response.data.user.name
        }));
      }
    } catch (error) {
      console.error('Error fetching user name:', error);
    }
  };

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      // Fetch user names for paid payments and expenses
      const fetchUserNames = async (payments, expenses) => {
        // Fetch for paid payments
        for (const payment of payments) {
          if (payment.status === 'paid' && payment.userId) {
            await fetchUserName(payment.userId);
          }
        }
        // Fetch for expenses
        for (const expense of expenses) {
          if (expense.userId) {
            await fetchUserName(expense.userId);
          }
        }
      };
      try {
        setIsLoading(true);
        const [clientResponse, stagesResponse, paymentsResponse, expensesResponse, banksResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/stages/client/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/client-payments/client/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/client-expenses/client/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/banks/display`)
        ]);

        if (!clientResponse.data) {
          throw new Error('Client not found');
        }
        
        setClient(clientResponse.data);
        setStages(stagesResponse.data);
        setPayments(paymentsResponse.data);
        // Expenses are already sorted by date in descending order from the backend
        setExpenses(expensesResponse.data);
        setBanks(banksResponse.data);
        // Don't set any default bank - user must select one
        await fetchUserNames(paymentsResponse.data, expensesResponse.data);
        setEditFormData({
          clientName: clientResponse.data.clientName,
          email: clientResponse.data.email,
          phoneNumber: clientResponse.data.phoneNumber,
          location: clientResponse.data.location
        });
        
        if (clientResponse.data.stage > 0) {
          try {
            const grandTotalResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${id}/grandTotal`);
            if (grandTotalResponse.data && grandTotalResponse.data.grandTotal) {
              setGrandTotals([grandTotalResponse.data.grandTotal]);
            }
            
            // Fetch estimate status
            const estimateResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${id}`);
            if (estimateResponse.data && estimateResponse.data.length > 0) {
              setEstimateStatus(estimateResponse.data[0].status || 1);
            }
          } catch (error) {
            console.error('Error fetching estimate data:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        let errorMessage = 'Failed to fetch data';
        
        if (error.response?.status === 404) {
          errorMessage = 'Client not found';
        } else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }

        Swal.fire({
          title: 'Error!',
          text: errorMessage,
          icon: 'error',
          confirmButtonText: 'OK',
          confirmButtonColor: '#dc3545'
        }).then(() => {
          navigate('/client');
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handlePrepareEstimate = () => {
    navigate(`/estimateGenerationClient/${id}`);
  };

  const handleViewEstimate = async (clientId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${clientId}`);
      
      if (response.data && response.data.length > 0) {
        navigate(`/estimatePreview/${response.data[0]._id}`);
      } else {
        Swal.fire({
          title: 'No Estimates',
          text: 'No estimates found for this client',
          icon: 'info',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error fetching estimates:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to retrieve estimate information',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleAddStage = () => {
    handleModalOpen(addStageButtonRef, setShowStageModal);
  };

  const handleStageSubmit = async () => {
    try {
      if (!stageNote.trim()) {
        Swal.fire({
          title: 'Error!',
          text: 'Please enter stage notes',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Create a new stage entry
      const stageResponse = await axios.post(`${import.meta.env.VITE_API_URL}/api/stages`, {
        clientId: id,
        note: stageNote
      });

      // Update client stage
      const updatedClient = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
        ...client,
        stage: client.stage + 1
      });
      
      // Update local state with new stage and client data
      setStages(prevStages => [...prevStages, stageResponse.data]);
      setClient(updatedClient.data);
      setShowStageModal(false);
      setStageNote("");
      
      Swal.fire({
        title: 'Success!',
        text: 'New stage has been added',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error adding stage:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to add stage',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEditClient = () => {
    handleModalOpen(editClientButtonRef, setShowEditModal);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateClient = async () => {
    try {
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
        ...editFormData,
        stage: client.stage,
        completed: client.completed
      });

      if (response.data) {
        setClient(response.data);
        setShowEditModal(false);
        Swal.fire({
          title: 'Success!',
          text: 'Client details updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating client:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update client',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDeleteClient = async () => {
    try {
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: "This will deactivate the client. You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, deactivate it!'
      });

      if (result.isConfirmed) {
        await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/status/${id}`, {
          status: 0
        });
        
        Swal.fire(
          'Deactivated!',
          'Client has been deactivated.',
          'success'
        ).then(() => {
          navigate('/client');
        });
      }
    } catch (error) {
      console.error('Error deactivating client:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to deactivate client',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      // Get the estimate
      const estimateResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${id}`);
      if (estimateResponse.data && estimateResponse.data.length > 0) {
        const estimateId = estimateResponse.data[0]._id;
        
        // Update estimate status using the correct endpoint
        await axios.put(`${import.meta.env.VITE_API_URL}/api/estimates/status/${estimateId}`, {
          status: newStatus
        });

        // If estimate is approved, create a new stage and payment record
        if (newStatus === 2) {
          // Create stage entry
          const newStage = await axios.post(`${import.meta.env.VITE_API_URL}/api/stages`, {
            clientId: id,
            note: "Estimate Approved"
          });

          // Calculate 50% of grand total and create payment record
          if (grandTotals.length > 0) {
            const totalAmount = parseFloat(grandTotals[0]);
            const paymentAmount = totalAmount * 0.5;
            
            const newPayment = await axios.post(`${import.meta.env.VITE_API_URL}/api/client-payments`, {
              clientId: id,
              amount: paymentAmount
            });

            // Update payments state
            setPayments(prevPayments => [...prevPayments, newPayment.data]);

            // Update stages state
            setStages(prevStages => [...prevStages, newStage.data]);
          }
        }
        
        // Update client stage
        const updatedClient = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
          ...client,
          stage: client.stage + 1
        });
        
        setEstimateStatus(newStatus);
        setClient(updatedClient.data);
        
        const statusText = newStatus === 2 ? 'approved' : 'rejected';
        Swal.fire({
          title: 'Success!',
          text: `Estimate has been ${statusText} and moved to next stage`,
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating estimate status:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update estimate status',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleWorkStarted = async () => {
    try {
      // Create a new stage entry for work started
      await axios.post(`${import.meta.env.VITE_API_URL}/api/stages`, {
        clientId: id,
        note: "Work Started"
      });

      // Update client stage
      const updatedClient = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
        ...client,
        stage: client.stage + 1
      });
      
      setClient(updatedClient.data);
      
      Swal.fire({
        title: 'Success!',
        text: 'Work has been started and stage updated',
        icon: 'success',
        confirmButtonText: 'OK'
      });
    } catch (error) {
      console.error('Error starting work:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to start work',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleCompleted = async () => {
    try {
      // Create a new stage entry for completion
      await axios.post(`${import.meta.env.VITE_API_URL}/api/stages`, {
        clientId: id,
        note: "Project Completed"
      });

      // Update client with completed status
      const updatedClient = await axios.put(`${import.meta.env.VITE_API_URL}/api/clients/update/${id}`, {
        ...client,
        completed: 1
      });
      
      setClient(updatedClient.data);
      
      Swal.fire({
        title: 'Success!',
        text: 'Project has been marked as completed',
        icon: 'success',
        confirmButtonText: 'OK'
      });

      // Redirect to clients page after completion
      navigate('/client');
    } catch (error) {
      console.error('Error marking project as completed:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to mark project as completed',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleMarkAsPaid = async (paymentId) => {
    try {
      const userId = sessionStorage.getItem('userId');
      const response = await axios.put(`${import.meta.env.VITE_API_URL}/api/client-payments/${paymentId}`, {
        status: 'paid',
        userId: userId
      });

      if (response.data) {
        // Update the payments list with the new status
        setPayments(payments.map(payment => 
          payment._id === paymentId ? { ...payment, status: 'paid', userId: userId } : payment
        ));

        Swal.fire({
          title: 'Success!',
          text: 'Payment has been marked as paid',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update payment status',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const generateQRCode = async (amount) => {
    try {
      if (!selectedBank || !selectedBank.upiId) {
        console.warn('No UPI ID available for QR code generation');
        return null;
      }
      // Create UPI payment URL using selected bank's UPI ID
      const upiUrl = `upi://pay?pa=${selectedBank.upiId}&pn=${selectedBank.accountName}&am=${amount}&cu=INR`;
      // Generate QR code as data URL
      return await QRCode.toDataURL(upiUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  };

  const handleDownloadInvoice = async (payment) => {
    try {
      // Check if a bank is selected
      if (!selectedBank) {
        Swal.fire({
          title: 'No Bank Account Selected',
          text: 'Please select a bank account from the dropdown in the Payment History section before generating the invoice.',
          icon: 'warning',
          confirmButtonText: 'OK'
        });
        return;
      }

      // Get the payment index to determine the phase
      const paymentIndex = payments.findIndex(p => p._id === payment._id);
      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      // Generate QR code first
      const qrCodeDataUrl = await generateQRCode(parseFloat(payment.amount));
      
      const doc = new jsPDF();
      
      // Add full page border - only 4 sides
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 35, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 35, 200, 12, 'F');
      
      // Add logo on right side with reduced size
      const logoUrl = '/takshaga.png';
      doc.addImage(logoUrl, 'PNG', 165, 8, 30, 20);
      
      // Add company details on left side with professional styling
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("TAKSHAGA", 15, 18);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Where Art Meets Architecture", 15, 25);
      doc.text("Upputhara po, Idukki, Kerala - 685505", 15, 31);

      // Add contact details horizontally in light blue area
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.text("+91 9846660624  |  +91 9544344332  |  www.takshaga.com", 105, 43, { align: 'center' });
      
      // Add professional invoice details section with gray background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 57, 200, 45, 2, 2, 'F');
      
      // Add invoice details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("INVOICE DETAILS", 15, 67);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Date: ${formatDate(payment.date)}`, 15, 77);
      
      // Add client details on right with better structure
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("BILL TO", 110, 67);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(client.clientName, 110, 77);
      doc.text(client.location || "", 110, 87);
      
      // Add INVOICE heading with professional styling
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 112, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("INVOICE", 105, 120, { align: "center" });

      // Add payment details table
      autoTable(doc, {
        startY: 132,
        head: [['Description', 'Amount']],
        body: [
          [`Phase ${paymentIndex + 1} Payment`, `Rs. ${parseFloat(payment.amount).toLocaleString()}`],
          ['Total Amount', `Rs. ${parseFloat(payment.amount).toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { left: 15, right: 15 }
      });

      let yPos = doc.lastAutoTable.finalY + 20;

      // Add bank details section with professional styling
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("PAYMENT DETAILS", 105, yPos + 8, { align: "center" });

      yPos += 25;
      
      // Add bank details and QR code in two columns
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("Bank Details", 15, yPos);
      doc.text("UPI Payment", 110, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      
      // Use selected bank details or fallback to default
      const bankDetails = selectedBank ? [
        `Bank: ${selectedBank.bankName}`,
        `Account Name: ${selectedBank.accountName}`,
        `Account Number: ${selectedBank.accountNumber}`,
        `IFSC Code: ${selectedBank.ifscCode}`,
        `Account Type: ${selectedBank.accountType || 'N/A'}`,
        `UPI ID: ${selectedBank.upiId || 'N/A'}`
      ] : [
        "Bank: Please select a bank account",
        "Account Name: N/A",
        "Account Number: N/A", 
        "IFSC Code: N/A",
        "Account Type: N/A",
        "UPI ID: N/A"
      ];
      
      doc.text(bankDetails, 15, yPos);

      // Add QR code if generated successfully
      if (qrCodeDataUrl) {
        doc.addImage(qrCodeDataUrl, 'PNG', 110, yPos - 5, 50, 50);
        doc.setFontSize(9);
        doc.text("Scan to pay via UPI", 110, yPos + 55);
        doc.text(`Pay to: ${selectedBank.accountName}`, 110, yPos + 62);
      } else if (selectedBank && !selectedBank.upiId) {
        doc.setFontSize(9);
        doc.text("QR code not available", 110, yPos + 10);
        doc.text("(No UPI ID configured)", 110, yPos + 20);
      }

      yPos += 80;

      // Add notes section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("NOTES", 105, yPos + 8, { align: "center" });

      yPos += 25;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text([
        "• This is a computer-generated invoice.",
        "• Please make the payment within 7 days of invoice generation.",
        "• For any queries, please contact our support team.",
        "• Thank you for your business!"
      ], 15, yPos);

      // Add page number
      doc.setFontSize(8);
      doc.text('Page 1 of 1', 105, 290, { align: 'center' });

      // Save the PDF with client name and phase
      const fileName = `Invoice-${client.clientName.trim().replace(/\s+/g, '_')}-Phase${paymentIndex + 1}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating invoice:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate invoice',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleDownloadReceipt = async (payment) => {
    try {
      // Get the payment index to determine the phase
      const paymentIndex = payments.findIndex(p => p._id === payment._id);
      if (paymentIndex === -1) {
        throw new Error('Payment not found');
      }

      const doc = new jsPDF();
      
      // Add full page border - only 4 sides
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 35, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 35, 200, 12, 'F');
      
      // Add logo on right side with reduced size
      const logoUrl = '/takshaga.png';
      doc.addImage(logoUrl, 'PNG', 165, 8, 30, 20);
      
      // Add company details on left side with professional styling
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("TAKSHAGA", 15, 18);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Where Art Meets Architecture", 15, 25);
      doc.text("Upputhara po, Idukki, Kerala - 685505", 15, 31);

      // Add contact details horizontally in light blue area
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'normal');
      doc.text("+91 9846660624  |  +91 9544344332  |  www.takshaga.com", 105, 43, { align: 'center' });
      
      // Add professional receipt details section with gray background
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 57, 200, 45, 2, 2, 'F');
      
      // Add receipt details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("RECEIPT DETAILS", 15, 67);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Date: ${formatDate(payment.date)}`, 15, 77);
      
      // Add client details on right with better structure
      doc.setFontSize(11);
      doc.setFont(undefined, 'bold');
      doc.text("BILL TO", 110, 67);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(client.clientName, 110, 77);
      doc.text(client.location || "", 110, 87);
      
      // Add RECEIPT heading with professional styling
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 112, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("PAYMENT RECEIPT", 105, 120, { align: "center" });

      // Calculate total paid amount and balance
      const grandTotal = grandTotals[0] || 0;
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const balance = grandTotal - totalPaid;

      // Add payment details table
      autoTable(doc, {
        startY: 132,
        head: [['Description', 'Amount']],
        body: [
          [`Phase ${paymentIndex + 1} Payment`, `Rs. ${parseFloat(payment.amount).toLocaleString()}`],
          ['Total Project Amount', `Rs. ${parseFloat(grandTotal).toLocaleString()}`],
          ['Total Amount Paid', `Rs. ${parseFloat(totalPaid).toLocaleString()}`],
          ['Balance Amount', `Rs. ${parseFloat(balance).toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
          textColor: [0, 0, 0]
        },
        styles: { fontSize: 10, cellPadding: 5 },
        margin: { left: 15, right: 15 }
      });

      let yPos = doc.lastAutoTable.finalY + 20;

      // Add PAID seal
      addPaidSeal(doc);

      // Add notes section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("NOTES", 105, yPos + 8, { align: "center" });

      yPos += 25;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text([
        "• This is a computer-generated receipt.",
        "• This receipt confirms the payment received for the specified phase.",
        "• For any queries, please contact our support team.",
        "• Thank you for your business!"
      ], 15, yPos);

      // Add page number
      doc.setFontSize(8);
      doc.text('Page 1 of 1', 105, 290, { align: 'center' });

      // Save the PDF with client name and phase
      const fileName = `Receipt-${client.clientName.trim().replace(/\s+/g, '_')}-Phase${paymentIndex + 1}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating receipt:', error);
      Swal.fire({
        title: 'Error!',
        text: error.message || 'Failed to generate receipt',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleEditPayment = (payment) => {
    setEditingPaymentId(payment._id);
    setEditPaymentData({
      id: payment._id,
      amount: payment.amount.toString() // Convert to string for input field
    });
  };

  const handleUpdatePayment = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/client-payments/${editPaymentData.id}`,
        { amount: parseFloat(editPaymentData.amount) }
      );

      if (response.data) {
        // Update the payments list with the new amount
        setPayments(payments.map(payment => 
          payment._id === editPaymentData.id 
            ? { ...payment, amount: parseFloat(editPaymentData.amount) }
            : payment
        ));

        setEditingPaymentId(null);
        setEditPaymentData({ id: '', amount: '' });
        Swal.fire({
          title: 'Success!',
          text: 'Payment amount updated successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error updating payment amount:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to update payment amount',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingPaymentId(null);
    setEditPaymentData({ id: '', amount: '' });
  };

  const handleDownloadPaymentReport = async () => {
    try {
      const doc = new jsPDF();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add header with gradient effect
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 5, 200, 35, 'F');
      doc.setFillColor(0, 71, 142);
      doc.rect(5, 35, 200, 12, 'F');
      
      // Add logo
      const logoUrl = '/takshaga.png';
      doc.addImage(logoUrl, 'PNG', 165, 8, 30, 20);
      
      // Add company details
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("TAKSHAGA", 15, 18);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Where Art Meets Architecture", 15, 25);
      doc.text("Upputhara po, Idukki, Kerala - 685505", 15, 31);

      // Add contact details
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("+91 9846660624  |  +91 9544344332  |  www.takshaga.com", 105, 43, { align: 'center' });
      
      // Add report title
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 57, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("PAYMENT REPORT", 105, 65, { align: "center" });

      // Add client details section
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Client Details", 15, 85);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(10);
      doc.text([
        `Client Name: ${client.clientName}`,
        `Email: ${client.email}`,
        `Phone: ${client.phoneNumber}`,
        `Location: ${client.location || 'N/A'}`,
        `Project Total: ${parseFloat(grandTotals[0]).toLocaleString()}`
      ], 15, 95);

      // Add payment details table
      const sortedPayments = [...payments].sort((a, b) => new Date(a.date) - new Date(b.date));
      const tableHeaders = [['Phase', 'Date', 'Amount']];
      const tableData = sortedPayments.map((payment, index) => [
        `Phase ${index + 1}`,
        formatDate(payment.date),
        `${parseFloat(payment.amount).toLocaleString()}`
      ]);

      // Calculate total paid amount
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const balance = parseFloat(grandTotals[0]) - totalPaid;

      // Add summary rows with column span
      tableData.push(
        [{ content: 'Total Paid', colSpan: 2 }, `${totalPaid.toLocaleString()}`],
        [{ content: 'Balance', colSpan: 2 }, `${balance.toLocaleString()}`]
      );

      autoTable(doc, {
        startY: 120,
        head: tableHeaders,
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        styles: {
          fontSize: 10,
          cellPadding: 5
        },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 50 },
          2: { cellWidth: 80 }
        }
      });

      // Add payment summary
      const summaryY = doc.lastAutoTable.finalY + 20;
      doc.setFillColor(0, 51, 102);
      doc.rect(5, summaryY, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("PAYMENT SUMMARY", 105, summaryY + 8, { align: "center" });

      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const percentagePaid = ((totalPaid / parseFloat(grandTotals[0])) * 100).toFixed(0);
      doc.text([
        `Total Project Amount: ${parseFloat(grandTotals[0]).toLocaleString()}`,
        `Total Amount Paid: ${totalPaid.toLocaleString()} (${percentagePaid}%)`,
        `Remaining Balance: ${balance.toLocaleString()}`,
        `Payment Status: ${balance === 0 ? 'FULLY PAID' : 'PARTIALLY PAID'}`
      ], 15, summaryY + 25);

      // Add footer
      doc.setFontSize(8);
      doc.text('This is a computer-generated report.', 105, 280, { align: 'center' });
      doc.text('Page 1 of 1', 105, 285, { align: 'center' });

      // Save the PDF
      const fileName = `Payment_Report_${client.clientName.trim().replace(/\s+/g, '_')}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating payment report:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate payment report',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleAddExpense = async () => {
    try {
      if (!newExpense.amount || parseFloat(newExpense.amount) <= 0) {
        Swal.fire({
          title: 'Error!',
          text: 'Please enter a valid amount',
          icon: 'error',
          confirmButtonText: 'OK'
        });
        return;
      }

      const userId = sessionStorage.getItem('userId');
      // Create the expense data object with all required fields
      const expenseData = {
        clientId: id,
        userId: userId,
        amount: parseFloat(newExpense.amount),
        purpose: newExpense.purpose,
        notes: newExpense.notes && newExpense.notes.trim() !== '' ? newExpense.notes.trim() : null
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/client-expenses`, expenseData);

      if (response.data) {
        // Sort expenses by date in descending order to match backend
        setExpenses(prevExpenses => [...prevExpenses, response.data].sort((a, b) => 
          new Date(b.date) - new Date(a.date)
        ));
        setShowExpenseForm(false);
        setNewExpense({
          amount: '',
          purpose: 'labour',
          notes: ''
        });
        
        Swal.fire({
          title: 'Success!',
          text: 'Expense added successfully',
          icon: 'success',
          confirmButtonText: 'OK'
        });
      }
    } catch (error) {
      console.error('Error adding expense:', error);
      Swal.fire({
        title: 'Error!',
        text: error.response?.data?.message || 'Failed to add expense',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  // Function to handle modal positioning
  const handleModalOpen = (buttonRef, setModalState) => {
    if (buttonRef.current) {
      setModalState(true);
    }
  };

  // Render expenses in table format - only tables with totals
  const renderExpensesTables = () => {
    // Define category configurations
    const categoryConfigs = {
      labour: {
        name: 'Labour Expenses',
        headerColor: '#e65100',
        bgColor: '#fff3e0',
        tableHeaderBg: '#ffe0b2',
        footerBg: '#fff3e0',
        borderColor: '#e65100'
      },
      material: {
        name: 'Material Expenses', 
        headerColor: '#1565c0',
        bgColor: '#e3f2fd',
        tableHeaderBg: '#bbdefb',
        footerBg: '#e3f2fd',
        borderColor: '#1565c0'
      },
      other: {
        name: 'Other Expenses',
        headerColor: '#7b1fa2',
        bgColor: '#f3e5f5',
        tableHeaderBg: '#e1bee7',
        footerBg: '#f3e5f5',
        borderColor: '#7b1fa2'
      }
    };

    return (
      <div>
        {/* Individual Category Tables */}
        {Object.entries(categoryConfigs).map(([category, config]) => {
          const categoryExpenses = expenses.filter(expense => expense.purpose === category);
          if (categoryExpenses.length === 0) return null;

          const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);

          return (
            <div key={category} style={{ 
              marginBottom: '25px',
              width: '100%',
              maxWidth: '100%',
              boxSizing: 'border-box'
            }}>
              {/* Category Header */}
              <div style={{
                backgroundColor: config.headerColor,
                color: 'white',
                padding: '12px 16px',
                borderRadius: '8px 8px 0 0',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                marginBottom: '0'
              }}>
                {config.name}
              </div>
              <table style={{
                borderCollapse: 'collapse',
                backgroundColor: 'white',
                borderRadius: '0 0 8px 8px',
                overflow: 'hidden',
                tableLayout: 'auto',
                boxSizing: 'border-box'
              }}>
                  <thead>
                    <tr style={{ backgroundColor: config.tableHeaderBg }}>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Added By</th>
                      <th style={{ padding: '12px', textAlign: 'left' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryExpenses
                      .sort((a, b) => new Date(b.date) - new Date(a.date))
                      .map((expense) => (
                        <tr key={expense._id} style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{parseFloat(expense.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {expense.userId ? userNames[expense.userId] : 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {expense.notes || 'No notes'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ 
                      backgroundColor: config.footerBg,
                      fontWeight: 'bold',
                      borderTop: `2px solid ${config.borderColor}`
                    }}>
                      <td style={{ padding: '12px' }}>Total</td>
                      <td style={{ padding: '12px' }}>
                        ₹{categoryTotal.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px' }}></td>
                      <td style={{ padding: '12px' }}></td>
                    </tr>
                  </tfoot>
                </table>
            </div>
          );
        })}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="error-container">
        <h2>Error loading client details</h2>
        <button onClick={() => navigate('/client')} className="back-button">
          Back to Clients
        </button>
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
        <div className="client-details-container">
          <div className="client-details-layout">
            {/* Left Section - Client Information */}
            <div className="client-info-section">
              {/* Professional Client Information Header */}
              <div className="client-info-header">
                <div className="client-info-main">
                  <div className="client-name-section">
                    <h2>{client.clientName}</h2>
                    <div className="client-badges">
                      <span className="client-status">{client.completed ? 'Completed' : 'Active'}</span>
                    </div>
                  </div>
                  <div className="client-quick-info">
                    <div className="info-item">
                      <i className="fas fa-envelope"></i>
                      <span>{client.email}</span>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-phone"></i>
                      <span>{client.phoneNumber}</span>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{client.location || 'No location specified'}</span>
                    </div>
                  </div>
                </div>
                <div className="client-actions">
                  {client.stage === 0 && (
                    <button 
                      ref={editClientButtonRef}
                      className="action-btn edit-btn"
                      onClick={handleEditClient}
                    >
                      <i className="fas fa-edit"></i>
                      Edit Details
                    </button>
                  )}
                  <button 
                    className="action-btn delete-btn"
                    onClick={handleDeleteClient}
                  >
                    <i className="fas fa-trash-alt"></i>
                    Delete Client
                  </button>
                </div>
              </div>

              {/* Project Progress Section */}
              <div className="project-progress-section">
                <div className="progress-header">
                  <div className="progress-title">
                    {client.stage > 0 && (
                      <div className="stage-indicator">
                        <span className="current-stage-badge">Stage {client.stage}</span>
                      </div>
                    )}
                  </div>
                  <div className="estimate-actions">
                    {client.stage === 0 ? (
                      <button 
                        className="prepare-estimate-btn"
                        onClick={handlePrepareEstimate}
                      >
                        <i className="fas fa-file-invoice"></i>
                        Prepare Estimate
                      </button>
                    ) : (
                      <div className="estimate-controls">
                        <button 
                          className="view-estimate-btn"
                          onClick={() => handleViewEstimate(id)}
                        >
                          <i className="fas fa-eye"></i>
                          View Estimate
                        </button>
                        {grandTotals.length > 0 && (
                          <div className="estimate-amount">
                            <span className="amount-label">Project Value:</span>
                            <span className="amount-value">
                              ₹{parseFloat(grandTotals[0]).toLocaleString()}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="stages-container">
                  {/* Current Stage Status */}
                  {client.stage > 0 && (
                    <div className="current-stage-status">
                      {estimateStatus === 3 ? (
                        <div className="status-card rejected">
                          <i className="fas fa-times-circle"></i>
                          <span>Estimate Rejected</span>
                        </div>
                      ) : (
                        <div className="status-card">
                          {client.stage === 1 && (
                            <>
                              {estimateStatus === 1 && (
                                <div className="estimate-approval">
                                  <span className="status-badge status-pending">
                                    <i className="fas fa-clock"></i>
                                    Pending Approval
                                  </span>
                                  <div className="approval-actions">
                                    <button 
                                      className="approve-btn"
                                      onClick={() => handleStatusChange(2)}
                                    >
                                      <i className="fas fa-check"></i>
                                      Approve
                                    </button>
                                    <button 
                                      className="reject-btn"
                                      onClick={() => handleStatusChange(3)}
                                    >
                                      <i className="fas fa-times"></i>
                                      Reject
                                    </button>
                                  </div>
                                </div>
                              )}
                              {estimateStatus === 2 && (
                                <div className="status-approved">
                                  <i className="fas fa-check-circle"></i>
                                  <span>Estimate Approved</span>
                                </div>
                              )}
                            </>
                          )}
                          {client.stage === 2 && estimateStatus === 2 && (
                            <div className="work-start-section">
                              <span className="status-badge status-approved">
                                <i className="fas fa-check"></i>
                                Estimate Approved
                              </span>
                              <button 
                                className="start-work-btn"
                                onClick={handleWorkStarted}
                              >
                                <i className="fas fa-play"></i>
                                Start Work
                              </button>
                            </div>
                          )}
                          {client.stage > 2 && !client.completed && (
                            <div className="stage-actions">
                              <button 
                                ref={addStageButtonRef}
                                className="add-stage-btn"
                                onClick={handleAddStage}
                              >
                                <i className="fas fa-plus"></i>
                                Add New Stage
                              </button>
                              {client.stage >= 4 && (
                                <button 
                                  className="complete-btn"
                                  onClick={handleCompleted}
                                >
                                  <i className="fas fa-flag-checkered"></i>
                                  Mark Project Complete
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage History Timeline */}
                  {stages.length > 0 && (
                    <div className="stages-history">
                      <h4>Project Timeline</h4>
                      <div className="timeline-container">
                        {stages
                          .filter(stage => stage && stage.date)
                          .sort((a, b) => {
                            const dateA = new Date(a.date);
                            const dateB = new Date(b.date);
                            return isNaN(dateA.getTime()) || isNaN(dateB.getTime()) 
                              ? 0 
                              : dateA.getTime() - dateB.getTime();
                          })
                          .map((stage, index) => (
                            <div key={stage._id} className="timeline-item">
                              <div className="timeline-marker">
                                <div className="marker-dot"></div>
                                <div className="marker-line"></div>
                              </div>
                              <div className="timeline-content">
                                <div className="timeline-header">
                                  <span className="timeline-date">
                                    <i className="fas fa-calendar-alt"></i>
                                    {formatDate(stage.date)}
                                  </span>
                                  <span className="timeline-stage">Stage {index + 1}</span>
                                </div>
                                <div className="timeline-note">{stage.note}</div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

                          {/* Financial Summary Section */}
              {estimateStatus === 2 && (
                <div className="financial-overview">
                  {/* Summary Cards */}
                  <div className="summary-section" style={styles.financialSummarySection}>
                    <h3>Financial Summary</h3>
                    <div style={styles.summaryCards}>
                      {/* Total Payments Received */}
                      <div style={styles.summaryCard}>
                        <div style={{...styles.summaryIcon, ...styles.paymentsIcon}}>
                          <i className="fas fa-money-bill-wave"></i>
                        </div>
                        <div style={styles.summaryDetails}>
                          <h4 style={styles.summaryTitle}>Total Payments Received</h4>
                          <span style={styles.summaryAmount}>
                            ₹{payments
                              .filter(p => p.status === 'paid')
                              .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Total Expenses */}
                      <div style={styles.summaryCard}>
                        <div style={{...styles.summaryIcon, ...styles.expensesIcon}}>
                          <i className="fas fa-file-invoice-dollar"></i>
                        </div>
                        <div style={styles.summaryDetails}>
                          <h4 style={styles.summaryTitle}>Total Expenses</h4>
                          <span style={styles.summaryAmount}>
                            ₹{expenses
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Net Balance */}
                      <div style={styles.summaryCard}>
                        <div style={{...styles.summaryIcon, ...styles.balanceIcon}}>
                          <i className="fas fa-wallet"></i>
                        </div>
                        <div style={styles.summaryDetails}>
                          <h4 style={styles.summaryTitle}>Net Balance</h4>
                          <span style={styles.summaryAmount}>
                            ₹{(
                              payments
                                .filter(p => p.status === 'paid')
                                .reduce((sum, p) => sum + parseFloat(p.amount), 0) -
                              expenses
                                .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expense Breakdown Section */}
                  <div className="expense-breakdown-section" style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px'
                  }}>
                    <h3>Expense Breakdown</h3>
                    <div className="expense-categories" style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1.5rem',
                      marginTop: '1rem'
                    }}>
                      {/* Labour Expenses */}
                      <div className="expense-category labour" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div className="category-icon" style={{
                          backgroundColor: '#fff3e0',
                          color: '#f57c00',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-hard-hat"></i>
                        </div>
                        <div className="category-info" style={{
                          flex: 1
                        }}>
                          <h4 style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Labour</h4>
                          <span className="amount" style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#333',
                            display: 'block',
                            marginTop: '0.25rem'
                          }}>
                            ₹{expenses
                              .filter(e => e.purpose === 'labour')
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Materials Expenses */}
                      <div className="expense-category materials" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div className="category-icon" style={{
                          backgroundColor: '#e3f2fd',
                          color: '#1976d2',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-tools"></i>
                        </div>
                        <div className="category-info" style={{
                          flex: 1
                        }}>
                          <h4 style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Materials</h4>
                          <span className="amount" style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#333',
                            display: 'block',
                            marginTop: '0.25rem'
                          }}>
                            ₹{expenses
                              .filter(e => e.purpose === 'material')
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Other Expenses */}
                      <div className="expense-category other" style={{
                        backgroundColor: 'white',
                        padding: '1.5rem',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                      }}>
                        <div className="category-icon" style={{
                          backgroundColor: '#f3e5f5',
                          color: '#7b1fa2',
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <i className="fas fa-receipt"></i>
                        </div>
                        <div className="category-info" style={{
                          flex: 1
                        }}>
                          <h4 style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Other</h4>
                          <span className="amount" style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: '#333',
                            display: 'block',
                            marginTop: '0.25rem'
                          }}>
                            ₹{expenses
                              .filter(e => e.purpose === 'other')
                              .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            {/* Central Content Area - Financial Details */}
            {estimateStatus === 2 && (
              <div className="central-financial-section" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '2rem',
                flex: '1',
                maxWidth: '100%'
              }}>
                {/* Expenses Section - Centrally positioned */}
                <div className="expenses-section" style={{
                  backgroundColor: '#fff',
                  borderRadius: '12px',
                  padding: '2rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  border: '1px solid #e0e0e0',
                  width: '100%',
                  maxWidth: '100%',
                  boxSizing: 'border-box'
                }}>
                  <div className="expenses-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1.5rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid #f0f0f0'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '1.5rem',
                      color: '#333',
                      fontWeight: '600'
                    }}>Project Expenses</h3>
                    <button 
                      className="add-expense-btn"
                      onClick={() => setShowExpenseForm(!showExpenseForm)}
                      style={{
                        padding: '10px 20px',
                        backgroundColor: showExpenseForm ? '#dc3545' : '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '500',
                        transition: 'background-color 0.3s ease'
                      }}
                    >
                      <i className={showExpenseForm ? 'fas fa-times' : 'fas fa-plus'}></i>
                      {showExpenseForm ? ' Cancel' : ' Add Expense'}
                    </button>
                  </div>

                  {/* Inline Expense Form */}
                  {showExpenseForm && (
                    <div style={{
                      backgroundColor: '#f8f9fa',
                      padding: '25px',
                      borderRadius: '10px',
                      marginBottom: '25px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      border: '1px solid #e9ecef'
                    }}>
                      <h4 style={{
                        marginTop: 0,
                        marginBottom: '20px',
                        color: '#333',
                        fontSize: '1.1rem'
                      }}>Add New Expense</h4>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '20px'
                      }}>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.95rem',
                            color: '#555',
                            fontWeight: '500'
                          }}>
                            Amount (₹):
                          </label>
                          <input
                            type="number"
                            value={newExpense.amount}
                            onChange={(e) => setNewExpense({
                              ...newExpense,
                              amount: e.target.value
                            })}
                            min="0"
                            step="0.01"
                            placeholder="Enter amount"
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '1rem',
                              color: '#000',
                              transition: 'border-color 0.3s ease',
                              backgroundColor: 'white'
                            }}
                          />
                        </div>
                        <div>
                          <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            fontSize: '0.95rem',
                            color: '#555',
                            fontWeight: '500'
                          }}>
                            Category:
                          </label>
                          <select
                            value={newExpense.purpose}
                            onChange={(e) => setNewExpense({
                              ...newExpense,
                              purpose: e.target.value
                            })}
                            style={{
                              width: '100%',
                              padding: '12px',
                              border: '2px solid #ddd',
                              borderRadius: '6px',
                              fontSize: '1rem',
                              backgroundColor: 'white',
                              color: '#000',
                              transition: 'border-color 0.3s ease'
                            }}
                          >
                            <option value="labour">Labour</option>
                            <option value="material">Material</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ marginTop: '20px' }}>
                        <label style={{
                          display: 'block',
                          marginBottom: '8px',
                          fontSize: '0.95rem',
                          color: '#555',
                          fontWeight: '500'
                        }}>
                          Notes (Optional):
                        </label>
                        <textarea
                          value={newExpense.notes || ''}
                          onChange={(e) => setNewExpense({
                            ...newExpense,
                            notes: e.target.value
                          })}
                          placeholder="Enter additional notes or description..."
                          rows="3"
                          style={{
                            width: '100%',
                            padding: '12px',
                            border: '2px solid #ddd',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            color: '#000',
                            resize: 'vertical',
                            backgroundColor: 'white',
                            transition: 'border-color 0.3s ease'
                          }}
                        />
                      </div>
                      <div style={{ 
                        marginTop: '25px',
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: '15px'
                      }}>
                        <button 
                          onClick={() => setShowExpenseForm(false)}
                          style={{
                            padding: '10px 20px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                          }}
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={() => {
                            handleAddExpense();
                            setShowExpenseForm(false);
                          }}
                          disabled={!newExpense.amount || parseFloat(newExpense.amount) <= 0}
                          style={{
                            padding: '10px 25px',
                            backgroundColor: newExpense.amount && parseFloat(newExpense.amount) > 0 ? '#007bff' : '#ccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: newExpense.amount && parseFloat(newExpense.amount) > 0 ? 'pointer' : 'not-allowed',
                            fontSize: '0.9rem',
                            fontWeight: '500',
                            transition: 'background-color 0.3s ease'
                          }}
                        >
                          <i className="fas fa-plus"></i> Add Expense
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Expenses List with improved styling */}
                  <div className="expenses-list" style={{
                    width: '100%',
                    maxWidth: '100%',
                    boxSizing: 'border-box'
                  }}>
                                        {expenses.length > 0 ? (
                      renderExpensesTables()
                    ) : (
                      <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '10px',
                        border: '2px dashed #dee2e6'
                      }}>
                        <i className="fas fa-receipt" style={{ fontSize: '3rem', color: '#6c757d', marginBottom: '1rem' }}></i>
                        <h4 style={{ color: '#6c757d', margin: '0 0 0.5rem 0' }}>No expenses recorded yet</h4>
                        <p style={{ color: '#6c757d', margin: 0 }}>Click "Add Expense" to record your first project expense</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Right Section - Payment History */}
            {payments.length > 0 && (
              <div className="payment-history-section" style={{
                minWidth: '400px',
                maxWidth: '500px'
              }}>
                <h3>Payment History</h3>
                
                                {/* Bank Selection Section */}
                {banks.length > 0 && (
                  <div className="bank-selection-section" style={{
                    backgroundColor: '#f8f9fa',
                    padding: '1rem',
                    borderRadius: '8px',
                    marginBottom: '1.5rem',
                    border: '1px solid #e9ecef'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 1rem 0', 
                      fontSize: '1rem', 
                      color: '#495057',
                      fontWeight: '600'
                    }}>
                      Select Bank Account for Invoices *
                    </h4>
                    <div className="bank-dropdown" style={{ position: 'relative' }}>
                      <select
                        value={selectedBank?._id || ''}
                        onChange={(e) => {
                          const selected = banks.find(bank => bank._id === e.target.value);
                          setSelectedBank(selected || null);
                        }}
                        required
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #dee2e6',
                          borderRadius: '6px',
                          backgroundColor: 'white',
                          fontSize: '0.9rem',
                          color: '#343a40',
                          cursor: 'pointer',
                          transition: 'border-color 0.2s ease',
                          outline: 'none'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1976d2';
                          e.target.style.boxShadow = '0 0 0 3px rgba(25, 118, 210, 0.1)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#dee2e6';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="" disabled style={{ color: '#6c757d' }}>
                          Choose bank account...
                        </option>
                        {banks.map((bank) => (
                          <option 
                            key={bank._id} 
                            value={bank._id}
                            style={{
                              padding: '0.5rem',
                              fontSize: '0.9rem'
                            }}
                          >
                            {bank.accountName} - {bank.bankName}
                          </option>
                        ))}
                      </select>
                      {!selectedBank && (
                        <div style={{
                          fontSize: '0.8rem',
                          color: '#dc3545',
                          marginTop: '0.5rem'
                        }}>
                          Please select a bank account to generate invoices
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="payments-list">
                  {/* Show Balance Card First */}
                  {grandTotals.length > 0 && (
                    <div className="balance-card">
                      <div className="balance-header">
                        <h4>Project Payment Summary</h4>
                      </div>
                      <div className="balance-details">
                        <div className="balance-row">
                          <span>Total Project Amount:</span>
                          <span>₹{parseFloat(grandTotals[0]).toLocaleString()}</span>
                        </div>
                        <div className="balance-row">
                          <span>Total Received:</span>
                          <div className="amount-with-percentage">
                            <span>₹{payments
                              .filter(p => p.status === 'paid')
                              .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                              .toLocaleString()}</span>
                            <span className="percentage">
                              ({((payments
                                .filter(p => p.status === 'paid')
                                .reduce((sum, p) => sum + parseFloat(p.amount), 0) / parseFloat(grandTotals[0])) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                        <div className="balance-row total">
                          <span>Remaining Balance:</span>
                          <div className="amount-with-percentage">
                            <span>₹{(parseFloat(grandTotals[0]) - 
                              payments
                                .filter(p => p.status === 'paid')
                                .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                            ).toLocaleString()}</span>
                            <span className="percentage">
                              ({((parseFloat(grandTotals[0]) - 
                                payments
                                  .filter(p => p.status === 'paid')
                                  .reduce((sum, p) => sum + parseFloat(p.amount), 0)) / parseFloat(grandTotals[0]) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add New Payment Section - Only show if there's remaining balance */}
                  {(parseFloat(grandTotals[0]) - 
                    payments
                      .filter(p => p.status === 'paid')
                      .reduce((sum, p) => sum + parseFloat(p.amount), 0)) > 0 && 
                    !payments.some(p => p.status !== 'paid') && (
                    <div className="new-payment-section">
                      <h4>Create New Payment Phase</h4>
                      <div className="payment-form">
                        <div className="form-group">
                          <label>Amount (Max: ₹{(parseFloat(grandTotals[0]) - 
                            payments
                              .filter(p => p.status === 'paid')
                              .reduce((sum, p) => sum + parseFloat(p.amount), 0)
                          ).toLocaleString()})</label>
                          <input
                            type="number"
                            value={editPaymentData.amount}
                            onChange={(e) => {
                              const value = parseFloat(e.target.value);
                              const maxAmount = parseFloat(grandTotals[0]) - 
                                payments
                                  .filter(p => p.status === 'paid')
                                  .reduce((sum, p) => sum + parseFloat(p.amount), 0);
                              if (value <= maxAmount) {
                                setEditPaymentData({
                                  ...editPaymentData,
                                  amount: e.target.value
                                });
                              }
                            }}
                            min="0"
                            max={parseFloat(grandTotals[0]) - 
                              payments
                                .filter(p => p.status === 'paid')
                                .reduce((sum, p) => sum + parseFloat(p.amount), 0)}
                            step="0.01"
                          />
                        </div>
                        <button 
                          className="create-payment-btn"
                          onClick={async () => {
                            try {
                              const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/client-payments`, {
                                clientId: id,
                                amount: parseFloat(editPaymentData.amount),
                                date: new Date()
                              });

                              if (response.data) {
                                setPayments([...payments, response.data]);
                                setEditPaymentData({ id: '', amount: '' });
                                Swal.fire({
                                  title: 'Success!',
                                  text: 'New payment phase created successfully',
                                  icon: 'success',
                                  confirmButtonText: 'OK'
                                });
                              }
                            } catch (error) {
                              console.error('Error creating payment:', error);
                              Swal.fire({
                                title: 'Error!',
                                text: error.response?.data?.message || 'Failed to create payment',
                                icon: 'error',
                                confirmButtonText: 'OK'
                              });
                            }
                          }}
                          disabled={!editPaymentData.amount || parseFloat(editPaymentData.amount) <= 0}
                        >
                          Create Payment Phase
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Show Paid Payments */}
                  {payments
                    .filter(payment => payment.status === 'paid')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((payment, index) => {
                      const percentage = ((parseFloat(payment.amount) / parseFloat(grandTotals[0])) * 100).toFixed(0);
                      return (
                        <div key={payment._id} className="payment-card paid">
                          <div className="payment-header">
                            <span className="payment-status status-paid">Paid</span>
                            <span className="payment-phase">
                              Phase {index + 1} ({percentage}%)
                            </span>
                          </div>
                          <div className="payment-body">
                            <div className="payment-info">
                              <div className="info-row">
                                <span>Amount Received:</span>
                                <span className="amount-value">₹{parseFloat(payment.amount).toLocaleString()}</span>
                              </div>
                              <div className="info-row">
                                <span>Date:</span>
                                <span>{formatDate(payment.date)}</span>
                              </div>
                              {payment.userId && userNames[payment.userId] && (
                                <div className="info-row">
                                  <span>Marked as Paid by:</span>
                                  <span>{userNames[payment.userId]}</span>
                                </div>
                              )}
                            </div>
                            <div className="payment-actions">
                              <button 
                                className="download-receipt-btn"
                                onClick={() => handleDownloadReceipt(payment)}
                              >
                                <i className="fas fa-file-alt"></i> Download Receipt
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Show Pending Payments */}
                  {payments
                    .filter(payment => payment.status !== 'paid')
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((payment, index) => {
                      const percentage = ((parseFloat(payment.amount) / parseFloat(grandTotals[0])) * 100).toFixed(0);
                      const isEditing = editingPaymentId === payment._id;
                      return (
                        <div key={payment._id} className="payment-card pending">
                          <div className="payment-header">
                            <span className="payment-status status-pending">Pending</span>
                            <span className="payment-phase">
                              Phase {payments.filter(p => p.status === 'paid').length + index + 1} ({percentage}%)
                            </span>
                          </div>
                          <div className="payment-body">
                            <div className="payment-info">
                              <div className="info-row">
                                <span>Amount Due:</span>
                                <div className="amount-with-percentage">
                                  {isEditing ? (
                                    <div className="edit-amount-section">
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <input
                                          type="number"
                                          value={editPaymentData.amount}
                                          onChange={(e) => setEditPaymentData({
                                            ...editPaymentData,
                                            amount: e.target.value
                                          })}
                                          min="0"
                                          step="0.01"
                                          style={{
                                            padding: '8px 12px',
                                            border: '2px solid #ddd',
                                            borderRadius: '4px',
                                            fontSize: '0.9rem',
                                            width: '120px',
                                            color: '#000',
                                            backgroundColor: '#fff'
                                          }}
                                        />
                                        <div style={{ display: 'flex', gap: '4px' }}>
                                          <button 
                                            className="submit-edit-btn"
                                            onClick={handleUpdatePayment}
                                            disabled={!editPaymentData.amount || parseFloat(editPaymentData.amount) <= 0}
                                            style={{
                                              padding: '6px 12px',
                                              backgroundColor: editPaymentData.amount && parseFloat(editPaymentData.amount) > 0 ? '#28a745' : '#ccc',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: editPaymentData.amount && parseFloat(editPaymentData.amount) > 0 ? 'pointer' : 'not-allowed',
                                              fontSize: '0.8rem',
                                              fontWeight: '500'
                                            }}
                                            title="Save changes"
                                          >
                                            Submit
                                          </button>
                                          <button 
                                            className="cancel-edit-btn"
                                            onClick={handleCancelEdit}
                                            style={{
                                              padding: '6px 12px',
                                              backgroundColor: '#dc3545',
                                              color: 'white',
                                              border: 'none',
                                              borderRadius: '4px',
                                              cursor: 'pointer',
                                              fontSize: '0.8rem',
                                              fontWeight: '500'
                                            }}
                                            title="Cancel editing"
                                          >
                                            Cancel
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="amount-value">
                                        ₹{parseFloat(payment.amount).toLocaleString()}
                                      </span>
                                      <button 
                                        className="edit-amount-btn"
                                        onClick={() => handleEditPayment(payment)}
                                        title="Edit Amount"
                                        style={{
                                          padding: '4px 8px',
                                          backgroundColor: '#007bff',
                                          color: 'white',
                                          border: 'none',
                                          borderRadius: '3px',
                                          cursor: 'pointer',
                                          fontSize: '0.7rem',
                                          marginLeft: '8px'
                                        }}
                                      >
                                        Edit
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="info-row">
                                <span>Due Date:</span>
                                <span>{formatDate(payment.date)}</span>
                              </div>
                            </div>
                            <div className="payment-actions">
                              <button 
                                className="download-invoice-btn"
                                onClick={() => handleDownloadInvoice(payment)}
                              >
                                <i className="fas fa-file-invoice"></i> Download Invoice
                              </button>
                              <button 
                                className="mark-paid-btn"
                                onClick={() => handleMarkAsPaid(payment._id)}
                              >
                                Mark as Paid
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {/* Download Report Button */}
                  {payments.length > 0 && payments.every(p => p.status === 'paid') && (
                    <div className="report-button-container">
                      <button 
                        className="download-report-btn"
                        onClick={handleDownloadPaymentReport}
                      >
                        <i className="fas fa-file-pdf"></i> Download Payment Report
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Edit Modal */}
          {showEditModal && (
            <div className="modal-overlay" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999
            }}>
              <div className="modal" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="modal-header">
                  <h2>Edit Client Details</h2>
                  <button className="close-button" onClick={() => setShowEditModal(false)}>&times;</button>
                </div>
                <div className="client-form">
                  <div className="form-group">
                    <label>Client Name:</label>
                    <input
                      type="text"
                      name="clientName"
                      value={editFormData.clientName}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email:</label>
                    <input
                      type="email"
                      name="email"
                      value={editFormData.email}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone Number:</label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={editFormData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Location:</label>
                    <input
                      type="text"
                      name="location"
                      value={editFormData.location}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-actions">
                    <button className="cancel-button" onClick={() => setShowEditModal(false)}>Cancel</button>
                    <button className="submit-button" onClick={handleUpdateClient}>Update</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stage Notes Modal */}
          {showStageModal && (
            <div className="modal-overlay" style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 999
            }}>
              <div className="modal" style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
              }}>
                <div className="modal-header">
                  <h2>Add New Stage</h2>
                  <button className="close-button" onClick={() => setShowStageModal(false)}>&times;</button>
                </div>
                <div className="stage-form">
                  <div className="form-group">
                    <label>Stage Notes:</label>
                    <textarea
                      value={stageNote}
                      onChange={(e) => setStageNote(e.target.value)}
                      placeholder="Enter stage notes..."
                      rows="4"
                      className="stage-notes-textarea"
                    />
                  </div>
                  <div className="form-actions">
                    <button 
                      className="cancel-button" 
                      onClick={() => {
                        setShowStageModal(false);
                        setStageNote("");
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="submit-button"
                      onClick={handleStageSubmit}
                    >
                      Add Stage
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ClientDetails; 