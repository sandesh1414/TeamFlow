import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateTeamModal from '../components/CreateTeamModal';
import JoinTeamModal from '../components/JoinTeamModal';
import NotificationBell from '../components/NotificationBell';

const DashboardPage = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const { user, logout } = useAuth();
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

  if (loading) return <p style={{ padding: '40px' }}>Loading your teams...</p>;

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '26px' }}>My Teams</h1>
          <p style={{ color: '#666', margin: '4px 0 0', fontSize: '14px' }}>Welcome back, {user.name}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <NotificationBell />
          <button onClick={() => setShowCreate(true)} style={{ padding: '10px 18px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            + Create Team
          </button>
          <button onClick={() => setShowJoin(true)} style={{ padding: '10px 18px', border: '2px solid #6c63ff', background: 'white', color: '#6c63ff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
            Join Team
          </button>
          <button onClick={logout} style={{ padding: '10px 18px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {teams.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px', color: '#bbb' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
          <p style={{ fontSize: '18px', fontWeight: '600', color: '#666' }}>No teams yet</p>
          <p>Create one or ask a teammate for an invite code.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {teams.map((team) => (
            <div
              key={team._id}
              onClick={() => navigate(`/team/${team._id}`)}
              style={{ border: '1px solid #e0e0e0', borderRadius: '14px', padding: '20px', cursor: 'pointer', transition: 'all 0.2s', background: 'white' }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#6c63ff', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', marginBottom: '12px' }}>
                {team.name[0].toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: '16px' }}>{team.name}</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: '0 0 14px' }}>{team.description || 'No description'}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#999' }}>{team.members.length} member{team.members.length !== 1 ? 's' : ''}</span>
                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '20px', background: getMyRole(team) === 'owner' ? '#fff3e0' : '#e8f5e9', color: getMyRole(team) === 'owner' ? '#e65100' : '#2e7d32', fontWeight: '600' }}>
                  {getMyRole(team)}
                </span>
              </div>
              {getMyRole(team) === 'owner' && (
                <div style={{ marginTop: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '6px', fontSize: '12px' }}>
                  Invite code: <strong style={{ letterSpacing: '2px' }}>{team.inviteCode}</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateTeamModal onClose={() => setShowCreate(false)} onTeamCreated={handleTeamCreated} />}
      {showJoin && <JoinTeamModal onClose={() => setShowJoin(false)} onTeamJoined={handleTeamJoined} />}
    </div>
  );
};

export default DashboardPage;
