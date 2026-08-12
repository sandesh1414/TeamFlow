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
    if (!title.trim()) {
      alert('Please enter a task title first.');
      return;
    }
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

  // Unified, bulletproof styles for consistent alignment
  const styles = {
    label: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: '13px',
      fontWeight: '600',
      color: 'var(--text, #334155)',
      marginBottom: '6px',
    },
    input: {
      display: 'block',
      width: '100%',
      padding: '10px 12px',
      borderRadius: '8px',
      border: '1px solid var(--border, #cbd5e1)',
      fontSize: '14px',
      color: 'var(--text, #0f172a)',
      backgroundColor: 'var(--surface, #ffffff)',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'border-color 0.15s ease',
    },
    fieldGroup: {
      marginBottom: '18px',
    },
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ padding: '16px', boxSizing: 'border-box' }}>
      <div
        className="modal slide-up"
        style={{
          width: '100%',
          maxWidth: '520px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: '12px',
          backgroundColor: 'var(--bg, #ffffff)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', margin: 0, color: 'var(--text, #0f172a)' }}>Create Task</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-muted, #64748b)', padding: '4px' }}
          >
            ✕
          </button>
        </div>
        <p style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)', margin: '0 0 20px 0' }}>
          Fill the form manually, or let AI split it into subtasks.
        </p>

        {error && (
          <div style={{ color: '#991b1b', background: '#fef2f2', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '18px' }}>
            {error}
          </div>
        )}

        {splitResult ? (
          /* AI Subtask Assignment View */
          <div style={{ background: 'var(--ai-soft, #f0fdfa)', border: '1px solid var(--ai-softer, #ccfbf1)', borderRadius: '10px', padding: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>✨</span>
              <strong style={{ fontSize: '14px', color: 'var(--ai-text, #0f766e)' }}>
                AI created {splitResult.tasks.length} subtasks — assign them below
              </strong>
            </div>

            {splitResult.tasks.map((task, idx) => (
              <div key={task._id} style={{ background: 'var(--surface, #ffffff)', borderRadius: '8px', padding: '12px', marginBottom: '10px', borderLeft: '3px solid #0d9488', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text, #0f172a)', flex: 1 }}>{task.title}</span>
                  <span style={{ background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', marginLeft: '8px', textTransform: 'capitalize' }}>
                    {splitResult.aiSuggestions[idx]?.priority || 'medium'}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <label style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', flexShrink: 0, fontWeight: '500' }}>Assign to:</label>
                  <select
                    defaultValue=""
                    onChange={(e) => setSplitAssignments((prev) => ({ ...prev, [task._id]: e.target.value }))}
                    style={{ ...styles.input, padding: '6px 10px', fontSize: '13px' }}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            ))}

            <button
              onClick={handleDoneAssigning}
              style={{ width: '100%', padding: '10px', marginTop: '14px', borderRadius: '8px', background: '#0f172a', color: '#fff', fontWeight: '600', border: 'none', cursor: 'pointer' }}
            >
              Done
            </button>
          </div>
        ) : (
          /* Manual / AI Input Form */
          <form onSubmit={handleSubmit}>
            {/* Title Field */}
            <div style={styles.fieldGroup}>
  <label style={styles.label}>Title *</label>

  <input
    value={title}
    onChange={(e) => setTitle(e.target.value)}
    placeholder="e.g. Build authentication system"
    required
    maxLength={100}
    style={styles.input}
  />

  <div
    style={{
      fontSize: '11px',
      color: title.length > 90 ? '#e53935' : '#bbb',
      textAlign: 'right',
      marginTop: '3px',
    }}
  >
    {title.length}/100
  </div>
</div>

            {/* AI Action Box with Fixed Contrast */}
            <div style={{ background: 'var(--ai-soft, #f0fdfa)', border: '1px dashed #0d9488', borderRadius: '10px', padding: '16px', marginBottom: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '13px', color: '#0f766e', margin: '0 0 12px', fontWeight: '600' }}>
                ✨ Let AI split this into subtasks automatically
              </p>
              <button
                type="button"
                onClick={handleSplitWithAI}
                disabled={splitting || !title.trim()}
                style={{
                  padding: '9px 20px',
                  fontSize: '13px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #0d9488 0%, #0284c7 100%)',
                  color: '#ffffff',
                  cursor: splitting || !title.trim() ? 'not-allowed' : 'pointer',
                  opacity: splitting || !title.trim() ? 0.6 : 1,
                  boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)',
                  transition: 'opacity 0.2s ease',
                }}
              >
                {splitting ? '✨ Splitting…' : '✨ Split with AI'}
              </button>
              <p style={{ fontSize: '11px', color: '#64748b', margin: '8px 0 0' }}>
                Creates 5–6 subtasks from your title
              </p>
            </div>

            {/* Styled Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
              <div style={{ flex: 1, height: '1px', background: 'var(--border, #e2e8f0)' }} />
              <span style={{ fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                or fill manually
              </span>
              <div style={{ flex: 1, height: '1px', background: 'var(--border, #e2e8f0)' }} />
            </div>

            {/* Description Field */}
            <div style={styles.fieldGroup}>
  <label style={styles.label}>Description</label>

  <textarea
    value={description}
    onChange={(e) => setDescription(e.target.value)}
    maxLength={1000}
    style={{
      ...styles.input,
      minHeight: '80px',
      resize: 'vertical',
    }}
  />

  <div
    style={{
      fontSize: '11px',
      color: description.length > 900 ? '#e53935' : '#bbb',
      textAlign: 'right',
      marginTop: '3px',
    }}
  >
    {description.length}/1000
  </div>
</div>

            {/* 2-Column Grid: Assign To & Priority */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
              <div>
                <label style={styles.label}>Assign To</label>
                <select
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  style={styles.input}
                >
                  <option value="">Unassigned</option>
                  {members.map((m) => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={styles.label}>
                  <span>Priority</span>
                  {aiPriorityLoading && <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'normal' }}>✨ thinking…</span>}
                  {prioritySetByAI && !aiPriorityLoading && <span style={{ fontSize: '11px', color: '#0d9488', fontWeight: 'normal' }}>✨ suggested</span>}
                </label>
                <select
                  value={priority}
                  onChange={(e) => { setPriority(e.target.value); setPrioritySetByAI(false); }}
                  style={{
                    ...styles.input,
                    borderColor: prioritySetByAI ? '#0d9488' : 'var(--border, #cbd5e1)',
                    backgroundColor: prioritySetByAI ? '#f0fdfa' : 'var(--surface, #ffffff)',
                  }}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Due Date Field */}
            <div style={{ marginBottom: '24px' }}>
              <label style={styles.label}>Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={styles.input}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
              <button
                type="submit"
                style={{ flex: 1, padding: '11px', borderRadius: '8px', background: '#2563eb', color: '#ffffff', fontWeight: '600', border: 'none', cursor: 'pointer', fontSize: '14px' }}
              >
                Create Task
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{ padding: '11px 20px', borderRadius: '8px', background: 'transparent', color: '#64748b', fontWeight: '600', border: '1px solid #cbd5e1', cursor: 'pointer', fontSize: '14px' }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default TaskModal;