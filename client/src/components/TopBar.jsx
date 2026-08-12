import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import Logo from './Logo';

const TopBar = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-soft)',
        padding: '16px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
      }}
    >
      {/* Logo */}
      <button
        className="btn-icon"
        onClick={() => navigate('/dashboard')}
        aria-label="Dashboard"
        style={{
          width: '42px',
          height: '42px',
          borderRadius: '13px',
          flexShrink: 0,
        }}
      >
        <Logo size={30} />
      </button>

      {/* Page Title */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
        }}
      >
        {title && (
          <div
            style={{
              fontSize: '18px',
              fontWeight: 750,
              color: 'var(--text)',
              lineHeight: 1.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {title}
          </div>
        )}

        {subtitle && (
          <div
            style={{
              marginTop: '4px',
              fontSize: '13px',
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {subtitle}
          </div>
        )}
      </div>

      {/* Right Side */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        {/* Page Actions */}
        {children && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingRight: '14px',
              borderRight: '1px solid var(--border-soft)',
            }}
          >
            {children}
          </div>
        )}

        {/* Notifications */}
        <NotificationBell />

        {/* Profile */}
        <div
          ref={profileRef}
          style={{
            position: 'relative',
          }}
        >
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '5px 11px 5px 5px',
              background: 'var(--inset)',
              borderRadius: 'var(--r-pill)',
              border: '1px solid var(--border-soft)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span
              className="avatar"
              style={{
                width: '30px',
                height: '30px',
                fontSize: '12px',
              }}
            >
              {initial}
            </span>

            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-body)',
              }}
            >
              {user?.name?.split(' ')[0]}
            </span>

            <span
              style={{
                fontSize: '11px',
                color: 'var(--text-muted)',
                marginLeft: '2px',
                transform: showProfileMenu
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              ▼
            </span>
          </button>

          {/* Profile Dropdown */}
          {showProfileMenu && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '180px',
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                borderRadius: '14px',
                padding: '6px',
                boxShadow: '0 12px 30px rgba(0, 0, 0, 0.12)',
                animation: 'slide-up 0.18s ease-out',
              }}
            >
              <div
                style={{
                  padding: '10px 11px',
                  borderBottom: '1px solid var(--border-soft)',
                  marginBottom: '5px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {user?.name}
                </div>

                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user?.email}
                </div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                style={{
                  width: '100%',
                  padding: '10px 11px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: '9px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontSize: '13px',
                  fontWeight: 600,
                }}
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;