import './App.css';
import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { AuthGateway } from './auth-gateway';
import Assessment, { BreakTimer } from './Assessment';
import { ErgoWiseLogo } from './logo';
import { BarChart3, Target, Calendar, TrendingUp, Moon, Sun, Activity } from 'lucide-react';
import { useToast } from './toast-context';
import { useTheme } from './theme-context';
import { WeeklyBreaksChart, ProgressTrendChart, ErgonomicCategoriesChart, DailyActivityChart, WellnessScoreRadial } from './charts';
import PostureCapture from './PostureCapture';
import { Sidebar } from './sidebar';

function App() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [breakStartTrigger, setBreakStartTrigger] = useState(0);
  // Guard provider hooks so tests can render App without wrappers
  let user: any = undefined;
  let logout: () => void = () => {};
  try {
    // useAuth throws when no AuthProvider is present; catch to allow tests to render App
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    user = auth?.user;
    logout = auth?.logout ?? (() => {});
  } catch (err) {
    user = undefined;
    logout = () => {};
  }

  type ToastFn = (message: string, type?: 'success' | 'error' | 'info' | 'warning', duration?: number) => void;
  let addToast: ToastFn = (_m: string, _t?: 'success' | 'error' | 'info' | 'warning', _d?: number) => {};
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const toast = useToast();
    // wrap to our ToastFn signature in case toast has a stricter type
    const real = toast?.addToast as ToastFn | undefined;
    if (real) addToast = real;
  } catch (err) {
    // no-op
  }

  let toggleTheme = () => {};
  let isDark = false;
  const [accent, setAccent] = useState<string>(() => {
    try {
      return localStorage.getItem('ergowise:accent') || '#ea580c';
    } catch {
      return '#ea580c';
    }
  });
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const theme = useTheme();
    toggleTheme = theme?.toggleTheme ?? toggleTheme;
    isDark = theme?.isDark ?? isDark;
  } catch (err) {
    // no-op
  }

  const handleLogout = () => {
    logout();
    addToast('You have been signed out successfully.', 'info');
  };

  const handleQuickAction = (action: string) => {
    if (action === 'assessment') {
      setActiveTab('Assessment');
      addToast('Starting your ergonomic assessment...', 'info');
    } else if (action === 'break') {
      setActiveTab('Break Timer');
      // increment trigger (parent -> child) to start break timer
      setBreakStartTrigger(prev => prev + 1);
      addToast('Time for a healthy break! Break timer started.', 'success');
    }
  };

  const handleThemeToggle = () => {
    toggleTheme();
    addToast(`Switched to ${isDark ? 'light' : 'dark'} mode`, 'info');
  };

  const handleAccentChange = (newColor: string) => {
    setAccent(newColor);
    try { localStorage.setItem('ergowise:accent', newColor); } catch {}
    // update CSS variables directly
    document.documentElement.style.setProperty('--color-primary', newColor);
    document.documentElement.style.setProperty('--color-accent', newColor);
    addToast('Accent color updated', 'success');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--gradient-bg)',
      fontFamily: 'Segoe UI, Arial, sans-serif',
      padding: '24px'
    }}>
      {!user && <AuthGateway />}
      {user && (
        <div style={{ display: 'flex', gap: 24, maxWidth: 1400, margin: '0 auto' }}>
          {/* Sidebar */}
          <Sidebar 
            onQuickAction={handleQuickAction}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
          
          {/* Main Content */}
          <div style={{ flex: 1 }}>
            {/* Header */}
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-surface-alt2)',
              position: 'relative'
            }}>
              {/* Theme Toggle & Sign Out - Top Right */}
              <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Accent Color Picker */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--color-text-soft)', background: 'var(--color-surface-alt2)', padding: '4px 8px', borderRadius: 8, border: '1px solid var(--color-surface-alt2)' }}>
                  <span>Accent</span>
                  <input
                    type="color"
                    value={accent}
                    onChange={(e) => handleAccentChange(e.target.value)}
                    style={{ width: 28, height: 28, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}
                    aria-label="Select accent color"
                  />
                </label>
                <button 
                  onClick={handleThemeToggle}
                  style={{
                    background: 'var(--color-surface-alt2)', 
                    border: '1px solid var(--color-primary)', 
                    padding: '8px 12px', 
                    borderRadius: 12, 
                    cursor: 'pointer', 
                    color: 'var(--color-primary)', 
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-alt2)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light' : 'Dark'}
                </button>
                <button 
                  onClick={handleLogout}
                  style={{
                    background: 'var(--color-surface-alt2)', 
                    border: '1px solid var(--color-primary)', 
                    padding: '8px 16px', 
                    borderRadius: 12, 
                    cursor: 'pointer', 
                    color: 'var(--color-primary)', 
                    fontWeight: 600,
                    fontSize: 14,
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'var(--color-surface-alt2)';
                    e.currentTarget.style.color = 'var(--color-primary)';
                  }}
                >
                  🚪 Sign out
                </button>
              </div>

              {/* Logo and Welcome Section */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, paddingRight: 200 }}>
                <ErgoWiseLogo size={60} />
                <div style={{ textAlign: 'left' }}>
                  <h1 style={{ fontSize: 36, fontWeight: 700, color: 'var(--color-primary)', margin: 0, letterSpacing: '-0.5px' }}>ErgoWise</h1>
                  <p style={{ fontSize: 16, color: 'var(--color-text-soft)', margin: 0, marginTop: 4 }}>Your personalized workspace wellness assistant</p>
                </div>
              </div>
              
              {/* Welcome Message */}
              <div style={{ 
                background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', 
                padding: '8px 16px', 
                borderRadius: 12, 
                border: '1px solid #fed7aa',
                textAlign: 'center'
              }}>
                <h2 style={{ 
                  fontSize: 18, 
                  fontWeight: 600, 
                  color: 'var(--color-primary)', 
                  margin: 0, 
                  marginBottom: 2 
                }}>
                  Welcome back, {user.name}! 👋
                </h2>
                <p style={{ 
                  fontSize: 14, 
                  color: 'var(--color-text-soft)', 
                  margin: 0 
                }}>
                  Ready to improve your workspace wellness today?
                </p>
              </div>
            </div>

            {/* Content Area */}
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 20,
              padding: 32,
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--color-surface-alt2)'
            }}>
              {activeTab === 'Dashboard' && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <BarChart3 size={28} color="var(--color-primary)" />
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Ergonomic Wellness Dashboard</h2>
                      <p style={{ color: 'var(--color-text-soft)', margin: 0, fontSize: 14 }}>Track your workspace health and productivity habits</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
                    <Card 
                      title="Current Score" 
                      value="82%" 
                      subtitle="Excellent progress!" 
                      icon={<Target size={20} />}
                      progress={82}
                    />
                    <Card 
                      title="Weekly Breaks" 
                      value="23/35" 
                      subtitle="Target: 35" 
                      icon={<Calendar size={20} />}
                      progress={66}
                    />
                    <Card 
                      title="Current Streak" 
                      value="7" 
                      subtitle="Days of good habits" 
                      icon={<Calendar size={20} />}
                      progress={100}
                    />
                    <Card 
                      title="Monthly Improvement" 
                      value="+15%" 
                      subtitle="vs last month" 
                      valueColor="var(--color-primary)" 
                      icon={<TrendingUp size={20} />}
                      progress={75}
                    />
                  </div>
                </section>
              )}

              {activeTab === 'Assessment' && (
                <Assessment />
              )}

              {activeTab === 'Analytics' && (
                <section>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                    <Activity size={28} color="var(--color-primary)" />
                    <div>
                      <h2 style={{ fontSize: 24, fontWeight: 600, margin: 0, color: 'var(--color-primary)' }}>Analytics Dashboard</h2>
                      <p style={{ color: 'var(--color-text-soft)', margin: 0, fontSize: 14 }}>Track your workspace wellness patterns and improvements</p>
                    </div>
                  </div>
                  
                  {/* Top Row - Main Metrics */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                    <WellnessScoreRadial score={82} />
                    <ErgonomicCategoriesChart />
                  </div>
                  
                  {/* Second Row - Trends */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 24, marginBottom: 24 }}>
                    <ProgressTrendChart />
                  </div>
                  
                  {/* Third Row - Daily & Weekly Patterns */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                    <DailyActivityChart />
                    <WeeklyBreaksChart />
                  </div>
                </section>
              )}

              {activeTab === 'Recommendations' && (
                <section>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>Recommendations</h2>
                  <p style={{ color: 'var(--color-text-soft)', marginBottom: 16 }}>
                    Here you will see personalized ergonomic recommendations after your assessment.
                  </p>
                </section>
              )}

              {activeTab === 'Posture' && (
                <section>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>Posture Analysis</h2>
                  <p style={{ color: 'var(--color-text-soft)', marginBottom: 16 }}>
                    Upload up to 5 images to analyze posture and receive recommendations.
                  </p>
                  <PostureCapture />
                </section>
              )}

              {activeTab === 'Break Timer' && (
                <section>
                  <h2 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8, color: 'var(--color-primary)' }}>Break Management</h2>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <BreakTimer startTrigger={breakStartTrigger} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24, marginBottom: 16 }}>
                    <Card title="This week's breaks:" value="23/35" icon={<Calendar size={20} />} />
                    <Card title="Average break length:" value="3.2 min" icon={<Calendar size={20} />} />
                  </div>
                  <Card title="Breaks today:" value="5" icon={<Calendar size={20} />} />
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ title, value, subtitle, valueColor, icon, progress }: { 
  title: string, 
  value: string, 
  subtitle?: string, 
  valueColor?: string,
  icon?: React.ReactNode,
  progress?: number
}) {
  return (
    <div style={{
      background: 'var(--color-surface-alt)',
      borderRadius: 16,
      boxShadow: '0 2px 8px rgba(234,88,12,0.12)',
      padding: '20px 24px',
      marginBottom: 12,
      textAlign: 'center',
      border: '1px solid var(--color-surface-alt2)',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer'
    }}
    onMouseOver={(e) => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.18)';
    }}
    onMouseOut={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(234,88,12,0.12)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
        {icon && <div style={{ color: 'var(--color-primary)' }}>{icon}</div>}
        <h3 style={{ fontWeight: 600, fontSize: 16, margin: 0, color: 'var(--color-text-soft)' }}>{title}</h3>
      </div>
      <p style={{ fontSize: 28, fontWeight: 700, color: valueColor || 'var(--color-primary)', marginBottom: 8, margin: 0 }}>{value}</p>
      {subtitle && <p style={{ color: 'var(--color-text-soft)', fontSize: 13, margin: 0, marginBottom: 8 }}>{subtitle}</p>}
      {progress !== undefined && (
        <div style={{ marginTop: 8 }}>
          <div style={{ 
            width: '100%', 
            background: 'var(--color-surface)', 
            borderRadius: 8, 
            height: 6, 
            overflow: 'hidden' 
          }}>
            <div style={{ 
              background: `linear-gradient(90deg, var(--color-primary), var(--color-accent))`, 
              height: '100%', 
              borderRadius: 8,
              width: `${Math.min(progress, 100)}%`,
              transition: 'width 0.3s ease'
            }} />
          </div>
          <p style={{ fontSize: 11, color: 'var(--color-text-soft)', margin: 0, marginTop: 4 }}>
            {progress}% complete
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
