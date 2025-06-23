import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import "../assets/styles/Report.css";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Calendar, 
  FileText, 
  BarChart3, 
  PieChart, 
  Download, 
  Filter,
  RefreshCw,
  Eye,
  Printer,
  Share2,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";
import axios from 'axios';

function Report() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState({
    overview: {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalClients: 0,
      activeProjects: 0,
      completedProjects: 0,
      pendingEstimates: 0,
      successRate: 0
    },
    monthlyData: [],
    topClients: [],
    projectStatus: [],
    expenseBreakdown: [],
    recentActivity: []
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch all necessary data
      const [clientsRes, estimatesRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/display`)
      ]);

      const allClients = clientsRes.data || [];
      const allEstimates = estimatesRes.data || [];
      
      // Calculate overview metrics
      const completedClients = allClients.filter(client => client.completed === 1);
      const activeClients = allClients.filter(client => client.completed === 0);
      
      let totalRevenue = 0;
      let totalExpenses = 0;
      
      // Calculate financials from completed projects
      for (const client of completedClients) {
        try {
          const [paymentsRes, expensesRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/client-payments/client/${client._id}`),
            axios.get(`${import.meta.env.VITE_API_URL}/api/client-expenses/client/${client._id}`)
          ]);
          
          const payments = paymentsRes.data || [];
          const expenses = expensesRes.data || [];
          
          const clientRevenue = payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
          
          const clientExpenses = expenses
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          
          totalRevenue += clientRevenue;
          totalExpenses += clientExpenses;
        } catch {
          console.warn('Error fetching financial data for client:', client._id);
        }
      }

      const netProfit = totalRevenue - totalExpenses;
      const successRate = allClients.length > 0 ? (completedClients.length / allClients.length) * 100 : 0;

      // Generate mock monthly data for demonstration
      const monthlyData = generateMonthlyData();
      
      // Generate mock data for other sections
      const topClients = generateTopClients(completedClients);
      const projectStatus = generateProjectStatus(allClients);
      const expenseBreakdown = generateExpenseBreakdown();
      const recentActivity = generateRecentActivity(allClients, allEstimates);

      setReportData({
        overview: {
          totalRevenue,
          totalExpenses,
          netProfit,
          totalClients: allClients.length,
          activeProjects: activeClients.filter(client => client.stage > 0).length,
          completedProjects: completedClients.length,
          pendingEstimates: allEstimates.filter(estimate => estimate.status === 1).length,
          successRate: Math.round(successRate)
        },
        monthlyData,
        topClients,
        projectStatus,
        expenseBreakdown,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMonthlyData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month) => ({
      month,
      revenue: Math.floor(Math.random() * 500000) + 100000,
      expenses: Math.floor(Math.random() * 300000) + 50000,
      profit: Math.floor(Math.random() * 200000) + 50000,
      projects: Math.floor(Math.random() * 10) + 2
    }));
  };

  const generateTopClients = (completedClients) => {
    return completedClients.slice(0, 5).map((client) => ({
      id: client._id,
      name: client.clientName,
      revenue: Math.floor(Math.random() * 200000) + 50000,
      projects: Math.floor(Math.random() * 3) + 1,
      status: ['Completed', 'In Progress', 'On Hold'][Math.floor(Math.random() * 3)],
      avatar: `https://ui-avatars.com/api/?name=${client.clientName}&background=random`
    }));
  };

  const generateProjectStatus = (allClients) => {
    const statuses = [
      { name: 'Completed', count: allClients.filter(c => c.completed === 1).length, color: '#10b981' },
      { name: 'In Progress', count: allClients.filter(c => c.completed === 0 && c.stage > 0).length, color: '#3b82f6' },
      { name: 'Pending', count: allClients.filter(c => c.completed === 0 && c.stage === 0).length, color: '#f59e0b' },
      { name: 'On Hold', count: Math.floor(Math.random() * 5), color: '#ef4444' }
    ];
    return statuses;
  };

  const generateExpenseBreakdown = () => {
    return [
      { category: 'Labour', amount: 450000, percentage: 45, color: '#3b82f6' },
      { category: 'Materials', amount: 350000, percentage: 35, color: '#10b981' },
      { category: 'Equipment', amount: 120000, percentage: 12, color: '#f59e0b' },
      { category: 'Other', amount: 80000, percentage: 8, color: '#ef4444' }
    ];
  };

  const generateRecentActivity = (allClients, allEstimates) => {
    const activities = [];
    
    // Add client activities
    allClients.slice(0, 3).forEach(client => {
      activities.push({
        id: `client-${client._id}`,
        type: 'client',
        title: `New client ${client.clientName} added`,
        description: `Project value: ₹${Math.floor(Math.random() * 500000) + 100000}`,
        time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      });
    });

    // Add estimate activities
    allEstimates.slice(0, 2).forEach(estimate => {
      activities.push({
        id: `estimate-${estimate._id}`,
        type: 'estimate',
        title: `Estimate generated`,
        description: `Status: ${estimate.status === 1 ? 'Pending' : 'Approved'}`,
        time: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: estimate.status === 1 ? 'pending' : 'completed'
      });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} className="text-green-500" />;
      case 'pending': return <Clock size={16} className="text-yellow-500" />;
      case 'failed': return <XCircle size={16} className="text-red-500" />;
      default: return <AlertCircle size={16} className="text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="hamburger" onClick={toggleSidebar}>
          &#9776;
        </button>
        <Sidebar isOpen={isSidebarOpen} />
        <div className={`dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="report-loading-container">
            <div className="report-loading-spinner"></div>
            <p>Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`dashboard-container ${isSidebarOpen ? 'sidebar-open' : ''}`}>
      <button className="hamburger" onClick={toggleSidebar}>
        &#9776;
      </button>
      <Sidebar isOpen={isSidebarOpen} />
      <div className={`dashboard-content ${isSidebarOpen ? 'sidebar-open' : ''}`}>
        
        {/* Report Header */}
        <div className="report-header">
          <div className="report-header-content">
            <div className="report-title-section">
              <h1>Analytics & Reports</h1>
              <p>Comprehensive business insights and performance metrics</p>
            </div>
            <div className="report-actions">
              <div className="report-period-selector">
                <select 
                  value={selectedPeriod} 
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="report-period-select"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                  <option value="1y">Last year</option>
                </select>
              </div>
              <button className="report-refresh-btn" onClick={fetchReportData}>
                <RefreshCw size={16} />
                Refresh
              </button>
              <button className="report-export-btn">
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
        </div>

        <div className="report-content">
          {/* Overview Section */}
          <div className="report-section">
            <div className="report-section-header">
              <h2>Overview</h2>
              <p>Key performance indicators and business metrics</p>
            </div>
            
            <div className="report-overview-grid">
              {/* Key Metrics */}
              <div className="report-metrics-grid">
                <div className="report-metric-card revenue">
                  <div className="report-metric-icon">
                    <DollarSign size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Total Revenue</h3>
                    <p className="report-metric-value">{formatCurrency(reportData.overview.totalRevenue)}</p>
                    <span className="report-metric-change positive">
                      <ArrowUpRight size={14} />
                      +12.5%
                    </span>
                  </div>
                </div>

                <div className="report-metric-card profit">
                  <div className="report-metric-icon">
                    <TrendingUp size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Net Profit</h3>
                    <p className="report-metric-value">{formatCurrency(reportData.overview.netProfit)}</p>
                    <span className="report-metric-change positive">
                      <ArrowUpRight size={14} />
                      +8.3%
                    </span>
                  </div>
                </div>

                <div className="report-metric-card clients">
                  <div className="report-metric-icon">
                    <Users size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Total Clients</h3>
                    <p className="report-metric-value">{reportData.overview.totalClients}</p>
                    <span className="report-metric-change positive">
                      <ArrowUpRight size={14} />
                      +5.2%
                    </span>
                  </div>
                </div>

                <div className="report-metric-card projects">
                  <div className="report-metric-icon">
                    <Target size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Active Projects</h3>
                    <p className="report-metric-value">{reportData.overview.activeProjects}</p>
                    <span className="report-metric-change neutral">
                      <ArrowUpRight size={14} />
                      +2.1%
                    </span>
                  </div>
                </div>

                <div className="report-metric-card completed">
                  <div className="report-metric-icon">
                    <Award size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Completed</h3>
                    <p className="report-metric-value">{reportData.overview.completedProjects}</p>
                    <span className="report-metric-change positive">
                      <ArrowUpRight size={14} />
                      +15.7%
                    </span>
                  </div>
                </div>

                <div className="report-metric-card success">
                  <div className="report-metric-icon">
                    <CheckCircle size={24} />
                  </div>
                  <div className="report-metric-content">
                    <h3>Success Rate</h3>
                    <p className="report-metric-value">{reportData.overview.successRate}%</p>
                    <span className="report-metric-change positive">
                      <ArrowUpRight size={14} />
                      +3.2%
                    </span>
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="report-charts-section">
                <div className="report-chart-card revenue-chart">
                  <div className="report-chart-header">
                    <h3>Revenue Trend</h3>
                    <div className="report-chart-actions">
                      <button className="report-chart-action-btn">
                        <Eye size={16} />
                      </button>
                      <button className="report-chart-action-btn">
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="report-chart-content">
                    <div className="report-chart-placeholder">
                      <BarChart3 size={48} />
                      <p>Revenue trend chart will be displayed here</p>
                    </div>
                  </div>
                </div>

                <div className="report-chart-card project-status">
                  <div className="report-chart-header">
                    <h3>Project Status</h3>
                    <div className="report-chart-actions">
                      <button className="report-chart-action-btn">
                        <PieChart size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="report-chart-content">
                    <div className="report-status-list">
                      {reportData.projectStatus.map((status, index) => (
                        <div key={index} className="report-status-item">
                          <div className="report-status-info">
                            <div 
                              className="report-status-dot" 
                              style={{ backgroundColor: status.color }}
                            ></div>
                            <span className="report-status-name">{status.name}</span>
                          </div>
                          <span className="report-status-count">{status.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity & Top Clients */}
              <div className="report-bottom-section">
                <div className="report-activity-card">
                  <div className="report-card-header">
                    <h3>Recent Activity</h3>
                    <button className="report-view-all-btn">View All</button>
                  </div>
                  <div className="report-activity-list">
                    {reportData.recentActivity.map((activity) => (
                      <div key={activity.id} className="report-activity-item">
                        <div className="report-activity-icon">
                          {getStatusIcon(activity.status)}
                        </div>
                        <div className="report-activity-content">
                          <h4>{activity.title}</h4>
                          <p>{activity.description}</p>
                          <span className="report-activity-time">
                            {new Date(activity.time).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="report-top-clients-card">
                  <div className="report-card-header">
                    <h3>Top Clients</h3>
                    <button className="report-view-all-btn">View All</button>
                  </div>
                  <div className="report-clients-list">
                    {reportData.topClients.map((client, index) => (
                      <div key={client.id} className="report-client-item">
                        <div className="report-client-rank">#{index + 1}</div>
                        <img 
                          src={client.avatar} 
                          alt={client.name} 
                          className="report-client-avatar"
                        />
                        <div className="report-client-info">
                          <h4>{client.name}</h4>
                          <p>{formatCurrency(client.revenue)}</p>
                        </div>
                        <div className="report-client-status">
                          <span className={`report-status-badge ${client.status.toLowerCase().replace(' ', '-')}`}>
                            {client.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Section */}
          <div className="report-section">
            <div className="report-section-header">
              <h2>Financial Analysis</h2>
              <p>Revenue, expenses, and profit analysis</p>
            </div>
            
            <div className="report-tab-content">
              <div className="report-financial-metrics">
                <div className="report-financial-card income">
                  <h3>Total Income</h3>
                  <p className="amount">{formatCurrency(reportData.overview.totalRevenue)}</p>
                  <span className="report-change positive">+12.5% vs last period</span>
                </div>
                <div className="report-financial-card expenses">
                  <h3>Total Expenses</h3>
                  <p className="amount">{formatCurrency(reportData.overview.totalExpenses)}</p>
                  <span className="report-change negative">+8.2% vs last period</span>
                </div>
                <div className="report-financial-card profit">
                  <h3>Net Profit</h3>
                  <p className="amount">{formatCurrency(reportData.overview.netProfit)}</p>
                  <span className="report-change positive">+15.3% vs last period</span>
                </div>
                <div className="report-financial-card margin">
                  <h3>Profit Margin</h3>
                  <p className="amount">
                    {reportData.overview.totalRevenue > 0 
                      ? ((reportData.overview.netProfit / reportData.overview.totalRevenue) * 100).toFixed(1)
                      : 0}%
                  </p>
                  <span className="report-change positive">+2.1% vs last period</span>
                </div>
              </div>

              <div className="report-expense-breakdown">
                <h3>Expense Breakdown</h3>
                <div className="report-expense-chart">
                  {reportData.expenseBreakdown.map((expense, index) => (
                    <div key={index} className="report-expense-item">
                      <div className="report-expense-header">
                        <div 
                          className="report-expense-color" 
                          style={{ backgroundColor: expense.color }}
                        ></div>
                        <span className="report-expense-category">{expense.category}</span>
                        <span className="report-expense-amount">{formatCurrency(expense.amount)}</span>
                      </div>
                      <div className="report-expense-bar">
                        <div 
                          className="report-expense-fill" 
                          style={{ 
                            width: `${expense.percentage}%`,
                            backgroundColor: expense.color
                          }}
                        ></div>
                      </div>
                      <span className="report-expense-percentage">{expense.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Projects Section */}
          <div className="report-section">
            <div className="report-section-header">
              <h2>Project Management</h2>
              <p>Project status and performance metrics</p>
            </div>
            
            <div className="report-tab-content">
              <div className="report-project-stats">
                <div className="report-stat-item">
                  <h4>Total Projects</h4>
                  <p>{reportData.overview.totalClients}</p>
                </div>
                <div className="report-stat-item">
                  <h4>Active</h4>
                  <p>{reportData.overview.activeProjects}</p>
                </div>
                <div className="report-stat-item">
                  <h4>Completed</h4>
                  <p>{reportData.overview.completedProjects}</p>
                </div>
                <div className="report-stat-item">
                  <h4>Success Rate</h4>
                  <p>{reportData.overview.successRate}%</p>
                </div>
              </div>

              <div className="report-project-status-chart">
                <h3>Project Status Distribution</h3>
                <div className="report-status-chart">
                  {reportData.projectStatus.map((status, index) => (
                    <div key={index} className="report-status-segment">
                      <div 
                        className="report-segment-fill"
                        style={{ 
                          backgroundColor: status.color,
                          width: `${(status.count / reportData.overview.totalClients) * 100}%`
                        }}
                      ></div>
                      <span className="report-segment-label">{status.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section */}
          <div className="report-section">
            <div className="report-section-header">
              <h2>Performance Analytics</h2>
              <p>Advanced metrics and growth trends</p>
            </div>
            
            <div className="report-tab-content report-analytics-grid">
              <div className="report-analytics-card">
                <h3>Performance Metrics</h3>
                <div className="report-metrics-list">
                  <div className="report-metric-row">
                    <span>Client Acquisition Rate</span>
                    <span className="metric-value">+15.2%</span>
                  </div>
                  <div className="report-metric-row">
                    <span>Project Completion Time</span>
                    <span className="metric-value">45 days</span>
                  </div>
                  <div className="report-metric-row">
                    <span>Customer Satisfaction</span>
                    <span className="metric-value">4.8/5</span>
                  </div>
                  <div className="report-metric-row">
                    <span>Revenue per Project</span>
                    <span className="metric-value">{formatCurrency(250000)}</span>
                  </div>
                </div>
              </div>

              <div className="report-analytics-card">
                <h3>Growth Trends</h3>
                <div className="report-trend-chart">
                  <div className="report-chart-placeholder">
                    <TrendingUp size={48} />
                    <p>Growth trend chart will be displayed here</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Report;
