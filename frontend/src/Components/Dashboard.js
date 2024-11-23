import React, { useState, useEffect } from 'react';
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
  const [sessions, setSessions] = useState([]);
  const [collaborations, setCollaborations] = useState([]);
  const [quickLinks, setQuickLinks] = useState([]);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', url: '' });
  const [hoveredLinkIndex, setHoveredLinkIndex] = useState(null);

  useEffect(() => {
    if (user) {
      socket.emit('join', { userId: user.uid });
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

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
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

  const handleCardClick = (sessionId) => {
    navigate(`/session/${sessionId}`);
  };

  const handleDeleteSession = (sessionsId) => {
    const updatedSessions = sessions.filter(sessions => sessions.id !== sessionsId);
    setSessions(updatedSessions);
    localStorage.setItem('savedSession', JSON.stringify(updatedSessions));
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
    }
  };

  const handleCreateSession = () => {
    const newSession = {
      id: Date.now().toString(),
      title: 'New Session',
      language: 'en',
      lastEdited: new Date().toISOString(),
    };
  
    const savedSessions = JSON.parse(localStorage.getItem('savedSession')) || [];
    const updatedSessions = [...savedSessions, newSession];
    
    setSessions(updatedSessions);
    localStorage.setItem('savedSession', JSON.stringify(updatedSessions));
    navigate(`/session/${newSession.id}`);
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
              <li onClick={() => navigate('/projects')}>Sessions</li>
              <li onClick={() => navigate('/teams')}>Users</li>
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
          <div className="content-card sessions-card">
            <div className="section-header">
              <h2 className="section-title">Sessions</h2>
              <button className="add-button" onClick={handleCreateSession}>+</button>
            </div>
            <div className="divider"></div>
            <div className="sessions-content">
              {sessions.length === 0 ? (
                <div className="empty-message">No sessions yet</div>
              ) : (
                <div className="sessions-list">
                  {sessions.map(session => (
                    <div key={session.id} className="session-item">
                      {session.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        {/* Statistics Section */}
        <div className="content-card statistics-card">
            <div className="section-header">
              <h2 className="section-title">Statistics</h2>
            </div>
            <div className="divider2"></div>
            <div className="statistics-content">Analysis of words</div>
          </div>
        </div>

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
                        <X size={16} />
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