"import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { 
  ChartLine, 
  Brain, 
  FileText, 
  TrendUp, 
  SignOut,
  CaretUp,
  CaretDown,
  CircleNotch
} from '@phosphor-icons/react';
import { LineChart, Line, ResponsiveContainer, AreaChart, Area } from 'recharts';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ user }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('market');
  const [marketData, setMarketData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // Fetch market overview
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await fetch(`${API}/market/overview`, {
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch market data');
        const data = await response.json();
        setMarketData(data.markets);
      } catch (error) {
        console.error('Error fetching market data:', error);
        toast.error('Failed to load market data');
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${API}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      navigate('/');
    }
  };

  const runAnalysis = async (type, query, context = null) => {
    setAnalysisLoading(true);
    setAnalysisResult('');
    
    try {
      const response = await fetch(`${API}/analyze/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ query, context })
      });

      if (!response.ok) throw new Error('Analysis failed');

      const data = await response.json();
      setAnalysisResult(data.result);
      toast.success('Analysis complete');
    } catch (error) {
      console.error('Analysis error:', error);
      toast.error('Analysis failed');
    } finally {
      setAnalysisLoading(false);
    }
  };

  // Generate mock chart data for sparklines
  const generateSparklineData = (baseValue, volatility = 5) => {
    return Array.from({ length: 20 }, (_, i) => ({
      value: baseValue + (Math.random() - 0.5) * volatility
    }));
  };

  return (
    <div style={{ 
      backgroundColor: '#0A0A0A', 
      minHeight: '100vh',
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      height: '100vh',
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div style={{ 
        borderBottom: '1px solid rgba(255,255,255,0.12)', 
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#121212'
      }}>
        <div>
          <h1 style={{ 
            fontFamily: 'Chivo, sans-serif', 
            fontSize: '1.25rem', 
            margin: 0,
            letterSpacing: '0.05em'
          }}>
            NEXUS CAPITAL
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            paddingRight: '1.5rem',
            borderRight: '1px solid rgba(255,255,255,0.12)'
          }}>
            <img 
              src={user?.picture || 'https://via.placeholder.com/32'} 
              alt=\"User\"
              style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '2px',
                border: '1px solid rgba(255,255,255,0.12)'
              }}
            />
            <div>
              <div style={{ 
                fontFamily: 'IBM Plex Sans, sans-serif', 
                fontSize: '0.875rem',
                fontWeight: '500'
              }}>
                {user?.name}
              </div>
              <div style={{ 
                fontFamily: 'IBM Plex Sans, sans-serif', 
                fontSize: '0.75rem',
                color: '#A1A1AA'
              }}>
                {user?.email}
              </div>
            </div>
          </div>
          
          <button
            data-testid=\"logout-button\"
            onClick={handleLogout}
            style={{
              backgroundColor: 'transparent',
              color: '#A1A1AA',
              padding: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'IBM Plex Sans, sans-serif',
              fontSize: '0.875rem'
            }}
          >
            <SignOut size={20} />
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 400px',
        height: 'calc(100vh - 60px)',
        overflow: 'hidden'
      }}>
        {/* Left Panel - Market Overview & Analysis */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.12)',
          overflow: 'hidden'
        }}>
          {/* Market Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0',
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}>
            {marketData.slice(0, 3).map((market, idx) => (
              <div 
                key={idx}
                data-testid={`market-${market.symbol.toLowerCase()}`}
                style={{
                  padding: '1rem',
                  borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.12)' : 'none',
                  backgroundColor: '#121212'
                }}
              >
                <div style={{ 
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.625rem',
                  letterSpacing: '0.1em',
                  color: '#A1A1AA',
                  marginBottom: '0.5rem',
                  textTransform: 'uppercase'
                }}>
                  {market.symbol}
                </div>
                <div style={{ 
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  marginBottom: '0.25rem'
                }}>
                  {market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '0.75rem',
                  color: market.change >= 0 ? '#22C55E' : '#EF4444'
                }}>
                  {market.change >= 0 ? <CaretUp size={14} weight=\"fill\" /> : <CaretDown size={14} weight=\"fill\" />}
                  {Math.abs(market.changePercent)}%
                </div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div style={{ 
            display: 'flex',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            backgroundColor: '#121212'
          }}>
            {[
              { id: 'market', label: 'Market Analysis', icon: ChartLine },
              { id: 'portfolio', label: 'Portfolio', icon: Brain },
              { id: 'document', label: 'Documents', icon: FileText },
              { id: 'recommendations', label: 'Recommendations', icon: TrendUp }
            ].map((tab) => (
              <button
                key={tab.id}
                data-testid={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  padding: '0.875rem 1rem',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderBottom: activeTab === tab.id ? '2px solid #0055FF' : '2px solid transparent',
                  color: activeTab === tab.id ? '#FFFFFF' : '#A1A1AA',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                <tab.icon size={16} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Analysis Panel */}
          <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto' }}>
            {activeTab === 'market' && (
              <div data-testid=\"market-analysis-panel\">
                <h2 style={{ 
                  fontFamily: 'Chivo, sans-serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  Market Analysis
                </h2>
                <p style={{ 
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.875rem',
                  color: '#A1A1AA',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  Get AI-powered insights on market trends, sector analysis, and economic indicators.
                </p>
                
                <button
                  data-testid=\"run-market-analysis-button\"
                  onClick={() => runAnalysis('market', 'Analyze current market conditions, identify key trends, and highlight sectors with highest growth potential. Include risk factors to watch.')}
                  disabled={analysisLoading}
                  style={{
                    backgroundColor: '#0055FF',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: analysisLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: analysisLoading ? 0.6 : 1
                  }}
                >
                  {analysisLoading && <CircleNotch size={16} className=\"animate-spin\" style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {analysisLoading ? 'Analyzing...' : 'Run Market Analysis'}
                </button>

                {analysisResult && (
                  <div style={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '1.5rem',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {analysisResult}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'portfolio' && (
              <div data-testid=\"portfolio-panel\">
                <h2 style={{ 
                  fontFamily: 'Chivo, sans-serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  Portfolio Optimization
                </h2>
                <p style={{ 
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.875rem',
                  color: '#A1A1AA',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  AI-driven portfolio risk assessment and rebalancing recommendations.
                </p>
                
                <button
                  data-testid=\"run-portfolio-analysis-button\"
                  onClick={() => runAnalysis('portfolio', 'Analyze a diversified portfolio containing 40% equities (S&P 500), 30% bonds (US Treasury), 20% real estate, 10% commodities. Provide risk metrics and optimization recommendations.')}
                  disabled={analysisLoading}
                  style={{
                    backgroundColor: '#0055FF',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: analysisLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: analysisLoading ? 0.6 : 1
                  }}
                >
                  {analysisLoading && <CircleNotch size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {analysisLoading ? 'Analyzing...' : 'Optimize Portfolio'}
                </button>

                {analysisResult && (
                  <div style={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '1.5rem',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {analysisResult}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'document' && (
              <div data-testid=\"document-analysis-panel\">
                <h2 style={{ 
                  fontFamily: 'Chivo, sans-serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  Document Analysis
                </h2>
                <p style={{ 
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.875rem',
                  color: '#A1A1AA',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  Extract insights from earnings reports, SEC filings, and financial statements.
                </p>
                
                <button
                  data-testid=\"run-document-analysis-button\"
                  onClick={() => runAnalysis('document', 'Analyze a tech company Q4 earnings report showing: Revenue $120B (+12% YoY), Net Income $28B (+8% YoY), Cloud division revenue $85B (+15% YoY), Operating margin 25%. Extract key insights and red flags.')}
                  disabled={analysisLoading}
                  style={{
                    backgroundColor: '#0055FF',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: analysisLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: analysisLoading ? 0.6 : 1
                  }}
                >
                  {analysisLoading && <CircleNotch size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {analysisLoading ? 'Analyzing...' : 'Analyze Sample Document'}
                </button>

                {analysisResult && (
                  <div style={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '1.5rem',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {analysisResult}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'recommendations' && (
              <div data-testid=\"recommendations-panel\">
                <h2 style={{ 
                  fontFamily: 'Chivo, sans-serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem'
                }}>
                  Investment Recommendations
                </h2>
                <p style={{ 
                  fontFamily: 'IBM Plex Sans, sans-serif',
                  fontSize: '0.875rem',
                  color: '#A1A1AA',
                  marginBottom: '1.5rem',
                  lineHeight: '1.6'
                }}>
                  Institutional-grade investment strategies tailored to your risk profile.
                </p>
                
                <button
                  data-testid=\"get-recommendations-button\"
                  onClick={() => runAnalysis('recommendations', 'Provide investment recommendations for a conservative institutional investor with $100M AUM, seeking 6-8% annual returns with moderate risk tolerance. Focus on diversification and capital preservation.')}
                  disabled={analysisLoading}
                  style={{
                    backgroundColor: '#0055FF',
                    color: 'white',
                    padding: '0.75rem 1.5rem',
                    border: 'none',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: analysisLoading ? 'not-allowed' : 'pointer',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    opacity: analysisLoading ? 0.6 : 1
                  }}
                >
                  {analysisLoading && <CircleNotch size={16} style={{ animation: 'spin 0.8s linear infinite' }} />}
                  {analysisLoading ? 'Generating...' : 'Generate Recommendations'}
                </button>

                {analysisResult && (
                  <div style={{
                    backgroundColor: '#121212',
                    border: '1px solid rgba(255,255,255,0.12)',
                    padding: '1.5rem',
                    borderRadius: '2px',
                    fontFamily: 'IBM Plex Sans, sans-serif',
                    fontSize: '0.875rem',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {analysisResult}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar - Live Market Data */}
        <div style={{ 
          backgroundColor: '#121212',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <div style={{ 
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.12)'
          }}>
            <h3 style={{ 
              fontFamily: 'Chivo, sans-serif',
              fontSize: '0.875rem',
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: 0
            }}>
              Live Markets
            </h3>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
            {marketData.map((market, idx) => (
              <div 
                key={idx}
                data-testid={`sidebar-market-${market.symbol.toLowerCase()}`}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid rgba(255,255,255,0.12)',
                  marginBottom: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <div>
                    <div style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      color: '#A1A1AA',
                      marginBottom: '0.25rem'
                    }}>
                      {market.symbol}
                    </div>
                    <div style={{ 
                      fontFamily: 'IBM Plex Sans, sans-serif',
                      fontSize: '0.75rem',
                      color: '#A1A1AA'
                    }}>
                      {market.name}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '1rem',
                      fontWeight: '600',
                      marginBottom: '0.25rem'
                    }}>
                      {market.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div style={{ 
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '0.75rem',
                      color: market.change >= 0 ? '#22C55E' : '#EF4444',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '0.25rem'
                    }}>
                      {market.change >= 0 ? <CaretUp size={12} weight=\"fill\" /> : <CaretDown size={12} weight=\"fill\" />}
                      {Math.abs(market.changePercent)}%
                    </div>
                  </div>
                </div>
                
                {/* Sparkline */}
                <div style={{ height: '40px', marginTop: '0.5rem' }}>
                  <ResponsiveContainer width=\"100%\" height=\"100%\">
                    <AreaChart data={generateSparklineData(market.price, market.price * 0.02)}>
                      <defs>
                        <linearGradient id={`gradient-${idx}`} x1=\"0\" y1=\"0\" x2=\"0\" y2=\"1\">
                          <stop offset=\"5%\" stopColor={market.change >= 0 ? '#22C55E' : '#EF4444'} stopOpacity={0.3}/>
                          <stop offset=\"95%\" stopColor={market.change >= 0 ? '#22C55E' : '#EF4444'} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <Area
                        type=\"monotone\"
                        dataKey=\"value\"
                        stroke={market.change >= 0 ? '#22C55E' : '#EF4444'}
                        strokeWidth={1}
                        fill={`url(#gradient-${idx})`}
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
"
