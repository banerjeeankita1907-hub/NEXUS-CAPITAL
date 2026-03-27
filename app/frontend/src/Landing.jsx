import React from 'react';
import { ChartLine, Brain, Shield, TrendUp } from '@phosphor-icons/react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Landing = () => {
  const handleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/dashboard';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div style={{ backgroundColor: '#0A0A0A', minHeight: '100vh', color: '#FFFFFF' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.12)', padding: '1rem 2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontFamily: 'Chivo, sans-serif', fontSize: '1.5rem', margin: 0 }}>NEXUS CAPITAL</h1>
          <button
            data-testid="login-button"
            onClick={handleLogin}
            style={{
              backgroundColor: '#0055FF',
              color: 'white',
              padding: '0.625rem 1.5rem',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.875rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '6rem 2rem' }}>
        <div style={{ maxWidth: '900px' }}>
          <div style={{ 
            fontFamily: 'IBM Plex Sans, sans-serif', 
            fontSize: '0.75rem', 
            letterSpacing: '0.2em', 
            color: '#A1A1AA', 
            marginBottom: '1.5rem',
            textTransform: 'uppercase'
          }}>
            AI-POWERED FINANCIAL INTELLIGENCE
          </div>
          <h1 style={{
            fontFamily: 'Chivo, sans-serif',
            fontSize: 'clamp(2.5rem, 5vw, 4.5rem)',
            lineHeight: '1.1',
            marginBottom: '1.5rem',
            letterSpacing: '-0.02em'
          }}>
            Replace 90% of Investment Banking Operations
          </h1>
          <p style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '1.125rem',
            lineHeight: '1.7',
            color: '#A1A1AA',
            marginBottom: '3rem',
            maxWidth: '700px'
          }}>
            Elite AI platform delivering institutional-grade market analysis, portfolio optimization, and investment recommendations. Built for CEOs and tech giants.
          </p>
          <button
            data-testid="get-started-button"
            onClick={handleLogin}
            style={{
              backgroundColor: '#0055FF',
              color: 'white',
              padding: '1rem 2.5rem',
              border: 'none',
              borderRadius: '2px',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Access Platform
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '4rem 2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0' }}>
          {[
            {
              icon: <ChartLine size={32} weight="thin" />,
              title: 'Market Analysis',
              description: 'Real-time market insights powered by Claude Sonnet 4.5'
            },
            {
              icon: <Brain size={32} weight="thin" />,
              title: 'Portfolio Optimization',
              description: 'Quantitative risk assessment and rebalancing recommendations'
            },
            {
              icon: <Shield size={32} weight="thin" />,
              title: 'Document Analysis',
              description: 'Extract insights from earnings reports and SEC filings'
            },
            {
              icon: <TrendUp size={32} weight="thin" />,
              title: 'Investment Recommendations',
              description: 'Institutional-grade actionable investment strategies'
            }
          ].map((feature, idx) => (
            <div
              key={idx}
              style={{
                borderRight: '1px solid rgba(255,255,255,0.12)',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                padding: '2.5rem 2rem',
                backgroundColor: '#121212'
              }}
            >
              <div style={{ color: '#0055FF', marginBottom: '1.5rem' }}>
                {feature.icon}
              </div>
              <h3 style={{
                fontFamily: 'Chivo, sans-serif',
                fontSize: '1.25rem',
                marginBottom: '0.75rem'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontFamily: 'IBM Plex Sans, sans-serif',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#A1A1AA'
              }}>
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', padding: '2rem', marginTop: '4rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', textAlign: 'center' }}>
          <p style={{
            fontFamily: 'IBM Plex Sans, sans-serif',
            fontSize: '0.75rem',
            color: '#A1A1AA',
            letterSpacing: '0.1em'
          }}>
            © 2026 NEXUS CAPITAL. BUILT FOR INSTITUTIONAL EXCELLENCE.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Landing;
