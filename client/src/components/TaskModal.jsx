import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TaskModal = ({ teamId, members, onClose, onTaskCreated }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [error, setError] = useState('');
  const [splitting, setSplitting] = useState(false);
  const [splitResult, setSplitResult] = useState(null);
  const [aiPriorityLoading, setAiPriorityLoading] = useState(false);
  const [prioritySetByAI, setPrioritySetByAI] = useState(false);
  const [splitAssignments, setSplitAssignments] = useState({});
  const debounceTimer = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!title.trim() || title.trim().length < 5) return;
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(async () => {
      setAiPriorityLoading(true);
      try {
        const config = { headers: { Authorization: `Bearer ${user.token}` } };
        const { data } = await axios.post('/api/ai/priority', { title, description }, config);
        setPriority(data.priority);
        setPrioritySetByAI(true);
      } catch (err) {
        console.error('Priority suggestion failed silently:', err);
      } finally {
        setAiPriorityLoading(false);
      }
    }, 800);
    return () => clearTimeout(debounceTimer.current);
  }, [title, description, user.token]);

  useEffect(() => {
    if (!title.trim()) {
      setPrioritySetByAI(false);
      setPriority('medium');
    }
  }, [title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Task title is required'); return; }
    if (title.trim().length < 2) { setError('Title must be at least 2 characters'); return; }
    if (title.trim().length > 100) { setError('Title is too long (max 100 characters)'); return; }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(
        `/api/tasks/${teamId}`,
        { title, description, assignedTo: assignedTo || null, dueDate: dueDate || null, priority },
        config
      );
      onTaskCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleSplitWithAI = async () => {
    if (!title.trim()) { setError('Please enter a task title first.'); return; }
    setSplitting(true);
    setSplitResult(null);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/ai/split/${teamId}`, { taskTitle: title }, config);
      setSplitResult(data);
      data.tasks.forEach((task) => onTaskCreated(task));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to split task. Please try again.');
    } finally {
      setSplitting(false);
    }
  };

  const handleDoneAssigning = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const updates = Object.entries(splitAssignments)
        .filter(([taskId, userId]) => userId)
        .map(([taskId, userId]) => axios.put(`/api/tasks/${taskId}`, { assignedTo: userId }, config));
      await Promise.all(updates);
    } catch (err) {
      console.error('Failed to assign tasks:', err);
    } finally {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal slide-up"
        style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto', padding: '28px' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Create Task</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Fill the form manually, or let AI split it into subtasks.
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        {error && (
          <div
            className="slide-down"
            style={{
              color: 'var(--error-text)', background: 'var(--error-bg)',
              border: '1px solid #fecaca', padding: '11px 15px',
              borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        {splitResult ? (
          <div style={{ background: 'var(--ai-soft)', border: '1px solid var(--ai-softer)', borderRadius: 'var(--r-lg)', padding: '20px', marginTop: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <span className="icon-wrap" style={{ color: 'var(--ai)' }}><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6L20 9.5 13.5 12 12 18l-1.5-6L4 9.5 10.5 8z"/></svg></span>
              <strong style={{ fontSize: '14px', color: 'var(--ai-text)' }}>
                AI created {splitResult.tasks.length} subtasks
              </strong>
            </div>

            {splitResult.tasks.map((task, idx) => (
              <div
                key={task._id}
                className="slide-up"
                style={{
                  background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '14px',
                  marginBottom: '10px', borderLeft: '3px solid var(--ai)',
                  boxShadow: 'var(--sh-xs)',
                  animationDelay: `${idx * 60}ms`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{task.title}</span>
                  <span
                    className="badge"
                    style={{ background: 'var(--success-bg)', color: 'var(--success-text)', marginLeft: '8px', textTransform: 'capitalize' }}
                  >
                    {splitResult.aiSuggestions[idx]?.priority || 'medium'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0, fontWeight: 500 }}>Assign to:</label>
                  <select
                    defaultValue=""
                    onChange={(e) => setSplitAssignments((prev) => ({ ...prev, [task._id]: e.target.value }))}
                    className="field"
                    style={{ padding: '6px 10px', fontSize: '13px', flex: 1 }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <button onClick={handleDoneAssigning} className="btn btn-primary btn-block" style={{ marginTop: '16px' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div style={{ marginBottom: '18px' }}>
              <label className="label">Title <span style={{ color: 'var(--error-text)' }}>*</span></label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Build authentication system"
                required
                maxLength={100}
                className="field"
              />
              <div style={{ fontSize: '11px', color: title.length > 90 ? 'var(--error-text)' : 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
                {title.length}/100
              </div>
            </div>

            {/* AI Split box */}
            <div
              style={{
                background: 'var(--ai-soft)', border: '1px dashed var(--ai)',
                borderRadius: 'var(--r-lg)', padding: '18px', marginBottom: '20px', textAlign: 'center',
              }}
            >
              <p style={{ fontSize: '13px', color: 'var(--ai-text)', margin: '0 0 12px', fontWeight: 600 }}>
                Let AI split this into subtasks automatically
              </p>
              <button
                type="button"
                onClick={handleSplitWithAI}
                disabled={splitting || !title.trim()}
                className="btn btn-ai"
              >
                {splitting ? (
                  <>
                    <span className="spin" style={{ display: 'inline-block', width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Splitting…
                  </>
                ) : 'Split with AI'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '10px 0 0' }}>
                Creates 5–6 subtasks from your title
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                or fill manually
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label className="label">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                className="field"
                style={{ minHeight: '84px', resize: 'vertical' }}
              />
              <div style={{ fontSize: '11px', color: description.length > 900 ? 'var(--error-text)' : 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
                {description.length}/1000
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label className="label">Assign To</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="field">
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  <span>Priority</span>
                  {aiPriorityLoading && <span style={{ fontSize: '11px', color: 'var(--ai)', fontWeight: 400, marginLeft: '6px' }}>thinking…</span>}
                  {prioritySetByAI && !aiPriorityLoading && <span style={{ fontSize: '11px', color: 'var(--ai)', fontWeight: 400, marginLeft: '6px' }}>AI suggested</span>}
                </label>
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPrioritySetByAI(false); }}
                  className="field"
                  style={prioritySetByAI ? { borderColor: 'var(--ai)', background: 'var(--ai-soft)' } : undefined}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label className="label">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Create Task</button>
              <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TaskModal;
