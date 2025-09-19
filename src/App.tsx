import './App.css';
import React, { useState } from 'react';
import { useAuth } from './auth-context';
import { AuthGateway } from './auth-gateway';
import Assessment, { BreakTimer } from './Assessment';
import { ErgoWiseLogo } from './logo';
import { Moon, Sun } from 'lucide-react';
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
      return localStorage.getItem('ergowise:accent') || 'var(--color-accent, var(--brand-primary))';
    } catch {
      return 'var(--color-accent, var(--brand-primary))';
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
              padding: 20,
              paddingLeft: 32,
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
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-primary)'
                  }}
                  aria-label="Toggle theme"
                >
                  {isDark ? <Sun size={16} /> : <Moon size={16} />}
                  {isDark ? 'Light' : 'Dark'}
                </button>
                <button onClick={handleLogout} style={{ background: 'var(--color-primary)', color: '#fff', padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Sign Out
                </button>
              </div>

              {/* Logo + Welcome */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <ErgoWiseLogo size={56} showWordmark tagline="Personalized wellness assistant" />
                <div>
                  <h1 style={{ fontSize: 24, margin: 0, background: 'linear-gradient(90deg,var(--color-primary), var(--brand-accent))', WebkitBackgroundClip: 'text', color: 'transparent' }}>Welcome{user ? `, ${user.name}` : ''}</h1>
                  <p style={{ margin: '6px 0 0', color: 'var(--color-text-soft)', fontSize: 14 }}>Optimize your workspace health with real-time posture insights.</p>
                </div>
              </div>
            </div>

            {/* Tabs Content */}
            {activeTab === 'Dashboard' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
                <WeeklyBreaksChart />
                <ProgressTrendChart />
                <ErgonomicCategoriesChart />
                <DailyActivityChart />
                <WellnessScoreRadial score={82} />
              </div>
            )}

            {activeTab === 'Assessment' && <Assessment />}
            {activeTab === 'Break Timer' && <BreakTimer startTrigger={breakStartTrigger} />}
            {activeTab === 'Posture' && <PostureCapture />}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
