import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

import CreateTeamModal from '../components/CreateTeamModal';
import JoinTeamModal from '../components/JoinTeamModal';
import TopBar from '../components/TopBar';
import EditTeamModal from '../components/EditTeamModal';
import { avatarGradient } from '../styles/theme';

const DashboardPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMyTeams = async () => {
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.get('/api/teams/mine', config);
        setTeams(data);
      } catch (err) {
        console.error('Failed to fetch teams', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTeams();
  }, [user.token]);

  const handleTeamCreated = (newTeam) => setTeams((prev) => [newTeam, ...prev]);
  const handleTeamJoined = (joinedTeam) => setTeams((prev) => [joinedTeam, ...prev]);

  const getMyRole = (team) => {
    const member = team.members.find(
      (m) =>
        m.user._id === user._id ||
        m.user._id?.toString() === user._id?.toString()
    );
    return member?.role || 'member';
  };

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);
  const ownerCount = teams.filter((t) => getMyRole(t) === 'owner').length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="My Teams" subtitle="Pick a workspace to dive in">
        <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M21 3l-9 9"/><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5"/></svg>
          Join Team
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Create Team
        </button>
      </TopBar>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '42px 32px' }}>
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: '98px' }} />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div
            className="card slide-up"
            style={{
              textAlign: 'center',
              padding: '80px 40px',
              maxWidth: '580px',
              margin: '0 auto',
              border: '1px dashed var(--border-strong)',
              boxShadow: 'none',
            }}
          >
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: 'var(--r-2xl)',
                background: 'linear-gradient(135deg, var(--primary-soft), var(--ai-soft))',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                color: 'var(--primary)',
              }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
            </div>

            <h2 style={{ fontSize: '24px', marginBottom: '10px', letterSpacing: '-0.025em' }}>
              Start your first team
            </h2>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '15px',
                lineHeight: 1.6,
                maxWidth: '400px',
                margin: '0 auto 28px',
              }}
            >
              Create a workspace for your crew or hop into one with an invite
              code from a teammate.
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Create Team
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setShowJoin(true)}>
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Welcome header band */}
            <div className="page-band slide-up" style={{ marginBottom: '32px' }}>
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', marginBottom: '6px' }}>
                  Welcome back, {user.name?.split(' ')[0]}
                </div>
                <h2 style={{ fontSize: '26px', marginBottom: '6px', letterSpacing: '-0.028em' }}>
                  Your Workspaces
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '420px' }}>
                  {teams.length} team{teams.length !== 1 ? 's' : ''} · {totalMembers} member{totalMembers !== 1 ? 's' : ''} across your workspace
                </p>

                <div style={{ display: 'flex', gap: '36px', marginTop: '24px' }}>
                  <div className="mini-stat">
                    <div className="mini-stat-value">{teams.length}</div>
                    <div className="mini-stat-label">Teams</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-value">{totalMembers}</div>
                    <div className="mini-stat-label">Members</div>
                  </div>
                  <div className="mini-stat">
                    <div className="mini-stat-value">{ownerCount}</div>
                    <div className="mini-stat-label">Owner</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {teams.map((team, index) => {
                const role = getMyRole(team);

                return (
                  <div
                    key={team._id}
                    className="card card-hover"
                    onClick={() => navigate(`/team/${team._id}/board`)}
                    style={{
                      padding: '22px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '16px',
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          width: '56px',
                          height: '56px',
                          flexShrink: 0,
                          borderRadius: 'var(--r-lg)',
                          background: avatarGradient(team.name),
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '24px',
                          fontWeight: 800,
                          boxShadow: 'var(--sh-md)',
                        }}
                      >
                        {team.name[0].toUpperCase()}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '5px',
                          }}
                        >
                          <h3 className="truncate" style={{ fontSize: '17px' }}>
                            {team.name}
                          </h3>
                          <span
                            className="badge"
                            style={{
                              background:
                                role === 'owner' ? 'var(--warning-bg)' : 'var(--success-bg)',
                              color:
                                role === 'owner'
                                  ? 'var(--warning-text)'
                                  : 'var(--success-text)',
                              flexShrink: 0,
                            }}
                          >
                            {role}
                          </span>
                        </div>

                        <p
                          className="truncate"
                          style={{
                            color: 'var(--text-muted)',
                            fontSize: '13px',
                            maxWidth: '600px',
                          }}
                        >
                          {team.description || 'Your collaborative workspace'}
                        </p>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '18px',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                        <div style={{ display: 'flex' }}>
                          {team.members.slice(0, 3).map((m, i) => (
                            <span
                              key={m.user._id}
                              className="avatar"
                              title={m.user.name}
                              style={{
                                width: '28px',
                                height: '28px',
                                fontSize: '11px',
                                marginLeft: i === 0 ? 0 : -9,
                                boxShadow: '0 0 0 2px var(--surface)',
                                background: avatarGradient(m.user.name),
                              }}
                            >
                              {m.user.name?.[0]?.toUpperCase()}
                            </span>
                          ))}
                        </div>

                        <span
                          style={{
                            fontSize: '12px',
                            color: 'var(--text-muted)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      {role === 'owner' && (
                        <button
                          className="btn btn-secondary btn-sm row-edit"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingTeam(team);
                          }}
                          style={{ fontSize: '12px', padding: '6px 13px' }}
                        >
                          Edit
                        </button>
                      )}

                      <span
                        className="row-arrow"
                        style={{ color: 'var(--text-faint)' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className="card card-hover"
              onClick={() => setShowCreate(true)}
              style={{
                width: '100%',
                marginTop: '14px',
                padding: '20px',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: 550,
                boxShadow: 'none',
                border: '1px dashed var(--border-strong)',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'var(--primary-softer)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-strong)';
                e.currentTarget.style.color = 'var(--text-muted)';
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Create another workspace
            </button>
          </>
        )}
      </div>

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onTeamCreated={handleTeamCreated}
        />
      )}

      {showJoin && (
        <JoinTeamModal onClose={() => setShowJoin(false)} onTeamJoined={handleTeamJoined} />
      )}

      {editingTeam && (
        <EditTeamModal
          team={editingTeam}
          onClose={() => setEditingTeam(null)}
          onTeamUpdated={(updatedTeam) => {
            setTeams((prev) =>
              prev.map((team) =>
                team._id === updatedTeam._id
                  ? { ...team, name: updatedTeam.name, description: updatedTeam.description }
                  : team
              )
            );
            setEditingTeam(null);
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
