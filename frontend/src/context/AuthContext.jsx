import React, { createContext, useState, useEffect } from 'react';
import API from '../services/api.js';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Auto-login if token and user exist in local storage
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('aeloria_ledger_token');
      const cachedUser = localStorage.getItem('aeloria_ledger_user');

      if (token && cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
          
          // Verify session is active by requesting latest user profile
          const res = await API.get('/auth/me');
          if (res.data.success) {
            setUser(res.data);
            localStorage.setItem('aeloria_ledger_user', JSON.stringify(res.data));
          }
        } catch (error) {
          console.error('Session validation failed:', error);
          // Token expired or server offline
          localStorage.removeItem('aeloria_ledger_token');
          localStorage.removeItem('aeloria_ledger_user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, []);

  // Register user
  const registerUser = async (name, email, password, companyName) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, companyName });
      if (res.data.success) {
        const { token, ...userData } = res.data;
        localStorage.setItem('aeloria_ledger_token', token);
        localStorage.setItem('aeloria_ledger_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Try again.',
      };
    }
  };

  // Login user
  const loginUser = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token, ...userData } = res.data;
        localStorage.setItem('aeloria_ledger_token', token);
        localStorage.setItem('aeloria_ledger_user', JSON.stringify(userData));
        setUser(userData);
        return { success: true };
      }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Invalid email or password.',
      };
    }
  };

  // Logout user
  const logoutUser = () => {
    localStorage.removeItem('aeloria_ledger_token');
    localStorage.removeItem('aeloria_ledger_user');
    setUser(null);
  };

  // Update company/user state locally upon updating Settings
  const updateLocalState = (updatedData) => {
    if (user) {
      const newUser = { ...user, ...updatedData };
      localStorage.setItem('aeloria_ledger_user', JSON.stringify(newUser));
      setUser(newUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        registerUser,
        loginUser,
        logoutUser,
        updateLocalState,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
