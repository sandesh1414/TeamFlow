import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import KanbanBoard from '../components/KanbanBoard';
import ChatRoom from '../components/ChatRoom';
import TopBar from '../components/TopBar';
import { getSocket } from '../socket';

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
useEffect(() => {
  const socket = getSocket(user.token);

  socket.emit('join_room', { teamId });

  socket.on('task_created', (task) => {
    setTasks((prev) => [task, ...prev]);
  });

  socket.on('task_updated', (updatedTask) => {
    setTasks((prev) =>
      prev.map((t) =>
        t._id === updatedTask._id ? updatedTask : t
      )
    );
  });

  socket.on('task_deleted', ({ taskId }) => {
    setTasks((prev) =>
      prev.filter((t) => t._id !== taskId)
    );
  });

  return () => {
    socket.off('task_created');
    socket.off('task_updated');
    socket.off('task_deleted');
  };
}, [teamId, user.token]);

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading board…</div>;
  if (!team) return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Team not found.</div>;
  const myRole = team?.members.find(
  (m) => m.user._id?.toString() === user._id?.toString()
)?.role || 'member';

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar
        title={team.name}
        subtitle={`${team.members.length} members · Invite code ${team.inviteCode}`}
      >
        <button className="btn-icon" onClick={() => navigate('/dashboard')} aria-label="Back" style={{ fontSize: '18px' }}>←</button>
      </TopBar>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 32px' }}>
        <div className="tabs" style={{ marginBottom: '22px' }}>
          <button className={`tab ${activeTab === 'kanban' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'kanban' })}> Board</button>
          <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setSearchParams({ tab: 'chat' })}> Chat</button>
        </div>

        {activeTab === 'kanban' ? (
         <KanbanBoard
  tasks={tasks}
  setTasks={setTasks}
  teamId={teamId}
  members={team.members}
  myRole={myRole}
/>
        ) : (
          <ChatRoom teamId={teamId} />
        )}
      </div>
    </div>
  );
};

export default TeamPage;
