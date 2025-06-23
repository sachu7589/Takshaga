import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Dashboard.css";
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dashboardStats, setDashboardStats] = useState({
        totalClients: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalProfit: 0,
        pendingEstimates: 0,
        recentActivity: []
    });
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        if (!user) {
            navigate('/');
            return;
        }

        const fetchDashboardData = async () => {
            try {
                // Set user data from auth context
                setUserData(user);

                // Fetch dashboard statistics
                const [clientsResponse, estimatesResponse] = await Promise.all([
                    axios.get(`${import.meta.env.VITE_API_URL}/api/clients/display`),
                    axios.get(`${import.meta.env.VITE_API_URL}/api/estimates/display`)
                ]);
                
                const allClients = clientsResponse.data || [];
                const allEstimates = estimatesResponse.data || [];
                
                // Filter clients based on completed field (1 = completed, 0 = not completed)
                const completedClients = allClients.filter(client => client.completed === 1);
                const activeClients = allClients.filter(client => client.completed === 0);
                
                // Calculate statistics
                const totalClients = allClients.length;
                const activeProjects = activeClients.filter(client => client.stage > 0).length;
                const completedProjects = completedClients.length;
                const pendingEstimates = allEstimates.filter(estimate => estimate.status === 1).length;

                // Calculate total profit from completed projects (payments - expenses)
                let totalPayments = 0;
                let totalExpenses = 0;
                
                for (const client of completedClients) {
                    try {
                        // Fetch payments for completed client
                        const paymentsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/client-payments/client/${client._id}`);
                        const payments = paymentsResponse.data || [];
                        const clientPayments = payments
                            .filter(p => p.status === 'paid')
                            .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                        totalPayments += clientPayments;

                        // Fetch expenses for completed client
                        const expensesResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/client-expenses/client/${client._id}`);
                        const expenses = expensesResponse.data || [];
                        const clientExpenses = expenses
                            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
                        totalExpenses += clientExpenses;
                    } catch {
                        console.warn('Error fetching payments/expenses for client:', client._id);
                    }
                }

                const totalProfit = totalPayments - totalExpenses;

                setDashboardStats({
                    totalClients,
                    activeProjects,
                    completedProjects,
                    totalProfit,
                    pendingEstimates,
                    recentActivity: activeClients.slice(0, 5) // Get 5 most recent active clients
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, [navigate, user]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

    const quickActions = [
        {
            title: "Add New Client",
            description: "Register a new client",
            icon: "👥",
            color: "#3b82f6",
            path: "/client"
        },
        {
            title: "Generate Estimate",
            description: "Create project estimate",
            icon: "📋",
            color: "#10b981",
            path: "/estimate"
        },
        {
            title: "Manage Projects",
            description: "View active projects",
            icon: "🏗️",
            color: "#f59e0b",
            path: "/client-manage"
        },
        {
            title: "View Reports",
            description: "Analyze performance",
            icon: "📊",
            color: "#8b5cf6",
            path: "/report"
        }
    ];

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
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
                {/* Welcome Section */}
                <div className="dashboard-welcome">
                    <div className="welcome-content">
                        <h1>Welcome back, {userData?.name || 'User'}!</h1>
                        <p>Here's what's happening with your business today.</p>
                    </div>
                    <div className="welcome-date">
                        <span>{new Date().toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}</span>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="stats-grid">
                    <div className="stat-card profit">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <h3>Total Profit</h3>
                            <p className="stat-value">₹{dashboardStats.totalProfit.toLocaleString()}</p>
                            <span className="stat-label">Payments minus expenses</span>
                        </div>
                    </div>

                    <div className="stat-card clients">
                        <div className="stat-icon">👥</div>
                        <div className="stat-content">
                            <h3>Total Clients</h3>
                            <p className="stat-value">{dashboardStats.totalClients}</p>
                            <span className="stat-label">All time clients</span>
                        </div>
                    </div>

                    <div className="stat-card active">
                        <div className="stat-icon">🏗️</div>
                        <div className="stat-content">
                            <h3>Active Projects</h3>
                            <p className="stat-value">{dashboardStats.activeProjects}</p>
                            <span className="stat-label">Currently in progress</span>
                        </div>
                    </div>

                    <div className="stat-card completed">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <h3>Completed Projects</h3>
                            <p className="stat-value">{dashboardStats.completedProjects}</p>
                            <span className="stat-label">Successfully delivered</span>
                        </div>
                    </div>

                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <h3>Pending Estimates</h3>
                            <p className="stat-value">{dashboardStats.pendingEstimates}</p>
                            <span className="stat-label">Awaiting estimation</span>
                        </div>
                    </div>

                    <div className="stat-card efficiency">
                        <div className="stat-icon">📈</div>
                        <div className="stat-content">
                            <h3>Success Rate</h3>
                            <p className="stat-value">
                                {dashboardStats.totalClients > 0 
                                    ? Math.round((dashboardStats.completedProjects / dashboardStats.totalClients) * 100)
                                    : 0}%
                            </p>
                            <span className="stat-label">Project completion rate</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-section">
                    <h2>Quick Actions</h2>
                    <div className="quick-actions-grid">
                        {quickActions.map((action, index) => (
                            <div 
                                key={index} 
                                className="quick-action-card"
                                onClick={() => navigate(action.path)}
                                style={{ borderLeftColor: action.color }}
                            >
                                <div className="action-icon" style={{ color: action.color }}>
                                    {action.icon}
                                </div>
                                <div className="action-content">
                                    <h4>{action.title}</h4>
                                    <p>{action.description}</p>
                                </div>
                                <div className="action-arrow" style={{ color: action.color }}>→</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="recent-activity-section">
                    <h2>Recent Clients</h2>
                    <div className="activity-list">
                        {dashboardStats.recentActivity.length > 0 ? (
                            dashboardStats.recentActivity.map((client, index) => (
                                <div key={index} className="activity-item">
                                    <div className="activity-avatar">
                                        {client.clientName?.charAt(0) || 'C'}
                                    </div>
                                    <div className="activity-content">
                                        <h4>{client.clientName}</h4>
                                        <p>{client.email}</p>
                                        <span className="activity-meta">
                                            {client.stage === 0 ? 'Estimate Pending' : `Stage ${client.stage}`}
                                        </span>
                                    </div>
                                    <div className="activity-status">
                                        <span className={`status-dot ${client.stage === 0 ? 'pending' : 'active'}`}></span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="no-activity">
                                <p>No recent activity</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
