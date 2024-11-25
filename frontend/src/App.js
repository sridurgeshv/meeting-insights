import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Welcome from './Components/Welcomepg';
import SignIn from './Components/Signin';
import Dashboard from './Components/Dashboard';
import Session from './pages/session';
import Settings from './Components/Settings';
import SessionList from './pages/Sessiondetails';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>; 
  }
  
  return user ? children : <Navigate to="/signin" />;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/sessions" element={<SessionList />} />
          <Route 
            path="/dashboard" 
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            } 
          />
          <Route 
            path="/session/:sessionId" 
            element={
              <PrivateRoute>
                <Session />
              </PrivateRoute>
            } 
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
