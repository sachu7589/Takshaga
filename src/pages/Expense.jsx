import { useState } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Client.css";
import "../assets/styles/Income.css";
import { Plus, Download } from "lucide-react";

function Expense() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [expenseData, setExpenseData] = useState({
    purpose: "",
    amount: "",
    expenseType: ""
  });
  
  // Mock data for demonstration
  const [expenses] = useState([
    {
      id: 1,
      addedBy: "John Doe",
      date: "2024-01-15",
      purpose: "Office Rent",
      expenseType: "rent",
      amount: 15000
    },
    {
      id: 2,
      addedBy: "Jane Smith",
      date: "2024-01-14",
      purpose: "Monthly Electricity Bill",
      expenseType: "electricity",
      amount: 2500
    },
    {
      id: 3,
      addedBy: "Mike Johnson",
      date: "2024-01-13",
      purpose: "Internet Connection",
      expenseType: "wifi",
      amount: 1200
    }
  ]);

  const [filters, setFilters] = useState({
    user: "",
    month: "",
    date: ""
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleAddExpense = () => {
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setExpenseData({ purpose: "", amount: "", expenseType: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setExpenseData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically save to database
    console.log("Expense data:", expenseData);
    handleCloseModal();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const downloadPDF = () => {
    // PDF download functionality
    console.log("Downloading PDF...");
  };

  // Calculate totals
  const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const currentMonthExpense = expenses
    .filter(expense => expense.date.startsWith("2024-01"))
    .reduce((sum, expense) => sum + expense.amount, 0);

  return (
    <div
      className={`dashboard-container ${isSidebarOpen ? "sidebar-open" : ""}`}
    >
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div
        className={`dashboard-content ${isSidebarOpen ? "sidebar-open" : ""}`}
      >
        <div className="income-container">
          {/* Header */}
          <div className="income-header">
            <h2>Expense Management</h2>
            <button className="add-income-btn" onClick={handleAddExpense}>
              <Plus size={20} />
              Add Expense
            </button>
          </div>

          {/* Summary Cards */}
          <div className="income-summary">
            <div className="summary-card total-income">
              <h3>Total Expense</h3>
              <p className="amount">₹{totalExpense.toLocaleString()}</p>
            </div>
            <div className="summary-card current-month">
              <h3>Current Month Expense</h3>
              <p className="amount">₹{currentMonthExpense.toLocaleString()}</p>
            </div>
          </div>

          {/* Filters Section */}
          <div className="filters-section">
            <div className="filters-header">
              <h3>Filters</h3>
              <button className="download-pdf-btn" onClick={downloadPDF}>
                <Download size={16} />
                Download PDF
              </button>
            </div>
            <div className="filters-grid">
              <div className="filter-group">
                <label>User</label>
                <select name="user" value={filters.user} onChange={handleFilterChange}>
                  <option value="">All Users</option>
                  <option value="john">John Doe</option>
                  <option value="jane">Jane Smith</option>
                  <option value="mike">Mike Johnson</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Month</label>
                <select name="month" value={filters.month} onChange={handleFilterChange}>
                  <option value="">All Months</option>
                  <option value="01">January</option>
                  <option value="02">February</option>
                  <option value="03">March</option>
                </select>
              </div>
              <div className="filter-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={filters.date}
                  onChange={handleFilterChange}
                />
              </div>
            </div>
          </div>

          {/* Expense Table */}
          <div className="income-table-container">
            <table className="income-table">
              <thead>
                <tr>
                  <th>Added By</th>
                  <th>Date</th>
                  <th>Purpose</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="added-by">{expense.addedBy}</td>
                    <td className="date">{expense.date}</td>
                    <td>{expense.purpose}</td>
                    <td className="expense-type">{expense.expenseType}</td>
                    <td className="amount">₹{expense.amount.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="income-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Add New Expense</h2>
                <button className="close-button" onClick={handleCloseModal}>
                  ×
                </button>
              </div>
              <form className="income-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="expenseType">Expense Type</label>
                  <select
                    id="expenseType"
                    name="expenseType"
                    value={expenseData.expenseType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select expense type</option>
                    <option value="rent">Rent</option>
                    <option value="electricity">Electricity</option>
                    <option value="wifi">WiFi</option>
                    <option value="others">Others</option>
                  </select>
                </div>
                {expenseData.expenseType === "others" && (
                  <div className="form-group">
                    <label htmlFor="purpose">Purpose</label>
                    <textarea
                      id="purpose"
                      name="purpose"
                      value={expenseData.purpose}
                      onChange={handleInputChange}
                      placeholder="Enter expense purpose..."
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="amount">Amount (₹)</label>
                  <input
                    type="number"
                    id="amount"
                    name="amount"
                    value={expenseData.amount}
                    onChange={handleInputChange}
                    placeholder="Enter amount"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="form-actions">
                  <button type="button" className="cancel-button" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-button">
                    Add Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Expense;
