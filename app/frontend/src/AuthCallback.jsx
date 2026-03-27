import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthCallback = () => {
  const navigate = useNavigate();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent race conditions under StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          navigate('/');
          return;
        }

        const response = await fetch(`${API}/auth/session`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ session_id: sessionId })
        });

        if (!response.ok) throw new Error('Authentication failed');

        const user = await response.json();
        navigate('/dashboard', { state: { user }, replace: true });
      } catch (error) {
        console.error('Auth error:', error);
        navigate('/');
      }
    };

    processAuth();
  }, [navigate]);

  return (
    <div style={{
      backgroundColor: '#0A0A0A',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#FFFFFF'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          border: '2px solid rgba(255,255,255,0.12)',
          borderTop: '2px solid #0055FF',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 0.8s linear infinite',
          margin: '0 auto 1rem'
        }} />
        <p style={{ fontFamily: 'IBM Plex Sans, sans-serif', fontSize: '0.875rem', color: '#A1A1AA' }}>
          Authenticating...
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
