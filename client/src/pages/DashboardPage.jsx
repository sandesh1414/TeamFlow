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

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="My Teams" subtitle="Pick a workspace to dive in">
        <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(true)}>
          Join Team
        </button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>
          + Create Team
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
                fontSize: '34px',
                margin: '0 auto 24px',
              }}
            >
              🚀
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
                + Create Team
              </button>
              <button className="btn btn-secondary btn-lg" onClick={() => setShowJoin(true)}>
                Join with code
              </button>
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginBottom: '22px',
              }}
            >
              <div>
                <h2 style={{ fontSize: '22px', margin: '0 0 4px', letterSpacing: '-0.025em' }}>
                  Your Workspaces
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', margin: 0 }}>
                  {teams.length} workspace{teams.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {teams.map((team, index) => {
                const role = getMyRole(team);

                return (
                  <div
                    key={team._id}
                    className="card card-hover slide-up"
                    onClick={() => navigate(`/team/${team._id}`)}
                    style={{
                      padding: '22px 24px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px',
                      animationDelay: `${Math.min(index, 6) * 50}ms`,
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
                          <h3 className="truncate" style={{ fontSize: '17px', margin: 0 }}>
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
                            margin: 0,
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
                        style={{ fontSize: '19px', color: 'var(--text-faint)', fontWeight: 300 }}
                      >
                        →
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
              + Create another workspace
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
