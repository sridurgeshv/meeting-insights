import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../globals/styles.css';


const Session = () => {
  const [transcription, setTranscription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [actionItems, setActionItems] = useState('');
  const [keyDecisions, setKeyDecisions] = useState('');
  const [questions, setQuestions] = useState('');
  const [type, setType] = useState('');
  const { user } = useAuth();
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Fetch the session data from localStorage or an API
    const savedSessions = JSON.parse(localStorage.getItem('savedSession')) || [];
    const foundSession = savedSessions.find(s => s.id === sessionId);
    setSession(foundSession);
  }, [sessionId]);

  const handleSaveSession = () => {
    // Save the session data to localStorage or an API
    const savedSessions = JSON.parse(localStorage.getItem('savedSession')) || [];
    const updatedSessions = savedSessions.map(s => (s.id === session.id ? session : s));
    localStorage.setItem('savedSession', JSON.stringify(updatedSessions));
    navigate('/dashboard');
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const handleVideoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('video', file);

    try {
      setLoading(true);
      setError(null);

      // Send the video to the backend for transcription
      const response = await fetch('http://localhost:5000/api/transcribe-video', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setTranscription(data.transcription);
      } else {
        setError('Transcription failed.');
        console.error('Transcription failed:', data.error);
      }
    } catch (error) {
      setError('An error occurred during the upload process.');
      console.error('Error uploading video:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractContent = (type) => {
    // Assuming the backend provides structured information in markdown
    if (type === 'Action Items') {
      const actionItemsRegex = /Action Items:([\s\S]+?)(Key Decisions|Questions|$)/;
      const match = transcription.match(actionItemsRegex);
      setActionItems(match ? match[1].trim() : 'No action items found.');
    } else if (type === 'Key Decisions') {
      const keyDecisionsRegex = /Key Decisions:([\s\S]+?)(Questions|$)/;
      const match = transcription.match(keyDecisionsRegex);
      setKeyDecisions(match ? match[1].trim() : 'No key decisions found.');
    } else if (type === 'Questions') {
      const questionsRegex = /Questions:([\s\S]+?)(Type|$)/;
      const match = transcription.match(questionsRegex);
      setQuestions(match ? match[1].trim() : 'No questions found.');
    } else if (type === 'Type') {
      const typeRegex = /Type of Meeting:([\s\S]+?)(Action Items|Key Decisions|Questions|$)/;
      const match = transcription.match(typeRegex);
      setType(match ? match[1].trim() : 'No type found.');
    }
  };

  return (
    <div className="container">
      <h1 className="text-2xl font-bold mb-4">{session.title}</h1>

      <div className="card p-4">
        <h2 className="text-lg font-semibold">Upload Video for Transcription</h2>
        <input type="file" accept="video/*" onChange={handleVideoUpload} className="mt-2" />
        {loading && <p>Transcribing, please wait...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {transcription && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Transcription:</h3>
            <p className="text-sm text-gray-500">{transcription}</p>
            <div className="mt-4 space-x-2">
              <button onClick={() => extractContent('Action Items')} className="bg-blue-500 text-white px-4 py-2 rounded">Action Items</button>
              <button onClick={() => extractContent('Key Decisions')} className="bg-blue-500 text-white px-4 py-2 rounded">Key Decisions</button>
              <button onClick={() => extractContent('Questions')} className="bg-blue-500 text-white px-4 py-2 rounded">Questions</button>
              <button onClick={() => extractContent('Type')} className="bg-blue-500 text-white px-4 py-2 rounded">Type</button>
            </div>
          </div>
        )}

        {actionItems && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Action Items:</h3>
            <p className="text-sm text-gray-500">{actionItems}</p>
          </div>
        )}

        {keyDecisions && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Key Decisions:</h3>
            <p className="text-sm text-gray-500">{keyDecisions}</p>
          </div>
        )}

        {questions && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Questions:</h3>
            <p className="text-sm text-gray-500">{questions}</p>
          </div>
        )}

        {type && (
          <div className="mt-4">
            <h3 className="text-lg font-medium">Type of Meeting:</h3>
            <p className="text-sm text-gray-500">{type}</p>
          </div>
        )}
      <div className="mt-4">
          <button onClick={handleSaveSession} className="bg-blue-500 text-white px-4 py-2 rounded">
            Save Session
          </button>
      </div>
    </div>
  </div>
 );
};

export default Session;