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

    // Socket for real-time notifications
    const socket = io(SOCKET_URL, { auth: { token: user.token } });
    socketRef.current = socket;
    socket.on('new_notification', (notification) => {
      setNotifications((prev) => [notification, ...prev]);
    });

    // Close dropdown on outside click
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
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{ position: 'relative', background: open ? '#f0f0f0' : 'none', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '6px 8px', borderRadius: '8px' }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{ position: 'absolute', top: '0', right: '0', background: '#e53935', color: 'white', fontSize: '10px', fontWeight: '700', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', right: 0, top: '46px', width: '340px', background: 'white', borderRadius: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.15)', border: '1px solid #f0f0f0', zIndex: 200, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: '700' }}>
              Notifications {unreadCount > 0 && <span style={{ color: '#6c63ff' }}>({unreadCount})</span>}
            </h3>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} style={{ fontSize: '12px', color: '#6c63ff', background: 'none', border: 'none', cursor: 'pointer' }}>Mark all read</button>
            )}
          </div>

          <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#bbb' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</div>
                <p style={{ margin: 0, fontSize: '13px' }}>You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleNotificationClick(notif)}
                  style={{ padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', background: notif.read ? 'white' : '#f5f3ff', borderBottom: '1px solid #f5f5f5', transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? 'white' : '#f5f3ff'}
                >
                  <span style={{ fontSize: '20px', flexShrink: 0 }}>{getIcon(notif.type)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#333', lineHeight: '1.4' }}>{notif.message}</p>
                    <span style={{ fontSize: '11px', color: '#999' }}>{formatTime(notif.createdAt)}</span>
                  </div>
                  {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6c63ff', flexShrink: 0, marginTop: '4px' }} />}
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
