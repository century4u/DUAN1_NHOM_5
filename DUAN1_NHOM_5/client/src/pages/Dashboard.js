import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, logout } from '../services/authService';
import './Dashboard.css';

const Dashboard = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      setUser(userData);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setIsAuthenticated(false);
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h1>Dashboard</h1>
        <button onClick={handleLogout} className="btn-logout">Logout</button>
      </nav>

      <div className="dashboard-content">
        <h2>Welcome, {user?.name}!</h2>
        <div className="user-info">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>ID:</strong> {user?.id}</p>
        </div>

        <div className="dashboard-section">
          <h3>Features</h3>
          <ul>
            <li>✓ User Authentication</li>
            <li>✓ User Profile</li>
            <li>✓ Dashboard</li>
            <li>✓ Logout Functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
