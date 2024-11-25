import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../globals/s1.css';

const SessionList = () => {
  const navigate = useNavigate();
  const [sessionsData, setSessionsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch all session data
    const fetchSessionsData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/get-sessions`);
        setSessionsData(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching sessions:', err);
        setError('Failed to fetch session details. Please try again.');
        setLoading(false);
      }
    };

    fetchSessionsData();
  }, []);

  if (loading) return <div className="loading">Loading session details...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="session-container">
      <button onClick={() => navigate(-1)} className="back-button">Back</button>

      <h1 className="session-title">All Sessions</h1>

      {sessionsData.length > 0 ? (
        <div className="sessions-list">
          {sessionsData.map((session, index) => (
            <div key={index} className="session-item">
              <h2>{session.title}</h2>

              <section className="section">
                <h3>Transcription</h3>
                <p>{session.transcription || 'No transcription available'}</p>
              </section>

              <section className="section">
                <h3>QA Data</h3>
                {session.qaData.length > 0 ? (
                  <ul>
                    {session.qaData.map((qa, qaIndex) => (
                      <li key={qaIndex}>
                        <strong>Q:</strong> {qa.question} <strong>A:</strong> {qa.answer}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No QA data available</p>
                )}
              </section>

              <section className="section">
                <h3>Extracted Content</h3>
                {Object.keys(session.extractedContent).length > 0 ? (
                  <ul>
                    {Object.entries(session.extractedContent).map(([type, content], contentIndex) => (
                      <li key={contentIndex}>
                        <strong>{type}:</strong> {content}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No extracted content available</p>
                )}
              </section>

              <section className="section">
                <h3>Highlights</h3>
                <p>{session.highlights || 'No highlights available'}</p>
              </section>
            </div>
          ))}
        </div>
      ) : (
        <p>No sessions available</p>
      )}
    </div>
  );
};

export default SessionList;
