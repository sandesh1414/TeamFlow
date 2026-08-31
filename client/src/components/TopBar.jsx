
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

const TopBar = ({ title, subtitle, children }) => {
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleScroll = () => setScrolled(window.scrollY > 4);

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: scrolled
          ? 'rgba(255, 255, 255, 0.85)'
          : 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled
          ? '1px solid var(--border)'
          : '1px solid transparent',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '18px',
        transition: 'background 0.25s ease, border-color 0.25s ease',
      }}
    >
      {/* Page Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
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
              letterSpacing: '-0.02em',
            }}
          >
            {title}
          </div>
        )}

        {subtitle && (
          <div
            style={{
              marginTop: '3px',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {children && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingRight: '14px',
              borderRight: '1px solid var(--border)',
            }}
          >
            {children}
          </div>
        )}

        <NotificationBell />

        {/* Profile */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowProfileMenu((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '5px 12px 5px 5px',
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
                fontSize: '10px',
                color: 'var(--text-muted)',
                marginLeft: '2px',
                transform: showProfileMenu
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
              }}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </span>
          </button>

          {showProfileMenu && (
            <div
              className="slide-down"
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '200px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: '6px',
                boxShadow: 'var(--sh-lg)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 12px',
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
                  padding: '10px 12px',
                  border: 'none',
                  background: 'transparent',
                  borderRadius: 'var(--r-sm)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  color: 'var(--error-text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = 'var(--error-bg)')
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'transparent')
                }
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

