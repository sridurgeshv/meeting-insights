import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup, signOut , updateProfile} from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        };
        // Send user data to the backend
        await axios.post(`${process.env.REACT_APP_API_URL}/api/save-user`, userData);
        setUser(userData);
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUser = async (updatedData) => {
    try {
      // Update Firebase auth profile
      await updateProfile(auth.currentUser, updatedData);
      
      // Update backend
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/update-user`, {
        uid: user.uid,
        ...updatedData
      });
      
      if (response.data.message === 'User updated successfully') {
        // Update local state
        setUser(prevUser => ({ ...prevUser, ...updatedData }));
        return true;
      }
    } catch (error) {
      console.error('Error updating user:', error);
      return false;
    }
  };

  const value = {
    user,
    signInWithGoogle,
    setUser,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export default AuthContext;