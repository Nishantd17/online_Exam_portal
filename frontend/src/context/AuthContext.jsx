import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setUser(response.data.data);
    } catch (err) {
      setUser(null);
      sessionStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  const silentRefresh = async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      const { accessToken } = response.data.data;
      sessionStorage.setItem('accessToken', accessToken);
      await fetchProfile();
    } catch (err) {
      setUser(null);
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      fetchProfile();
    } else {
      // Try silent refresh in case httpOnly cookie is still active
      silentRefresh();
    }

    const handleSessionExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth_session_expired', handleSessionExpired);
    return () => window.removeEventListener('auth_session_expired', handleSessionExpired);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: loggedInUser, accessToken } = response.data.data;
      
      sessionStorage.setItem('accessToken', accessToken);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/signup', userData);
      return response.data;
    } catch (err) {
      throw err.response?.data || err;
    } finally {
      setLoading(false);
    }
  };

  const sendOtp = async (email) => {
    try {
      const response = await api.post('/auth/send-otp', { email });
      return response.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  const verifyOtp = async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      return response.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  const resetPassword = async (token, password) => {
    try {
      const response = await api.post(`/auth/reset-password/${token}`, { password });
      return response.data;
    } catch (err) {
      throw err.response?.data || err;
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      sessionStorage.removeItem('accessToken');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, setUser, fetchProfile, sendOtp, verifyOtp, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
