import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateTeamModal from '../components/CreateTeamModal';
import JoinTeamModal from '../components/JoinTeamModal';
import TopBar from '../components/TopBar';

const DashboardPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { fetchMyTeams(); }, []);

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

  const handleTeamCreated = (newTeam) => setTeams((prev) => [newTeam, ...prev]);
  const handleTeamJoined = (joinedTeam) => setTeams((prev) => [joinedTeam, ...prev]);

  const getMyRole = (team) => {
    const member = team.members.find(
      (m) => m.user._id === user._id || m.user._id?.toString() === user._id?.toString()
    );
    return member?.role || 'member';
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar title="My Teams" subtitle="Pick a workspace to dive in">
        <button className="btn btn-secondary btn-sm" onClick={() => setShowJoin(true)}>Join Team</button>
        <button className="btn btn-primary btn-sm" onClick={() => setShowCreate(true)}>+ Create Team</button>
      </TopBar>

      <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '34px 32px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ height: '200px', background: 'var(--inset)', animation: 'fadeIn 1.2s ease-in-out infinite alternate' }} />
            ))}
          </div>
        ) : teams.length === 0 ? (
          <div className="card slide-up" style={{ textAlign: 'center', padding: '72px 40px', maxWidth: '560px', margin: '0 auto', border: '1px dashed var(--border)' }}>
            <div style={{ width: '76px', height: '76px', borderRadius: '20px', background: 'linear-gradient(135deg, var(--primary-soft), var(--ai-soft))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '34px', margin: '0 auto 22px' }}>🚀</div>
            <h2 style={{ fontSize: '22px', marginBottom: '8px' }}>Start your first team</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '26px', maxWidth: '380px', margin: '0 auto 26px' }}>
              Create a workspace for your crew or hop into one with an invite code from a teammate.
            </p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Team</button>
              <button className="btn btn-secondary" onClick={() => setShowJoin(true)}>Join with code</button>
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>{teams.length} workspace{teams.length !== 1 ? 's' : ''}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {teams.map((team) => (
                <div
                  key={team._id}
                  onClick={() => navigate(`/team/${team._id}`)}
                  className="card card-hover slide-up"
                  style={{ padding: '22px', cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ width: '46px', height: '46px', borderRadius: '13px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 800, boxShadow: 'var(--sh-glow)' }}>
                      {team.name[0].toUpperCase()}
                    </div>
                    <span className="badge" style={{ background: getMyRole(team) === 'owner' ? 'var(--warning-bg)' : 'var(--success-bg)', color: getMyRole(team) === 'owner' ? 'var(--warning-text)' : 'var(--success-text)' }}>
                      {getMyRole(team)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: '16px', marginBottom: '4px' }}>{team.name}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '38px' }}>{team.description || 'No description yet'}</p>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '14px', borderTop: '1px solid var(--border-soft)' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{ display: 'flex' }}>
                        {team.members.slice(0, 3).map((m, i) => (
                          <span
                            key={m.user._id}
                            className="avatar"
                            title={m.user.name}
                            style={{ width: '26px', height: '26px', fontSize: '10.5px', marginLeft: i === 0 ? 0 : -8, border: '2px solid var(--surface)', background: 'linear-gradient(135deg, var(--primary), #3b82f6)' }}
                          >
                            {m.user.name?.[0]?.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        {team.members.length} member{team.members.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    {getMyRole(team) === 'owner' && (
                      <span style={{ fontSize: '11px', color: 'var(--text-faint)', fontWeight: 600, letterSpacing: '0.06em' }}>{team.inviteCode}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} onTeamCreated={handleTeamCreated} />}
      {showJoin && <JoinTeamModal onClose={() => setShowJoin(false)} onTeamJoined={handleTeamJoined} />}
    </div>
  );
};

export default DashboardPage;
