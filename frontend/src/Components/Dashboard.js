import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client'; 
import { X } from 'lucide-react';
import axios from 'axios';
import '../globals/dashboard.css';

const socket = io(process.env.REACT_APP_SOCKET_URL, {
  withCredentials: true,
  extraHeaders: {
    "my-custom-header": "abcd"
  }
});

const Dashboard = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [dashboardSessions, setDashboardSessions] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      socket.emit('join', { userId: user.uid });
      fetchDashboardSessions();
    }

    socket.on('user-update', (updatedUser) => {
      if (updatedUser.uid === user.uid) {
        setUser(prevUser => ({
          ...prevUser,
          displayName: updatedUser.displayName,
          photoURL: updatedUser.photoURL,
        }));
      }
    });

    return () => {
      socket.off('user-update');
    };
  }, [user, setUser]);

  const fetchDashboardSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:5000/api/get-sessions');
      setDashboardSessions(response.data.reverse());
    } catch (error) {
      console.error('Error fetching dashboard sessions:', error);
      setDashboardSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleDashboardSessionClick = async (dashboardSession) => {
    try {
      const response = await axios.get(`/api/get-session/${encodeURIComponent(dashboardSession.title)}`);
      if (response.data) {
        navigate(`/dashboard-session/${dashboardSession.title}`, { 
          state: { dashboardSessionData: response.data }
        });
      }
    } catch (error) {
      console.error('Error navigating to dashboard session:', error);
    }
  };

  const handleSaveLink = () => {
    if (newLink.name && newLink.url) {
      setQuickLinks([...quickLinks, newLink]);
      setNewLink({ name: '', url: '' });
      setIsAddLinkOpen(false);
    }
  };

  const handleDeleteLink = (indexToDelete) => {
    const updatedLinks = quickLinks.filter((_, index) => index !== indexToDelete);
    setQuickLinks(updatedLinks);
  };

  const fetchCollaborations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-collaborations`);
      setCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCollaborations();
    }
  }, [user]);

  const handleDeleteDashboardSession = (dashboardSessionId) => {
    const updatedDashboardSessions = dashboardSessions.filter(dashboardSession => dashboardSession.id !== dashboardSessionId);
    setDashboardSessions(updatedDashboardSessions);
    localStorage.setItem('savedDashboardSession', JSON.stringify(updatedDashboardSessions));
  };

  const handleCreateDashboardSession = () => {
    const newDashboardSession = {
      id: Date.now().toString(),
      title: `Dashboard Session ${dashboardSessions.length + 1}`,
      language: 'en',
      lastEdited: new Date().toISOString(),
    };
  
    const updatedDashboardSessions = [...dashboardSessions, newDashboardSession];
    setDashboardSessions(updatedDashboardSessions);
    localStorage.setItem('savedDashboardSession', JSON.stringify(updatedDashboardSessions));
    navigate(`/dashboard-session/${newDashboardSession.id}`);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="user-greeting">
            <div className="greeting-top">
              <img
                src={user?.photoURL}
                alt="Profile"
              />
              <span className="hi-text">Hi,</span>
            </div>
            <span className="username">{user?.displayName?.split(' ').slice(0, 2).join(' ')}</span>
          </div>
          
          <nav className="menu">
            <ul>
              <li onClick={() => navigate('/dashboard')}>Dashboard</li>
              <li onClick={() => navigate('/sessions')}>Sessions</li>
              <li onClick={() => navigate('/settings')}>Settings</li>
            </ul>
          </nav>
        </div>
        <div className="logout-container">
          <button className="logout-button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="main-content">
        <div className="header">
          <h1>InsightSync</h1>
        </div>

        <div className="upper-grid">
          <div className="content-card dashboard-sessions-card">
            <div className="section-header">
              <h2 className="section-title">Sessions</h2>
              <button className="add-button" onClick={handleCreateDashboardSession}>+</button>
            </div>
            <div className="divider"></div>
             <div className="dashboard-sessions-content">
              {isLoading ? (
                <div className="loading-message">Loading sessions...</div>
              ) : dashboardSessions.length === 0 ? (
                <div className="empty-message">No sessions yet</div>
              ) : (
                <ul className="dashboard-sessions-list">
                  {dashboardSessions.map(dashboardSession => (
                    <li 
                      key={dashboardSession.session_id} 
                      className="dashboard-session-item" 
                      onClick={() => handleDashboardSessionClick(dashboardSession)}
                    >
                      <div className="dashboard-session-info">
                        <h3 className="dashboard-session-title">{dashboardSession.title}</h3>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
             </div>
          </div>

          {/* Statistics card */}
          <div className="content-card statistics-card">
            <div className="section-header">
              <h2 className="section-title">Statistics</h2>
            </div>
            <div className="divider2"></div>
            <div className="statistics-content">Analysis of words</div>
          </div>
        </div>

        {/* Quick Links card */}
        <div className="content-card quick-links-card">
          <div className="section-header">
            <h2 className="section-title">Quick Links</h2>
            <button className="add-button" onClick={() => setIsAddLinkOpen(true)}>+</button>
          </div>
          <div className="divider2"></div>
          <div className="quick-links-content">
            {quickLinks.length === 0 ? (
              <div className="empty-message">No links added</div>
            ) : (
              <div className="links-list">
                {quickLinks.map((link, index) => (
                  <div
                    key={index}
                    className="link-item-wrapper"
                    onMouseEnter={() => setHoveredLinkIndex(index)}
                    onMouseLeave={() => setHoveredLinkIndex(null)}
                  >
                    <a
                      href={link.url}
                      className="link-item"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.name}
                    </a>
                    {hoveredLinkIndex === index && (
                      <button
                        className="delete-link-button"
                        onClick={(e) => {
                          e.preventDefault();
                          handleDeleteLink(index);
                        }}
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal */}
        {isAddLinkOpen && (
          <div className="modal-backdrop">
            <div className="modal-container">
              <div className="modal-content">
                <h3 className="modal-title">Add Quick Link</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={newLink.name}
                  onChange={e => setNewLink({ ...newLink, name: e.target.value })}
                  className="modal-input"
                />
                <input
                  type="url"
                  placeholder="URL"
                  value={newLink.url}
                  onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                  className="modal-input"
                />
                <div className="modal-buttons">
                  <button onClick={handleSaveLink} className="modal-button save-button">
                    Save
                  </button>
                  <button
                    onClick={() => setIsAddLinkOpen(false)}
                    className="modal-button cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
