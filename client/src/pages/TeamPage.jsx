import React, { useState, useEffect } from 'react';
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
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'var(--inset)', margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-faint)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
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
  const inProgressCount = tasks.filter((t) => t.status === 'inprogress').length;
  const doneCount = tasks.filter((t) => t.status === 'done').length;
  const completionPct = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Back
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
          <div className="card stat-card slide-up">
            <div className="stat-icon" style={{ background: 'var(--warning-bg)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            </div>
            <div>
              <div className="stat-value">{inProgressCount}</div>
              <div className="stat-label">In Progress</div>
            </div>
          </div>

          <div className="card stat-card slide-up" style={{ animationDelay: '60ms' }}>
            <div className="stat-icon" style={{ background: 'var(--success-bg)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div>
              <div className="stat-value">{doneCount}</div>
              <div className="stat-label">Completed</div>
            </div>
          </div>

          <div className="card stat-card slide-up" style={{ animationDelay: '120ms' }}>
            <div className="stat-icon" style={{ background: 'var(--primary-soft)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div>
              <div className="stat-value">{team.members.length}</div>
              <div className="stat-label">Members</div>
            </div>
          </div>

          {/* Completion progress card */}
          <div className="card stat-card slide-up" style={{ animationDelay: '180ms', flex: '2 1 240px' }}>
            <div className="stat-icon" style={{ background: 'var(--ai-soft)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ai)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div className="stat-value">{completionPct}%</div>
                <div className="stat-label" style={{ marginTop: 0 }}>Complete</div>
              </div>
              <div className="progress-track" style={{ marginTop: '8px' }}>
                <div
                  className="progress-fill"
                  style={{ width: `${completionPct}%` }}
                />
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
            Board
          </button>
          <button
            className={`tab ${activeTab === 'chat' ? 'active' : ''}`}
            onClick={() => setSearchParams({ tab: 'chat' })}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            Chat
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
