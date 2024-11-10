import logo from './logo.svg';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

/*
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Welcome from './components/Welcome';
import SignIn from './components/SignIn';
import Dashboard from './components/Dashboard';
import Project from './components/Project';
import Settings from './pages/Settings';
import { useAuth } from './contexts/AuthContext';
import ProjectList from './pages/ProjectPage';
import TeamsPage from './pages/TeamsPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/signin" />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route
            path="/dashboard"
            element={             
                <Dashboard />
            }
          />
          <Route
            path="/project/:id"
            element={
              <PrivateRoute>
                <Project />
              </PrivateRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
*/