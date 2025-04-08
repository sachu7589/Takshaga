import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from "../components/Sidebar";
import "../assets/styles/Dashboard.css";
import Swal from 'sweetalert2';

function Dashboard() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) {
            navigate('/');
            return;
        }

        const fetchUserData = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users/${userId}`);
                if (response.data.user) {
                    setUserData(response.data.user);
                } else {
                    throw new Error('User data not found in response');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                navigate('/');
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [navigate]);

    const toggleSidebar = () => {
        setIsSidebarOpen(!isSidebarOpen);
    };

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
                <div className="profile-section">
                    <div className="profile-card">
                        <div className="profile-header">
                            {userData?.image ? (
                                <img 
                                    src={`${import.meta.env.VITE_API_URL}${userData.image}`} 
                                    alt="Profile" 
                                    className="profile-image"
                                />
                            ) : (
                                <div className="profile-avatar">
                                    {userData?.name?.charAt(0) || '👤'}
                                </div>
                            )}
                            <h2>{userData?.name || 'User'}</h2>
                            <span className="user-role">{userData?.role || 'User'}</span>
                        </div>
                        <div className="profile-details">
                            <div className="detail-item">
                                <span className="detail-label">Email</span>
                                <span className="detail-value">{userData?.email}</span>
                            </div>
                            <div className="detail-item">
                                <span className="detail-label">Phone</span>
                                <span className="detail-value">{userData?.phone || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
