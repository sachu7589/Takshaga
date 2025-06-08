import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";
import { Users, Mail, Phone, MapPin, Briefcase, FileText } from "lucide-react";

function CompletedProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [grandTotals, setGrandTotals] = useState([]);
  const [stages, setStages] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [userNames, setUserNames] = useState({});

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
      try {
        setIsLoading(true);
        const [clientResponse, stagesResponse, paymentsResponse, expensesResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/stages/client/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/client-payments/client/${id}`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/client-expenses/client/${id}`)
        ]);

        if (!clientResponse.data) {
          throw new Error('Client not found');
        }
        
        setClient(clientResponse.data);
        setStages(stagesResponse.data);
        setPayments(paymentsResponse.data);
        setExpenses(expensesResponse.data);

        // Fetch user names for payments and expenses
        for (const payment of paymentsResponse.data) {
          if (payment.status === 'paid' && payment.userId) {
            await fetchUserName(payment.userId);
          }
        }
        for (const expense of expensesResponse.data) {
          if (expense.userId) {
            await fetchUserName(expense.userId);
          }
        }

        // Fetch grand total if available
        if (clientResponse.data.stage > 0) {
          try {
            const grandTotalResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/client/${id}/grandTotal`);
            if (grandTotalResponse.data && grandTotalResponse.data.grandTotal) {
              setGrandTotals([grandTotalResponse.data.grandTotal]);
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
          navigate('/completed-projects');
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

  const generateClientReport = async () => {
    try {
      const doc = new jsPDF();
      
      // Add full page border on all pages
      const addBorder = () => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
      };
      addBorder();

      // Add professional header background
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
      doc.text("PROJECT REPORT", 105, 65, { align: "center" });

      let yPos = 85;

      // Project Overview Section
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Project Overview", 15, yPos);
      
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      const projectInfo = [
        ['Name', client.clientName],
        ['Location', client.location || 'N/A'],
        ['Type of Work', client.typeOfWork || 'N/A'],
        ['Project Status', 'Completed'],
        ['Total Stages', `${stages.length} Stages`],
        ['Project Duration', `${Math.ceil((new Date(stages[stages.length-1].date) - new Date(stages[0].date)) / (1000 * 60 * 60 * 24))} Days`]
      ];

      autoTable(doc, {
        startY: yPos + 5,
        head: [],
        body: projectInfo,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 130 }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Project Cost Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.setFont(undefined, 'bold');
      doc.text("Project Cost Details", 105, yPos + 8, { align: "center" });

      yPos += 20;

      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const costInfo = [
        ['Total Project Value', `INR ${parseFloat(grandTotals[0]).toLocaleString()}`],
        ['Amount Paid', `INR ${totalPaid.toLocaleString()}`],
        ['Balance Amount', `INR ${(parseFloat(grandTotals[0]) - totalPaid).toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: costInfo,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { cellWidth: 90 }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Project Timeline Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Project Timeline", 105, yPos + 8, { align: "center" });

      yPos += 20;

      // Timeline data with more detailed formatting
      const timelineData = stages.map((stage, index) => {
        const date = new Date(stage.date);
        return [
        `Stage ${index + 1}`,
        stage.note,
          date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          })
        ];
      });

      // Check if new page is needed for timeline
      if (yPos + (timelineData.length * 20) > 250) {
        doc.addPage();
        addBorder();
        yPos = 20;
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Stage', 'Milestone Description', 'Date']],
        body: timelineData,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [0, 71, 142],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 120 },
          2: { cellWidth: 40 }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Check if new page is needed for summary
      if (yPos > 220) {
        doc.addPage();
        addBorder();
        yPos = 20;
      }

      // Project Summary Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Project Summary", 105, yPos + 8, { align: "center" });

      yPos += 20;
      doc.setTextColor(0);
      doc.setFontSize(10);

      const summary = [
        `• Project successfully completed with all ${stages.length} planned stages`,
        `• Total project duration: ${Math.ceil((new Date(stages[stages.length-1].date) - new Date(stages[0].date)) / (1000 * 60 * 60 * 24))} days`,
        `• All project milestones achieved as per the timeline`,
        `• Project completed according to approved specifications`,
        `• Thank you for choosing Takshaga for your project`
      ];

      doc.setFont(undefined, 'normal');
      summary.forEach((point, index) => {
        doc.text(point, 15, yPos + (index * 7));
      });

      // Add footer with contact information
      const footerY = doc.internal.pageSize.height - 30;
      doc.setFillColor(240, 240, 240);
      doc.rect(5, footerY, 200, 22, 'F');
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("For any queries, please contact:", 15, footerY + 6);
      doc.text("Email: info@takshaga.com  |  Phone: +91 9846660624, +91 9544344332", 15, footerY + 12);
      doc.text("www.takshaga.com", 15, footerY + 18);

      // Add page number
      doc.setFontSize(8);
      doc.text(`Page ${doc.internal.getNumberOfPages()}`, 105, footerY - 5, { align: 'center' });

      // Save the PDF
      doc.save(`${client.clientName}_Project_Report.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate report',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const generateOfficeReport = async () => {
    try {
      const doc = new jsPDF();
      
      // Add border function for all pages
      const addBorder = () => {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
      };

      // Function to check if content will fit on current page
      const willContentFit = (currentY, contentHeight) => {
        return (currentY + contentHeight) < 270; // 270 is safe margin from bottom
      };

      // Add border to first page
      addBorder();
      
      // Add header
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
      doc.text("DETAILED PROJECT REPORT (INTERNAL)", 105, 65, { align: "center" });

      let yPos = 85;

      // Client Information Section
      doc.setTextColor(0);
      doc.setFontSize(12);
      doc.setFont(undefined, 'bold');
      doc.text("Client Information", 15, yPos);
      
      const clientInfo = [
        ['Name', client.clientName],
        ['Email', client.email],
        ['Phone', client.phoneNumber],
        ['Location', client.location || 'N/A'],
        ['Type of Work', client.typeOfWork || 'N/A'],
        ['Project Status', 'Completed'],
        ['Total Stages', `${stages.length} Stages`],
        ['Project Duration', `${Math.ceil((new Date(stages[stages.length-1].date) - new Date(stages[0].date)) / (1000 * 60 * 60 * 24))} Days`]
      ];
      
      autoTable(doc, {
        startY: yPos + 5,
        head: [],
        body: clientInfo,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 60 },
          1: { cellWidth: 130 }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Calculate totals for financial overview
      const totalPaid = payments
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const totalExpenses = expenses
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      const netProfit = totalPaid - totalExpenses;
      const profitMargin = ((netProfit / totalPaid) * 100).toFixed(2);

      // Check if Financial Overview will fit on current page
      if (!willContentFit(yPos, 150)) {
        doc.addPage();
        addBorder();
        yPos = 20;
      }

      // Financial Overview Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Financial Overview", 105, yPos + 8, { align: "center" });

      yPos += 20;

      const financialOverview = [
        ['Total Project Value', `INR ${parseFloat(grandTotals[0]).toLocaleString()}`],
        ['Total Amount Received', `INR ${totalPaid.toLocaleString()}`],
        ['Total Expenses', `INR ${totalExpenses.toLocaleString()}`],
        ['Net Profit', `INR ${netProfit.toLocaleString()}`],
        ['Profit Margin', `${profitMargin}%`],
        ['Balance to Collect', `INR ${(parseFloat(grandTotals[0]) - totalPaid).toLocaleString()}`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [],
        body: financialOverview,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 100 },
          1: { cellWidth: 90 }
        },
        margin: { left: 15, right: 15 }
      });

      yPos = doc.lastAutoTable.finalY + 20;

      // Calculate expense breakdowns
      const labourExpenses = expenses
        .filter(e => e.purpose === 'labour')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      const materialExpenses = expenses
        .filter(e => e.purpose === 'material')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      const otherExpenses = expenses
        .filter(e => e.purpose === 'other')
        .reduce((sum, e) => sum + parseFloat(e.amount), 0);

      // Check if Expense Breakdown will fit on current page
      if (!willContentFit(yPos, 120)) {
        doc.addPage();
        addBorder();
        yPos = 20;
      }

      // Expense Breakdown Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Expense Breakdown", 105, yPos + 8, { align: "center" });

      yPos += 20;

      const expenseBreakdown = [
        ['Labour Expenses', `INR ${labourExpenses.toLocaleString()}`, `${((labourExpenses/totalExpenses) * 100).toFixed(1)}%`],
        ['Material Expenses', `INR ${materialExpenses.toLocaleString()}`, `${((materialExpenses/totalExpenses) * 100).toFixed(1)}%`],
        ['Other Expenses', `INR ${otherExpenses.toLocaleString()}`, `${((otherExpenses/totalExpenses) * 100).toFixed(1)}%`]
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Amount', 'Percentage']],
        body: expenseBreakdown,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [0, 71, 142],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 }
      });

      // Start new page for Payment History
      doc.addPage();
      addBorder();
      yPos = 20;

      // Payment History Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Payment History", 105, yPos + 8, { align: "center" });

      yPos += 20;

      const paymentHistory = payments.map(payment => [
        new Date(payment.date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        `INR ${parseFloat(payment.amount).toLocaleString()}`,
        payment.status === 'paid' ? 'Paid' : 'Pending',
        payment.userId ? userNames[payment.userId] || 'N/A' : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Amount', 'Status', 'Processed By']],
        body: paymentHistory,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [0, 71, 142],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 }
      });

      // Check if Expense List will fit on current page
      if (!willContentFit(doc.lastAutoTable.finalY + 40, 100)) {
        doc.addPage();
        addBorder();
        yPos = 20;
      } else {
        yPos = doc.lastAutoTable.finalY + 20;
      }

      // Detailed Expense List
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Detailed Expense List", 105, yPos + 8, { align: "center" });

      yPos += 20;

      const expenseList = expenses.map(expense => [
        new Date(expense.date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        }),
        expense.purpose.charAt(0).toUpperCase() + expense.purpose.slice(1),
        `INR ${parseFloat(expense.amount).toLocaleString()}`,
        expense.userId ? userNames[expense.userId] || 'N/A' : 'N/A'
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Date', 'Category', 'Amount', 'Added By']],
        body: expenseList,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        headStyles: {
          fillColor: [0, 71, 142],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        margin: { left: 15, right: 15 }
      });

      // Start new page for Project Analysis
      doc.addPage();
      addBorder();
      yPos = 20;

      // Project Analysis Section
      doc.setFillColor(0, 51, 102);
      doc.rect(5, yPos, 200, 12, 'F');
      doc.setTextColor(255, 255, 255);
      doc.text("Project Analysis & Summary", 105, yPos + 8, { align: "center" });

      yPos += 20;
      doc.setTextColor(0);
      doc.setFontSize(10);

      const analysis = [
        `• Project Duration Analysis:`,
        `  - Total Duration: ${Math.ceil((new Date(stages[stages.length-1].date) - new Date(stages[0].date)) / (1000 * 60 * 60 * 24))} days`,
        `  - Number of Stages Completed: ${stages.length}`,
        ``,
        `• Financial Analysis:`,
        `  - Project Value: INR ${parseFloat(grandTotals[0]).toLocaleString()}`,
        `  - Collection Efficiency: ${((totalPaid / parseFloat(grandTotals[0])) * 100).toFixed(1)}%`,
        `  - Profit Margin: ${profitMargin}%`,
        ``,
        `• Expense Analysis:`,
        `  - Highest Expense Category: ${
          [
            { type: 'Labour', amount: labourExpenses },
            { type: 'Material', amount: materialExpenses },
            { type: 'Other', amount: otherExpenses }
          ].sort((a, b) => b.amount - a.amount)[0].type
        }`,
        `  - Labour Cost Ratio: ${((labourExpenses/totalExpenses) * 100).toFixed(1)}%`,
        `  - Material Cost Ratio: ${((materialExpenses/totalExpenses) * 100).toFixed(1)}%`,
        ``,
        `• Key Metrics:`,
        `  - Cost to Revenue Ratio: ${((totalExpenses/totalPaid) * 100).toFixed(1)}%`,
        `  - Average Payment Size: INR ${(totalPaid / payments.filter(p => p.status === 'paid').length).toLocaleString()}`,
        `  - Average Expense Size: INR ${(totalExpenses / expenses.length).toLocaleString()}`
      ];

      doc.setFont(undefined, 'normal');
      analysis.forEach((point, index) => {
        doc.text(point, 15, yPos + (index * 7));
      });

      // Add footer only to the last page
      const footerY = doc.internal.pageSize.height - 30;
      doc.setFillColor(240, 240, 240);
      doc.rect(5, footerY, 200, 22, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("INTERNAL DOCUMENT - CONFIDENTIAL", 15, footerY + 6);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 15, footerY + 12);
      doc.text(`Page ${doc.internal.getNumberOfPages()} of ${doc.internal.getNumberOfPages()}`, 15, footerY + 18);

      // Save the PDF
      doc.save(`${client.clientName}_Internal_Report.pdf`);
    } catch (error) {
      console.error('Error generating report:', error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate report',
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

  if (!client) {
    return (
      <div className="error-container">
        <h2>Error loading client details</h2>
        <button onClick={() => navigate('/completed-projects')} className="back-button">
          Back to Completed Projects
        </button>
      </div>
    );
  }

  const totalPaid = payments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const totalExpenses = expenses
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const netProfit = totalPaid - totalExpenses;
  const profitMargin = ((netProfit / totalPaid) * 100).toFixed(2);

  return (
    <div className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}>
        <div className="client-details-container">
          {/* Header Section */}
          <div className="client-info-header" style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
                <div className="client-info-main">
                  <div className="client-name-section">
                    <h2>{client.clientName}</h2>
                    <div className="client-badges">
                      <span className="client-status completed">Completed</span>
                    </div>
                  </div>
                  <div className="client-quick-info">
                    <div className="info-item">
                      <Mail size={16} />
                      <span>{client.email}</span>
                    </div>
                    <div className="info-item">
                      <Phone size={16} />
                      <span>{client.phoneNumber}</span>
                    </div>
                    <div className="info-item">
                      <MapPin size={16} />
                      <span>{client.location || 'No location specified'}</span>
                    </div>
                    <div className="info-item">
                      <Briefcase size={16} />
                      <span>{client.typeOfWork || 'Not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Report Generation Buttons */}
              <div className="report-buttons-container" style={{
                display: 'flex',
                gap: '20px',
              marginTop: '20px'
              }}>
                <button
                  onClick={generateClientReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <FileText size={20} />
                  Generate Client Report
                </button>
                <button
                  onClick={generateOfficeReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    transition: 'background-color 0.3s'
                  }}
                >
                  <FileText size={20} />
                  Generate Office Report
                </button>
            </div>
              </div>

          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px'
          }}>
            {/* Left Column */}
            <div>
              {/* Project Overview */}
              <div className="project-overview-section" style={{
                backgroundColor: 'white',
                padding: '25px',
                borderRadius: '12px',
                marginBottom: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  color: '#1a237e',
                  marginBottom: '25px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #e8eaf6'
                }}>Project Overview</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '25px',
                  marginTop: '20px'
                }}>
                  <div className="overview-card" style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e3e8ef'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Total Project Value</h4>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#2196F3',
                      marginBottom: '0',
                      lineHeight: '1.2'
                    }}>
                      ₹{parseFloat(grandTotals[0] || 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="overview-card" style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e3e8ef'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Total Expenses</h4>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#f44336',
                      marginBottom: '0',
                      lineHeight: '1.2'
                    }}>
                      ₹{totalExpenses.toLocaleString()}
                    </p>
                  </div>
                  <div className="overview-card" style={{
                    backgroundColor: '#f8f9fa',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #e3e8ef'
                  }}>
                    <h4 style={{
                      fontSize: '14px',
                      color: '#64748b',
                      marginBottom: '12px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>Net Profit</h4>
                    <p style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#4CAF50',
                      marginBottom: '0',
                      lineHeight: '1.2'
                    }}>
                      ₹{netProfit.toLocaleString()}
                    </p>
                    <span style={{
                      color: '#64748b',
                      fontSize: '14px',
                      display: 'block',
                      marginTop: '8px'
                    }}>
                      Margin: {profitMargin}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment History */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3>Payment History</h3>
                <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#2196F3', color: 'white' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Status</th>
                        <th style={{ padding: '12px' }}>Processed By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment._id} style={{
                          borderBottom: '1px solid #eee'
                        }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(payment.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{parseFloat(payment.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: payment.status === 'paid' ? '#e8f5e9' : '#ffebee',
                              color: payment.status === 'paid' ? '#2e7d32' : '#c62828'
                            }}>
                              {payment.status === 'paid' ? 'Paid' : 'Pending'}
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            {payment.userId ? userNames[payment.userId] : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Breakdown */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '20px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3>Expense Breakdown</h3>
                <div style={{ overflowX: 'auto', marginTop: '15px' }}>
                  <table style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden'
                  }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f44336', color: 'white' }}>
                        <th style={{ padding: '12px' }}>Date</th>
                        <th style={{ padding: '12px' }}>Purpose</th>
                        <th style={{ padding: '12px' }}>Amount</th>
                        <th style={{ padding: '12px' }}>Added By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map((expense) => (
                        <tr key={expense._id} style={{
                          borderBottom: '1px solid #eee'
                        }}>
                          <td style={{ padding: '12px' }}>
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {expense.purpose.charAt(0).toUpperCase() + expense.purpose.slice(1)}
                          </td>
                          <td style={{ padding: '12px' }}>
                            ₹{parseFloat(expense.amount).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px' }}>
                            {expense.userId ? userNames[expense.userId] : 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Expense Categories Summary */}
              <div style={{ 
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3>Expense Categories</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '15px',
                  marginTop: '15px'
                }}>
                  {/* Labour Expenses */}
                  <div style={{
                    backgroundColor: '#fff3e0',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#e65100', marginBottom: '10px' }}>Labour</h4>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      ₹{expenses
                        .filter(e => e.purpose === 'labour')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                        .toLocaleString()}
                    </p>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {((expenses
                        .filter(e => e.purpose === 'labour')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0) / totalExpenses) * 100).toFixed(1)}% of total
                    </span>
                  </div>

                  {/* Material Expenses */}
                  <div style={{
                    backgroundColor: '#e3f2fd',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#1565c0', marginBottom: '10px' }}>Material</h4>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      ₹{expenses
                        .filter(e => e.purpose === 'material')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                        .toLocaleString()}
                    </p>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {((expenses
                        .filter(e => e.purpose === 'material')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0) / totalExpenses) * 100).toFixed(1)}% of total
                    </span>
                  </div>

                  {/* Other Expenses */}
                  <div style={{
                    backgroundColor: '#f3e5f5',
                    padding: '15px',
                    borderRadius: '8px'
                  }}>
                    <h4 style={{ color: '#7b1fa2', marginBottom: '10px' }}>Other</h4>
                    <p style={{ fontSize: '18px', fontWeight: 'bold' }}>
                      ₹{expenses
                        .filter(e => e.purpose === 'other')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0)
                        .toLocaleString()}
                    </p>
                    <span style={{ fontSize: '14px', color: '#666' }}>
                      {((expenses
                        .filter(e => e.purpose === 'other')
                        .reduce((sum, e) => sum + parseFloat(e.amount), 0) / totalExpenses) * 100).toFixed(1)}% of total
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Project Timeline */}
              <div style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                position: 'sticky',
                top: '20px'
              }}>
                <h3>Project Timeline</h3>
                {/* Add total duration at the top */}
                <div style={{
                  backgroundColor: '#e3f2fd',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px',
                  marginTop: '10px'
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: '14px',
                    color: '#1565c0'
                  }}>
                    <strong>Total Project Duration: </strong>
                    {Math.ceil((new Date(stages[stages.length-1].date) - new Date(stages[0].date)) / (1000 * 60 * 60 * 24))} days
                  </p>
                </div>
                <div style={{ marginTop: '20px' }}>
                  {stages.map((stage, index) => {
                    // Calculate days since previous stage
                    const daysSincePrevious = index > 0
                      ? Math.ceil((new Date(stage.date) - new Date(stages[index - 1].date)) / (1000 * 60 * 60 * 24))
                      : 0;

                    return (
                      <div key={stage._id} style={{
                        display: 'flex',
                        marginBottom: '20px',
                        position: 'relative'
                      }}>
                        <div style={{
                          width: '30px',
                          height: '30px',
                          backgroundColor: '#2196F3',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          marginRight: '15px',
                          position: 'relative',
                          zIndex: 1
                        }}>
                          {index + 1}
                        </div>
                        <div style={{
                          content: '""',
                          position: 'absolute',
                          left: '14px',
                          top: '30px',
                          width: '2px',
                          height: 'calc(100% + 10px)',
                          backgroundColor: index === stages.length - 1 ? 'transparent' : '#e0e0e0'
                        }} />
                        <div style={{
                          flex: 1,
                          backgroundColor: '#f8f9fa',
                          padding: '15px',
                          borderRadius: '8px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <h4 style={{ margin: 0 }}>Stage {index + 1}</h4>
                            {index > 0 && (
                              <span style={{
                                fontSize: '12px',
                                color: '#666',
                                backgroundColor: '#e3f2fd',
                                padding: '4px 8px',
                                borderRadius: '4px'
                              }}>
                                +{daysSincePrevious} days from previous stage
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '8px 0' }}>{stage.note}</p>
                          <span style={{ color: '#666', fontSize: '14px' }}>
                            {new Date(stage.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* View Estimate Button */}
                <div style={{ marginTop: '20px' }}>
                  <button
                    onClick={() => handleViewEstimate(client._id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '12px 24px',
                      backgroundColor: '#6B7280',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <FileText size={20} />
                    View Estimate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CompletedProjectDetails; 