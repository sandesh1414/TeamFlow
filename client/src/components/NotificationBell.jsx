import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const socketRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetchNotifications();

    const socket = io(SOCKET_URL, { auth: { token: user.token } });
    socketRef.current = socket;
    socket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      socket.disconnect();
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get('/api/notifications', config);
      setNotifications(data);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.read) {
        await axios.put(`/api/notifications/${notif._id}`, {}, config);
        setNotifications((prev) => prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n)));
      }
      setOpen(false);
      if (notif.link) navigate(notif.link);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await axios.put('/api/notifications/read-all', {}, config);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (dateStr) => {
    const diffMs = new Date() - new Date(dateStr);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const getIcon = (type) => {
    if (type === 'task_assigned') return '📋';
    if (type === 'task_commented') return '💬';
    if (type === 'mentioned') return '👋';
    return '🔔';
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button onClick={() => setOpen((prev) => !prev)} className="btn-icon" style={{ position: 'relative', fontSize: '18px', padding: '9px' }} aria-label="Notifications">
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '2px', right: '2px', background: 'var(--error)', color: '#fff', fontSize: '10px', fontWeight: 700, minWidth: '16px', height: '16px', padding: '0 4px', borderRadius: 'var(--r-pill)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="scale-in" style={{ position: 'absolute', right: 0, top: '48px', width: '340px', background: 'var(--surface)', borderRadius: 'var(--r-lg)', boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>
              Notifications {unreadCount > 0 && <span style={{ color: 'var(--primary)' }}>({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ fontSize: '12px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-faint)' }}>
                <div style={{ fontSize: '30px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '13px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', background: notif.read ? 'var(--surface)' : 'var(--primary-soft)', borderBottom: '1px solid var(--border-soft)', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--inset)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = notif.read ? 'var(--surface)' : 'var(--primary-soft)')}
                >
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>{getIcon(notif.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: 'var(--text-body)', lineHeight: 1.45 }}>{notif.message}</p>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', flexShrink: 0, marginTop: '4px' }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
