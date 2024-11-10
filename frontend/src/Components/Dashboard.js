import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { io } from 'socket.io-client'; 
import '../globals/styles.css';

const Card = ({ children }) => (
  <div className="border rounded shadow p-4 bg-white">{children}</div>
);

const CardHeader = ({ children }) => (
  <div className="border-b pb-2 mb-2">{children}</div>
);

const CardTitle = ({ children }) => (
  <h2 className="text-lg font-semibold">{children}</h2>
);

const CardContent = ({ children }) => (
  <div className="mt-2">{children}</div>
);

const socket = io('http://localhost:5000'); 

const Dashboard = () => {
  const { user,setUser,logout } = useAuth();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState({
    title: '',
    type: '',
    summary: '',
    actionItems: [],
    decisions: [],
    questions: []
  });

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

        <div className="p-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Meeting Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="text-lg font-medium">Current Meeting</h3>
              <p className="text-sm text-gray-500">{meetingData.title || 'No active meeting'}</p>
              <p className="text-sm text-gray-500">Type: {meetingData.type || 'Unclassified'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meetingData.actionItems.map((item, index) => (
                <li key={index} className="text-sm">
                  • {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Key Decisions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {meetingData.decisions.map((decision, index) => (
                <li key={index} className="text-sm">
                  • {decision}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>        
      </div>
    </div>
  </div> 
);
}


export default Dashboard;