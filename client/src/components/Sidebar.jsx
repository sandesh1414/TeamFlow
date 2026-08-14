import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import { avatarGradient } from '../styles/theme';

const ChevronIcon = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
      transition: 'transform 0.2s ease',
      flexShrink: 0,
      opacity: 0.5,
    }}
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

const BoardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const ChatIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const DashboardIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="3" width="7" height="7" rx="1.5" />
    <rect x="14" y="14" width="7" height="7" rx="1.5" />
    <rect x="3" y="14" width="7" height="7" rx="1.5" />
  </svg>
);

const TeamsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [teams, setTeams] = useState([]);
  const [teamsLoading, setTeamsLoading] = useState(true);
  const [expandedTeam, setExpandedTeam] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const profileRef = useRef(null);

  const initial = user?.name?.[0]?.toUpperCase() || '?';

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/teams/mine', config);
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams', err);
      } finally {
        setTeamsLoading(false);
      }
    };
    fetchTeams();
  }, [user.token]);

  // Auto-expand the team matching the current route
  useEffect(() => {
    const match = location.pathname.match(/^\/team\/([^/]+)/);
    if (match) {
      setExpandedTeam(match[1]);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDashboard = location.pathname === '/dashboard';
  const currentTeamId = location.pathname.match(/^\/team\/([^/]+)/)?.[1];
  const currentView = location.pathname.match(/^\/team\/[^/]+\/(board|chat)$/)?.[1];

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const toggleTeam = (teamId) => {
    setExpandedTeam((prev) => (prev === teamId ? null : teamId));
  };

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="sidebar-toggle"
        onClick={() => setMobileOpen((prev) => !prev)}
        aria-label="Toggle menu"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {mobileOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}

      <aside className={`sidebar ${mobileOpen ? 'sidebar-open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo" onClick={() => handleNav('/dashboard')}>
          <Logo size={32} />
          <span className="sidebar-logo-text">TeamFlow</span>
        </div>

        {/* Dashboard nav item */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${isDashboard ? 'sidebar-nav-active' : ''}`}
            onClick={() => handleNav('/dashboard')}
          >
            <span className="sidebar-nav-icon"><DashboardIcon /></span>
            <span>Dashboard</span>
            {isDashboard && <span className="sidebar-nav-indicator" />}
          </button>

          {/* Teams section label */}
          <div className="sidebar-section-label">
            <TeamsIcon />
            <span>Teams</span>
          </div>

          {/* Teams list */}
          <div className="sidebar-teams">
            {teamsLoading ? (
              [0, 1, 2].map((i) => (
                <div key={i} className="skeleton" style={{ height: '34px', borderRadius: 'var(--r-md)' }} />
              ))
            ) : teams.length === 0 ? (
              <div className="sidebar-teams-empty">
                No teams yet
              </div>
            ) : (
              teams.map((team) => {
                const isExpanded = expandedTeam === team._id;
                const isCurrentTeam = currentTeamId === team._id;

                return (
                  <div key={team._id} className="sidebar-team-group">
                    <button
                      className={`sidebar-team-header ${isCurrentTeam && !currentView ? 'sidebar-team-active' : ''}`}
                      onClick={() => toggleTeam(team._id)}
                    >
                      <span
                        className="sidebar-team-avatar"
                        style={{ background: avatarGradient(team.name) }}
                      >
                        {team.name[0]?.toUpperCase()}
                      </span>
                      <span className="sidebar-team-name">{team.name}</span>
                      <ChevronIcon open={isExpanded} />
                    </button>

                    {/* Expandable sub-options */}
                    <div className={`sidebar-subnav ${isExpanded ? 'sidebar-subnav-open' : ''}`}>
                      <div className="sidebar-subnav-inner">
                        <button
                          className={`sidebar-subnav-item ${isCurrentTeam && currentView === 'board' ? 'sidebar-subnav-active' : ''}`}
                          onClick={() => handleNav(`/team/${team._id}/board`)}
                        >
                          <span className="sidebar-subnav-icon"><BoardIcon /></span>
                          <span>Board</span>
                        </button>
                        <button
                          className={`sidebar-subnav-item ${isCurrentTeam && currentView === 'chat' ? 'sidebar-subnav-active' : ''}`}
                          onClick={() => handleNav(`/team/${team._id}/chat`)}
                        >
                          <span className="sidebar-subnav-icon"><ChatIcon /></span>
                          <span>Chat</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </nav>

        {/* Bottom section */}
        <div className="sidebar-bottom">
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              className="sidebar-profile"
              onClick={() => setShowProfileMenu((prev) => !prev)}
            >
              <span className="avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                {initial}
              </span>
              <div className="sidebar-profile-info">
                <div className="sidebar-profile-name">{user?.name?.split(' ')[0]}</div>
                <div className="sidebar-profile-email">{user?.email}</div>
              </div>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  transform: showProfileMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  color: 'var(--text-faint)',
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {showProfileMenu && (
              <div className="sidebar-profile-menu slide-down">
                <button
                  className="sidebar-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Log out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
