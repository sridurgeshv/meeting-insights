import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../globals/styles.css';

function Welcome() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <h1>InsightSync</h1>
      
      <button className="start-button"
      onClick={() => navigate('/signin')}>Unlock Now</button>

      <div className="mock-browser">
        <div className="browser-header">
          <div className="browser-dots">
            <div className="dot"></div>
            <div className="dot yellow"></div>
            <div className="dot green"></div>
          </div>
        </div>
        <div className="mock-editor">
          <p>Welcome to InsightSync</p>
          <p>Transform your meetings into actionable insights with real-time summaries and intelligent categorization, empowering teams to make informed decisions effortlessly.</p>
        </div>
      </div>
       {/* Footer */}
       <div className="footer">
          <p>&copy; 2024 InsightSync. All rights reserved.</p>
        </div>
    </div>
  );
}

export default Welcome;