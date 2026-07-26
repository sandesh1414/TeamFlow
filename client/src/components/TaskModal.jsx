import { useState, useEffect, useRef } from 'react';
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
  }, [title, description]);

  useEffect(() => {
    if (!title.trim()) { setPrioritySetByAI(false); setPriority('medium'); }
  }, [title]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/tasks/${teamId}`, { title, description, assignedTo: assignedTo || null, dueDate: dueDate || null, priority }, config);
      onTaskCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task');
    }
  };

  const handleSplitWithAI = async () => {
    if (!title.trim()) { alert('Please enter a task title first.'); return; }
    setSplitting(true);
    setSplitResult(null);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post(`/api/ai/split/${teamId}`, { taskTitle: title }, config);
      setSplitResult(data);
      data.tasks.forEach((task) => onTaskCreated(task));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to split task. Please try again.');
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

  const inputStyle = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <h2 style={{ fontSize: '20px' }}>Create Task</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '22px' }}>Fill the form manually, or let AI split it into subtasks.</p>
        {error && <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        {splitResult ? (
          <div style={{ background: 'var(--ai-soft)', border: '1px solid var(--ai-softer)', borderRadius: 'var(--r-md)', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <strong style={{ fontSize: '14px', color: 'var(--ai-text)' }}>
                AI created {splitResult.tasks.length} subtasks — assign them below
              </strong>
            </div>

            {splitResult.tasks.map((task, idx) => (
              <div key={task._id} style={{ background: 'var(--surface)', borderRadius: 'var(--r-md)', padding: '12px', marginBottom: '8px', borderLeft: '3px solid var(--ai)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', flex: 1 }}>{task.title}</span>
                  <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', marginLeft: '8px' }}>
                    {splitResult.aiSuggestions[idx]?.priority}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted)', flexShrink: 0 }}>Assign to:</label>
                  <select
                    defaultValue=""
                    onChange={(e) => setSplitAssignments((prev) => ({ ...prev, [task._id]: e.target.value }))}
                    className="field"
                    style={{ flex: 1, padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <button onClick={handleDoneAssigning} className="btn btn-primary btn-block" style={{ marginTop: '14px' }}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build authentication system" required className="field" style={inputStyle} />
            </div>

            <div style={{ background: 'var(--ai-soft)', border: '1px dashed var(--ai)', borderRadius: 'var(--r-md)', padding: '16px', marginBottom: '18px', textAlign: 'center' }}>
              <p style={{ fontSize: '12.5px', color: 'var(--ai-text)', margin: '0 0 10px', fontWeight: 600 }}>✨ Let AI split this into subtasks automatically</p>
              <button type="button" onClick={handleSplitWithAI} disabled={splitting || !title.trim()} className="btn btn-ai" style={{ padding: '9px 22px', fontSize: '13px' }}>
                {splitting ? '✨ Splitting…' : '✨ Split with AI'}
              </button>
              <p style={{ fontSize: '11px', color: 'var(--text-faint)', margin: '8px 0 0' }}>Creates 5–6 subtasks from your title</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>or fill manually</span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label className="label">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field" style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
              <div>
                <label className="label">Assign To</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="field" style={inputStyle}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Priority
                  {aiPriorityLoading && <span style={{ fontSize: '11px', color: 'var(--ai)' }}>✨ thinking…</span>}
                  {prioritySetByAI && !aiPriorityLoading && <span style={{ fontSize: '11px', color: 'var(--ai)' }}>✨ suggested</span>}
                </label>
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPrioritySetByAI(false); }}
                  className="field"
                  style={{ ...inputStyle, border: prioritySetByAI ? '1.5px solid var(--ai)' : '1px solid var(--border)' }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label className="label">Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="field" style={inputStyle} />
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
