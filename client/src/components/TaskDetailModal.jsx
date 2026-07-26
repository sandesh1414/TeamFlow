import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { priorityStyles } from '../styles/theme';
import FileUpload from './FileUpload';
import { getFileIcon, formatFileSize, isImage } from '../utils/fileHelpers';

const PRIORITY_COLORS = {
  low: '#047857', medium: '#b45309', high: '#b91c1c', urgent: '#be123c',
};

const AssignDropdown = ({ task, config, onTaskUpdated }) => {
  const [assigning, setAssigning] = useState(false);
  const [members, setMembers] = useState([]);

  const handleOpen = async () => {
    if (members.length > 0) { setAssigning(true); return; }
    try {
      const { data } = await axios.get('/api/teams/mine', config);
      const team = data.find((t) => t._id === task.team?.toString() || t._id === task.team);
      if (team) setMembers(team.members);
      setAssigning(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async (userId) => {
    if (!userId) return;
    try {
      const { data } = await axios.put(`/api/tasks/${task._id}`, { assignedTo: userId }, config);
      onTaskUpdated(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  if (!assigning) {
    return (
      <button className="btn btn-secondary btn-sm" onClick={handleOpen} style={{ padding: '4px 12px', fontSize: '12px' }}>
        + Assign
      </button>
    );
  }

  return (
    <select
      autoFocus
      defaultValue=""
      onChange={(e) => handleAssign(e.target.value)}
      onBlur={() => setAssigning(false)}
      className="field"
      style={{ fontSize: '12px', padding: '5px 10px', borderRadius: 'var(--r-sm)', width: 'auto' }}
    >
      <option value="">Select member…</option>
      {members.map((m) => (
        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
      ))}
    </select>
  );
};

const TaskDetailModal = ({ task, onClose, onTaskUpdated, onTaskDeleted }) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const { user } = useAuth();
  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await axios.post(`/api/tasks/${task._id}/comment`, { text: commentText }, config);
      onTaskUpdated(data);
      setCommentText('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await axios.delete(`/api/tasks/${task._id}`, config);
      onTaskDeleted(task._id);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSummarize = async () => {
    setSummarizing(true);
    setSummary('');
    try {
      const { data } = await axios.post(`/api/ai/summarize/${task._id}`, {}, config);
      setSummary(data.summary);
    } catch (err) {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleFileUploaded = async (fileData) => {
    try {
      const { data } = await axios.post(`/api/tasks/${task._id}/attach`, fileData, config);
      onTaskUpdated(data);
    } catch (err) {
      console.error('Failed to attach file:', err);
    }
  };

  const statusLabel = task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" style={{ width: '560px', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

        <div style={{ padding: '22px 26px 16px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontSize: '19px', flex: 1, paddingRight: '12px', lineHeight: 1.3 }}>{task.title}</h2>
            <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ background: 'var(--inset)', color: 'var(--text-body)' }}>{statusLabel}</span>
            <span className="badge" style={{ background: priorityStyles[task.priority]?.bg || 'var(--inset)', color: PRIORITY_COLORS[task.priority] || 'var(--text-body)', fontWeight: 700 }}>{task.priority?.toUpperCase()}</span>

            {task.assignedTo ? (
              <span style={{ fontSize: '12px', color: 'var(--text-body)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="avatar" style={{ width: '22px', height: '22px', fontSize: '10px', background: 'linear-gradient(135deg, var(--primary), #3b82f6)' }}>{task.assignedTo.name?.[0]?.toUpperCase()}</span>
                {task.assignedTo.name}
              </span>
            ) : (
              <AssignDropdown task={task} config={config} onTaskUpdated={onTaskUpdated} />
            )}

            {task.dueDate && (
              <span style={{ fontSize: '12px', color: new Date(task.dueDate) < new Date() ? 'var(--error-text)' : 'var(--text-muted)' }}>
                📅 {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        <div style={{ padding: '20px 26px' }}>

          {task.description && (
            <div style={{ marginBottom: '22px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '7px', fontWeight: 700 }}>Description</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.65 }}>{task.description}</p>
            </div>
          )}

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>AI Summary</h4>
              <button onClick={handleSummarize} disabled={summarizing} className="btn btn-ai btn-sm">
                {summarizing ? (
                  <><span className="spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />Summarizing…</>
                ) : <>✨ Summarize</>}
              </button>
            </div>
            {summary ? (
              <div style={{ background: 'var(--ai-soft)', border: '1px solid var(--ai-softer)', borderRadius: 'var(--r-md)', padding: '14px 16px' }}>
                {summary.split('\n').filter((l) => l.trim()).map((line, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: 'var(--ai-text)', lineHeight: 1.65, marginBottom: '6px' }}>{line.trim()}</div>
                ))}
                <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--ai)', fontWeight: 600 }}>✨ Generated by AI</div>
              </div>
            ) : !summarizing && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>Click Summarize for an AI overview of this task and its discussion.</p>
            )}
          </div>

          <div style={{ marginBottom: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>Attachments ({task.attachments?.length || 0})</h4>
              <FileUpload onUploadComplete={handleFileUploaded} compact />
            </div>
            {(!task.attachments || task.attachments.length === 0) && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>No files attached yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {task.attachments?.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--inset)', borderRadius: 'var(--r-md)' }}>
                  {isImage(file.mimetype) ? (
                    <img src={file.url} alt={file.filename} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>{getFileIcon(file.mimetype, file.filename)}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{formatFileSize(file.size)}{file.uploadedBy?.name && ` · ${file.uploadedBy.name}`}</div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View ↗</a>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px', fontWeight: 700 }}>Comments ({task.comments?.length || 0})</h4>
            {(!task.comments || task.comments.length === 0) && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '12px' }}>No comments yet. Be the first!</p>
            )}
            <div style={{ marginBottom: '14px' }}>
              {task.comments?.map((comment, idx) => (
                <div key={idx} style={{ marginBottom: '10px', padding: '12px 14px', background: 'var(--inset)', borderRadius: 'var(--r-md)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary)' }}>{comment.author?.name || 'Unknown'}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>{new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0, lineHeight: 1.55 }}>{comment.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment…" className="field" style={{ flex: 1, padding: '10px 14px', borderRadius: 'var(--r-md)' }} />
              <button type="submit" className="btn btn-primary" disabled={submitting || !commentText.trim()}>{submitting ? '…' : 'Post'}</button>
            </form>
          </div>
        </div>

        <div style={{ padding: '12px 26px', borderTop: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--inset)' }}>
          <button className="btn btn-danger" onClick={handleDelete}>🗑 Delete Task</button>
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Created by {task.createdBy?.name}</span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;
