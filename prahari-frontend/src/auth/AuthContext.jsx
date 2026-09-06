import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

/**
 * Auth Context — manages authentication state across the app.
 * 
 * Provides:
 *   - user: current user object (id, email, fullName, role)
 *   - token: JWT access token
 *   - login/register/logout: auth action functions
 *   - isAuthenticated: boolean check
 *   - loading: initial auth state check
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, restore auth state from localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('prahari_token');
    const storedUser = localStorage.getItem('prahari_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  /**
   * Login with email and password.
   * Stores JWT token and user info in localStorage.
   */
  const login = async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    const { data } = response.data;

    localStorage.setItem('prahari_token', data.token);
    localStorage.setItem('prahari_user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);

    return data;
  };

  /**
   * Register a new user.
   */
  const register = async (formData) => {
    const response = await client.post('/auth/register', formData);
    const { data } = response.data;

    localStorage.setItem('prahari_token', data.token);
    localStorage.setItem('prahari_user', JSON.stringify(data));
    setToken(data.token);
    setUser(data);

    return data;
  };

  /**
   * Logout — clear all auth state.
   */
  const logout = () => {
    localStorage.removeItem('prahari_token');
    localStorage.removeItem('prahari_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    isAuthenticated: !!token,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
