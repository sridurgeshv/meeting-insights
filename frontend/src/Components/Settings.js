import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../globals/setting.css';

function Settings() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setPhotoURL(user.photoURL || '');
    }
  }, [user]);

  useEffect(() => {
    let timer;
    if (message === 'Profile updated successfully!') {
      timer = setTimeout(() => {
        navigate('/dashboard');
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [message, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      const success = await updateUser({ displayName, photoURL });
      if (success) {
        setMessage('Profile updated successfully!');
      } else {
        setMessage('Failed to update profile. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user:', error);
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access settings.</div>;
  }

  return (
    <div className="settings-container">
      <h2>User Settings</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="displayName">Display Name:</label>
          <input
            type="text"
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="photoURL">Photo URL:</label>
          <input
            type="url"
            id="photoURL"
            value={photoURL}
            onChange={(e) => setPhotoURL(e.target.value)}
          />
        </div>
        {photoURL && (
          <div className="photo-preview">
            <img src={photoURL} alt="Profile" />
          </div>
        )}
        <div className="Update-button">
        <button className="update-btn" type="submit" disabled={isLoading}>
          {isLoading ? 'Updating...' : 'Update Profile'}
        </button>
        </div>
      </form>
      {message && <p className="message">{message}</p>}
      {message === 'Profile updated successfully!' && (
        <p className="msg-form">Redirecting to dashboard in 5 seconds...</p>
      )}
    </div>
  );
}

export default Settings;