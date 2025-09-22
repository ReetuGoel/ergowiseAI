import React from 'react';
import { useAuth } from './auth-context';
import { CheckCircle, Play, BarChart3, Clock, Target, Zap, Settings, User } from 'lucide-react';

interface SidebarProps {
  onQuickAction: (action: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Sidebar({ onQuickAction, activeTab, setActiveTab }: SidebarProps) {
  let user: any = undefined;
  try {
    // useAuth throws if no AuthProvider is present (tests render App directly)
    // so guard with try/catch to keep Sidebar usable in isolation
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuth();
    user = auth?.user;
  } catch (err) {
    // no-op: render a fallback UI when auth is not available (e.g., in unit tests)
    user = undefined;
  }
  const quickActions = [
    {
      id: 'assessment',
      label: 'Quick Assessment',
      icon: <CheckCircle size={18} />,
      description: 'Start 2-min health check',
      color: 'var(--color-primary)'
    },
    {
      id: 'break',
      label: 'Start Break',
      icon: <Play size={18} />,
      description: 'Take a wellness break',
      color: 'var(--color-accent)'
    }
  ];

  const navigationItems = [
    { id: 'Dashboard', icon: <BarChart3 size={18} />, label: 'Dashboard' },
    { id: 'Assessment', icon: <CheckCircle size={18} />, label: 'Assessment' },
    { id: 'Analytics', icon: <Target size={18} />, label: 'Analytics' },
    { id: 'Break Timer', icon: <Clock size={18} />, label: 'Break Timer' },
    { id: 'Posture', icon: <CheckCircle size={18} />, label: 'Posture' }
  ];

  return (
    <div style={{
      width: 280,
      background: 'var(--color-surface)',
      borderRadius: 20,
      padding: 24,
      boxShadow: 'var(--shadow-lg)',
      border: '1px solid var(--color-surface-alt2)',
      height: 'fit-content',
      position: 'sticky',
      top: 32
    }}>
      {/* Quick Actions Section */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Zap size={20} color="var(--color-primary)" />
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: 'var(--color-primary)', 
            margin: 0 
          }}>
            Quick Actions
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {quickActions.map(action => (
            <button
              key={action.id}
              onClick={() => onQuickAction(action.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'linear-gradient(135deg, var(--color-surface-alt), var(--color-surface-alt2))',
                border: '1px solid var(--color-primary)',
                borderRadius: 12,
                padding: '16px 20px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(234,88,12,0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ color: action.color }}>
                {action.icon}
              </div>
              <div>
                <div style={{ 
                  fontSize: 14, 
                  fontWeight: 600, 
                  color: 'var(--color-text)', 
                  marginBottom: 2 
                }}>
                  {action.label}
                </div>
                <div style={{ 
                  fontSize: 12, 
                  color: 'var(--color-text-soft)' 
                }}>
                  {action.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Section */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Settings size={20} color="var(--color-primary)" />
          <h3 style={{ 
            fontSize: 16, 
            fontWeight: 600, 
            color: 'var(--color-primary)', 
            margin: 0 
          }}>
            Navigation
          </h3>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {navigationItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-surface-alt)',
                color: activeTab === item.id ? '#fff' : 'var(--color-text)',
                border: 'none',
                borderRadius: 10,
                padding: '12px 16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                textAlign: 'left',
                width: '100%',
                fontWeight: activeTab === item.id ? 600 : 500,
                fontSize: 14
              }}
              onMouseOver={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'var(--color-surface-alt2)';
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== item.id) {
                  e.currentTarget.style.background = 'var(--color-surface-alt)';
                }
              }}
            >
              <div style={{ 
                color: activeTab === item.id ? '#fff' : 'var(--color-primary)' 
              }}>
                {item.icon}
              </div>
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* User Info Section */}
      <div style={{ 
        marginTop: 24, 
        padding: 16, 
        background: 'var(--color-surface-alt)', 
        borderRadius: 12,
        border: '1px solid var(--color-surface-alt2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ 
            width: 48, 
            height: 48, 
            borderRadius: '50%', 
            overflow: 'hidden',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            background: 'var(--color-surface)'
          }}>
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <User size={20} color="var(--color-primary)" />
            )}
          </div>
          <div>
            <div style={{ 
              fontSize: 14, 
              fontWeight: 600, 
              color: 'var(--color-text)',
              marginBottom: 2
            }}>
              {user?.name || 'User'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}