import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

const TopBar = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const initial = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <header
      style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '14px 32px',
        display: 'flex', alignItems: 'center', gap: '14px',
      }}
    >
      <button className="btn-icon" onClick={() => navigate('/dashboard')} aria-label="Dashboard">
        <Logo size={30} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {title && <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>}
        {subtitle && <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{subtitle}</div>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}
        <NotificationBell />
        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '5px 12px 5px 5px', background: 'var(--inset)', borderRadius: 'var(--r-pill)', border: '1px solid var(--border-soft)' }}>
          <span className="avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>{initial}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-body)' }}>{user?.name?.split(' ')[0]}</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={logout}>Log out</button>
      </div>
    </header>
  );
};

export default TopBar;
