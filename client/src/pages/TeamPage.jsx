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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => {
    const socket = getSocket(user.token);
    socket.emit('join_room', { teamId });

    socket.on('task_created', (task) => {
      setTasks((prev) => {
        if (prev.some((t) => t._id === task._id)) return prev;
        return [task, ...prev];
      });
    });

    socket.on('task_updated', (updatedTask) => {
      setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    });

    socket.on('task_deleted', ({ taskId }) => {
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    });

    return () => {
      socket.off('task_created');
      socket.off('task_updated');
      socket.off('task_deleted');
    };
  }, [teamId, user.token]);

  if (loading)
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar title="Loading…" />
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 32px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton" style={{ height: '120px' }} />
            ))}
          </div>
        </div>
      </div>
    );

  if (!team)
    return (
      <div style={{ minHeight: '100vh' }}>
        <TopBar title="Team not found" />
        <div
          style={{
            maxWidth: '500px',
            margin: '80px auto',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '14px' }}>🔍</div>
          <p>We couldn't find this team. It may have been removed.</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: '18px' }}
            onClick={() => navigate('/dashboard')}
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );

  const myRole =
    team?.members.find((m) => m.user._id?.toString() === user._id?.toString())?.role ||
    'member';

  const taskCount = tasks.length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopBar
        title={team.name}
        subtitle={`${team.members.length} members · Invite code ${team.inviteCode}`}
      >
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/dashboard')}
        >
          ← Back
        </button>
      </TopBar>

      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 32px' }}>
        {/* Stats bar */}
        <div
          className="stagger"
          style={{
            display: 'flex',
            gap: '16px',
            marginBottom: '28px',
            flexWrap: 'wrap',
          }}
        >
          <div
            className="card slide-up"
            style={{
              padding: '18px 22px',
              flex: '1 1 auto',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--r-md)',
                background: 'var(--primary-soft)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M3 10h18M8 2v4M16 2v4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {taskCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Total tasks
              </div>
            </div>
          </div>

          <div
            className="card slide-up"
            style={{
              padding: '18px 22px',
              flex: '1 1 auto',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              animationDelay: '60ms',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--r-md)',
                background: 'var(--success-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {doneCount}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Completed
              </div>
            </div>
          </div>

          <div
            className="card slide-up"
            style={{
              padding: '18px 22px',
              flex: '1 1 auto',
              minWidth: '140px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              animationDelay: '120ms',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--r-md)',
                background: 'var(--warning-bg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
                {team.members.length}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>
                Members
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: '24px' }}>
          <button
            className={`tab ${activeTab === 'kanban' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'kanban' })}
          >
            ▦ Board
          </button>
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'chat' })}
          >
            💬 Chat
          </button>
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
