import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut, updateProfile, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

axios.defaults.withCredentials = true;
axios.defaults.baseURL = API_URL;

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const token = await firebaseUser.getIdToken();
          
          await axios.post(`${API_URL}/api/save-user`, {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          }, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          });
          
          setUser(firebaseUser);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error('Auth state change error:', error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Send user data to backend
      await axios.post(`${process.env.REACT_APP_API_URL}/api/save-user`, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      }, {
        headers: {
          'Authorization': `Bearer ${await user.getIdToken()}`
        }
      });
  
      return user;
    } catch (error) {
      console.error('Google sign in error:', error);
      if (error.code === 'auth/network-request-failed') {
        alert('Network error. Please check your connection and try again.');
      }
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const updateUser = async (updatedData) => {
    if (!auth.currentUser) throw new Error('No authenticated user');
    
    try {
      await updateProfile(auth.currentUser, updatedData);
      
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/update-user`,
        {
          uid: user.uid,
          ...updatedData
        },
        { withCredentials: true }
      );
      
      if (response.data.message === 'User updated successfully') {
        setUser(prev => ({ ...prev, ...updatedData }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    setUser,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;