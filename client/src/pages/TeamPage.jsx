import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import ChatRoom from '../components/ChatRoom';
import NotificationBell from '../components/NotificationBell';

const TeamPage = () => {
  const { teamId } = useParams();
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
const activeTab = searchParams.get('tab') || 'kanban';
  const { user } = useAuth();
  const navigate = useNavigate();
  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teamsRes, tasksRes] = await Promise.all([
          axios.get('/api/teams/mine', config),
          axios.get(`/api/tasks/${teamId}`, config),
        ]);
        const thisTeam = teamsRes.data.find((t) => t._id.toString() === teamId.toString());
        setTeam(thisTeam);
        setTasks(tasksRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [teamId]);

  if (loading) return <p style={{ padding: '40px' }}>Loading board...</p>;
  if (!team) return <p style={{ padding: '40px' }}>Team not found.</p>;

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button onClick={() => navigate('/dashboard')} style={{ background: 'none', border: 'none', fontSize: '22px', cursor: 'pointer', color: '#666' }}>←</button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '22px' }}>{team.name}</h1>
          <p style={{ margin: '2px 0 0', color: '#999', fontSize: '13px' }}>
            {team.members.length} members · Invite code: <strong style={{ letterSpacing: '1px' }}>{team.inviteCode}</strong>
          </p>
        </div>
        <NotificationBell />
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f0f0f0', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {['kanban', 'chat'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSearchParams({ tab })}
            style={{
              padding: '8px 20px', border: 'none', borderRadius: '8px', cursor: 'pointer',
              fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
              background: activeTab === tab ? 'white' : 'transparent',
              color: activeTab === tab ? '#6c63ff' : '#999',
              boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {tab === 'kanban' ? '📋 Board' : '💬 Chat'}
          </button>
        ))}
      </div>

      {activeTab === 'kanban' ? (
        <KanbanBoard tasks={tasks} setTasks={setTasks} teamId={teamId} members={team.members} />
      ) : (
        <ChatRoom teamId={teamId} />
      )}
    </div>
  );
};

export default TeamPage;
