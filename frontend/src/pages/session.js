import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../globals/session.css';

const FileUploadModal = ({ onClose, onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files?.[0]) {
      onFileSelect(files[0]);
      onClose();
    }
  }, [onClose, onFileSelect]);

  return (
    <div className="modal" onClick={onClose}>
      <div className="modal__content" onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <h2 className="modal__title">Upload Meeting Recording</h2>
          <button className="modal__close" onClick={onClose}>×</button>
        </div>
        
        <div 
          className={`upload-zone ${isDragging ? 'upload-zone--active' : ''}`}
          onDragEnter={(e) => {
            handleDrag(e);
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            handleDrag(e);
            setIsDragging(false);
          }}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="upload-zone__content">
            <div className="upload-zone__icon">📁</div>
            <p className="upload-zone__text">Drag and drop your video file here</p>
            <span className="upload-zone__separator">or</span>
            <label className="upload-zone__button">
              Choose File
              <input
                type="file"
                accept="video/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    onFileSelect(e.target.files[0]);
                    onClose();
                  }
                }}
                className="upload-zone__input"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

const Session = () => {
  const [showModal, setShowModal] = useState(true);
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [extractedContent, setExtractedContent] = useState({
    actionItems: '',
    keyDecisions: '',
    questions: '',
    meetingType: ''
  });
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [result, setResult] = useState('');
  const [loadingField, setLoadingField] = useState(false);

  useEffect(() => {
    const savedSessions = JSON.parse(localStorage.getItem('savedSession')) || [];
    const foundSession = savedSessions.find(s => s.id === sessionId);
    if (foundSession) {
      setSession(foundSession);
    } else {
      setError('Session not found');
    }
  }, [sessionId]);

  const handleSaveSession = useCallback(() => {
    if (!session) return;
    
    const savedSessions = JSON.parse(localStorage.getItem('savedSession')) || [];
    const updatedSessions = savedSessions.map(s => 
      s.id === session.id ? { ...s, ...extractedContent } : s
    );
    localStorage.setItem('savedSession', JSON.stringify(updatedSessions));
    navigate('/dashboard');
  }, [session, extractedContent, navigate]);

  const handleFileSelect = useCallback(async (file) => {
    if (!file) return;
  
    const formData = new FormData();
    formData.append('video', file);
  
    try {
      setLoading(true);
      setError(null);
  
      // Get the current user's token
      const token = await user.getIdToken();
  
      const response = await fetch('http://localhost:5000/api/transcribe-video', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      
      const data = await response.json();
  
      if (response.ok) {
        setTranscription(data.transcription);
      } else {
        setError(data.error || 'Transcription failed.');
      }
    } catch (error) {
      setError('An error occurred during the upload process.');
      console.error('Error uploading video:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const extractContent = async (field) => {
    if (!transcription) {
      setError('Please upload and transcribe a video first.');
      return;
    }

    try {
      setLoadingField(true);
      setError(null);

      // Call the backend or LLM API with transcription and requested field
      const response = await fetch('http://localhost:5000/api/extract-field', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcription,
          field, // e.g., "Action Items", "Key Decisions"
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setResult(data.result);
      } else {
        setError('Failed to extract the field.');
        console.error('Extraction failed:', data.error);
      }
    } catch (error) {
      setError('An error occurred during field extraction.');
      console.error('Error extracting field:', error);
    } finally {
      setLoadingField(false);
    }
  };

  if (!session) {
    return <div className="session__loading">Loading session details...</div>;
  }

  return (
    <div className="session">
      <header className="session__header">
        <h1 className="session__title">{session.title}</h1>
        <button 
          onClick={handleSaveSession}
          className="button button--primary"
          disabled={!Object.values(extractedContent).some(Boolean)}
        >
          Save Session
        </button>
      </header>

      {showModal && (
        <FileUploadModal
          onClose={() => setShowModal(false)}
          onFileSelect={handleFileSelect}
        />
      )}

      <div className="content-card">
        <div className="content-card__header">
          <h2 className="content-card__title">Meeting Content</h2>
          <button 
            onClick={() => setShowModal(true)} 
            className="button button--primary"
          >
            Upload Recording
          </button>
        </div>
        
        <div className="content-card__body">
          {loading && (
            <div className="status status--loading">
              <div className="status__spinner" />
              <span>Processing video...</span>
            </div>
          )}
          
          {error && (
            <div className="status status--error">
              {error}
            </div>
          )}

          {transcription && (
            <div className="analysis">
              <div className="analysis__section">
                <h3 className="analysis__title">Transcription</h3>
                <p className="analysis__content">{transcription}</p>
              </div>

              <div className="analysis__actions">
                <button 
                  onClick={() => extractContent('Action Items')} 
                  className="button button--secondary"
                  disabled={loadingField}
                >
                  Action Items
                </button>
                <button 
                  onClick={() => extractContent('Key Decisions')} 
                  className="button button--secondary"
                  disabled={loadingField}
                >
                  Key Decisions
                </button>
                <button 
                  onClick={() => extractContent('Questions')} 
                  className="button button--secondary"
                  disabled={loadingField}
                >
                  Questions
                </button>
                <button
                  onClick={() => extractContent('Meeting Type')} 
                  className="button button--secondary"
                  disabled={loadingField}
                >
                  Meeting Type
                </button>
              </div>

              {loadingField && (
                <div className="status status--loading">
                  <div className="status__spinner" />
                  <span>Extracting content...</span>
                </div>
              )}

              {result && (
                <div className="analysis__result">
                  <h3 className="analysis__subtitle">Extracted Content:</h3>
                  <p className="analysis__text">{result}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Session;