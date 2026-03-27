import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(
    location.state?.user ? true : null
  );
  const [user, setUser] = useState(location.state?.user || null);

  useEffect(() => {
    // Skip auth check if user data passed from AuthCallback
    if (location.state?.user) return;

    const checkAuth = async () => {
      try {
        const response = await fetch(`${API}/auth/me`, {
          credentials: 'include'
        });

        if (!response.ok) throw new Error('Not authenticated');

        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, [location.state]);

  // Loading state
  if (isAuthenticated === null) {
    return (
      <div style={{
        backgroundColor: '#0A0A0A',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF'
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Authenticated - clone children with user prop
  return React.cloneElement(children, { user });
};

export default ProtectedRoute;
