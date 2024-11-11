import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import CreatSession from '../pages/createsession';
import Card from './Card';
import { io } from 'socket.io-client'; 
import axios from 'axios';
import '../globals/styles.css';

const socket = io('http://localhost:5000'); 

const Dashboard = () => {
  const { user,setUser,logout } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [collaborations, setCollaborations] = useState([]);
  const [meetingData, setMeetingData] = useState({
    title: '',
    type: '',
    summary: '',
    actionItems: [],
    decisions: [],
    questions: []
  });

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
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/get-collaborations/${user.uid}`);
      setCollaborations(response.data);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    }
  };

  const handleCardClick = (sessionsId) => {
    navigate(`/session/${sessionsId}`);
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
        {/* Title */}
        <div className="header">
          <h1>InsightSync</h1>
        </div>

        {/* Session section */}
        <div className="sessions-container">
          <div className="sessions-header">
            <h2>Sessions</h2>
            <button 
            className="add-button" 
            onClick={() => setIsCreateModalOpen(true)}
          >
            +
          </button>
          </div>     
          <div className="divider"></div>        
          {sessions.length === 0 ? (
            <div className="empty-state">
              <p>Projects haven't been assigned</p>
            </div>
          ) : (
            <div className="sessions-grid">
              {sessions.map((project) => (
                 <Card
                 key={project.id}
                 id={project.id}
                 language={project.language}
                 title={project.title}
                 timeAgo={getTimeAgo(project.lastEdited)}
                 onClick={() => handleCardClick(project.id)}
                 onDelete={handleDeleteSession}
               />
              ))}
            </div>
          )}
        </div>

        {/* Teams section */}
        <div className="teams-section">
        <div className="teams-header">
          <h2>Users</h2>
        </div>
          <div className="divider2"></div>
          <div className="team-list">
            {collaborations.slice(0, 4).map((collab) => (
              <div key={collab.id} className="team-item">
                <img src={collab.collaborator.photoURL || "https://via.placeholder.com/50"} alt={collab.collaborator.displayName} />
                <span>{collab.collaborator.displayName}</span>
              </div>
            ))}
            {collaborations.length > 4 && (
              <div className="team-item more" onClick={() => navigate('/teams')}>
                <div className="more-circle">
                  <span>More</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;