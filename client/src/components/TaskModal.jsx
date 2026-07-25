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

  // Auto priority suggestion with debounce
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

  // Reset when title is cleared
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
  const handleAssignSplitTask = async (taskId, userId) => {
  if (!userId) return; // unassigned — nothing to do
  try {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };
    await axios.put(`/api/tasks/${taskId}`, { assignedTo: userId }, config);

    // Update the task in local state so the board reflects it
    // We call onTaskCreated with the updated task
    // But since it's already created, we need to update it
    // The board will reflect this on next load — or we can notify parent
  } catch (err) {
    console.error('Failed to assign task:', err);
  }
};
const handleDoneAssigning = async () => {
  try {
    const config = { headers: { Authorization: `Bearer ${user.token}` } };

    // Send all assignments in parallel
    const updates = Object.entries(splitAssignments)
      .filter(([taskId, userId]) => userId) // skip unassigned
      .map(([taskId, userId]) =>
        axios.put(`/api/tasks/${taskId}`, { assignedTo: userId }, config)
          .then(res => onTaskUpdated(res.data))
      );

    await Promise.all(updates);
  } catch (err) {
    console.error('Failed to assign tasks:', err);
  } finally {
    onClose();
  }
};

  const inputStyle = { display: 'block', width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '28px', borderRadius: '14px', width: '480px', maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '6px' }}>Create Task</h2>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: '20px' }}>Fill the form manually, or let AI split it into subtasks.</p>
        {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{error}</p>}

        {splitResult ? (
  <div style={{ background: '#f5f3ff', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px' }}>✨</span>
      <strong style={{ fontSize: '14px', color: '#6c63ff' }}>
        AI created {splitResult.tasks.length} subtasks — assign them below
      </strong>
    </div>

    {splitResult.tasks.map((task, idx) => (
      <div key={task._id} style={{ background: 'white', borderRadius: '8px', padding: '12px', marginBottom: '8px', borderLeft: '3px solid #a78bfa' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '600', flex: 1 }}>
            {task.title}
          </span>
          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', background: '#e8f5e9', color: '#2e7d32', fontWeight: '600', marginLeft: '8px' }}>
            {splitResult.aiSuggestions[idx]?.priority}
          </span>
        </div>

        {/* Assign dropdown for each subtask */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}>Assign to:</label>
          <select
  defaultValue=""
  onChange={(e) => setSplitAssignments(prev => ({
    ...prev,
    [task._id]: e.target.value
  }))}
  style={{ flex: 1, padding: '5px 8px', borderRadius: '6px', border: '1px solid #ddd', fontSize: '13px' }}
>
  <option value="">Unassigned</option>
  {members.map((m) => (
    <option key={m.user._id} value={m.user._id}>
      {m.user.name}
    </option>
  ))}
</select>
        </div>
      </div>
    ))}

   <button
  onClick={handleDoneAssigning}
  style={{ marginTop: '14px', width: '100%', padding: '10px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
>
  Done
</button>
  </div>
) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Build authentication system" required style={inputStyle} />
            </div>

            <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf4ff)', border: '1px dashed #c4b5fd', borderRadius: '10px', padding: '14px', marginBottom: '16px', textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#7c3aed', margin: '0 0 10px' }}>✨ Let AI split this into subtasks automatically</p>
              <button type="button" onClick={handleSplitWithAI} disabled={splitting || !title.trim()} style={{ padding: '8px 20px', background: splitting || !title.trim() ? '#e0e0e0' : 'linear-gradient(135deg, #6c63ff, #a855f7)', color: splitting || !title.trim() ? '#999' : 'white', border: 'none', borderRadius: '20px', cursor: splitting || !title.trim() ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px' }}>
                {splitting ? '✨ Splitting...' : '✨ Split with AI'}
              </button>
              <p style={{ fontSize: '11px', color: '#9ca3af', margin: '8px 0 0' }}>Creates 5–6 subtasks from your title</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
              <span style={{ fontSize: '12px', color: '#999' }}>or fill manually</span>
              <div style={{ flex: 1, height: '1px', background: '#e0e0e0' }} />
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600' }}>Assign To</label>
                <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={inputStyle}>
                  <option value="">Unassigned</option>
                  {members.map((m) => <option key={m.user._id} value={m.user._id}>{m.user.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Priority
                  {aiPriorityLoading && <span style={{ fontSize: '11px', color: '#a855f7' }}>✨ thinking...</span>}
                  {prioritySetByAI && !aiPriorityLoading && <span style={{ fontSize: '11px', color: '#a855f7' }}>✨ suggested</span>}
                </label>
                <select value={priority} onChange={(e) => { setPriority(e.target.value); setPrioritySetByAI(false); }} style={{ ...inputStyle, border: prioritySetByAI ? '1.5px solid #a855f7' : '1px solid #ddd', transition: 'border-color 0.3s' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={inputStyle} />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" style={{ flex: 1, padding: '10px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Create Task</button>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
            </div>
          </form>
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

export default TaskModal;
