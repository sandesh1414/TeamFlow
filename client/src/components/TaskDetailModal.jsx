import React, { useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { priorityStyles } from '../styles/theme';
import { avatarGradient } from '../styles/theme';
import FileUpload from './FileUpload';
import { getFileIcon, formatFileSize, isImage } from '../utils/fileHelpers';

const AssignDropdown = ({ task, config, onTaskUpdated }) => {
  const [assigning, setAssigning] = useState(false);
  const [members, setMembers] = useState([]);

  const handleOpen = async () => {
    if (members.length > 0) { setAssigning(true); return; }
    try {
      const { data } = await api.get('/api/teams/mine', config);
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
      const { data } = await api.put(`/api/tasks/${task._id}`, { assignedTo: userId }, config);
      onTaskUpdated(data);
    } catch (err) {
      console.error(err);
    } finally {
      setAssigning(false);
    }
  };

  if (!assigning) {
    return (
      <button className="btn btn-secondary btn-sm" onClick={handleOpen} style={{ padding: '5px 12px', fontSize: '12px' }}>
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

const TaskDetailModal = ({ task, onClose, onTaskUpdated, onTaskDeleted, myRole }) => {
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState('');
  const [summarizing, setSummarizing] = useState(false);
  const { user } = useAuth();
  const config = { headers: { Authorization: `Bearer ${user.token}` } };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (commentText.trim().length > 500) {
      alert('Comment must be under 500 characters');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post(`/api/tasks/${task._id}/comment`, { text: commentText }, config);
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
      await api.delete(`/api/tasks/${task._id}`, config);
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
      const { data } = await api.post(`/api/ai/summarize/${task._id}`, {}, config);
      setSummary(data.summary);
    } catch (err) {
      setSummary('Failed to generate summary. Please try again.');
    } finally {
      setSummarizing(false);
    }
  };

  const handleFileUploaded = async (fileData) => {
    try {
      const { data } = await api.post(`/api/tasks/${task._id}/attach`, fileData, config);
      onTaskUpdated(data);
    } catch (err) {
      console.error('Failed to attach file:', err);
    }
  };

  const statusLabel = task.status === 'todo' ? 'To Do' : task.status === 'inprogress' ? 'In Progress' : 'Done';
  const statusColor = task.status === 'todo' ? 'var(--text-muted)' : task.status === 'inprogress' ? 'var(--warning-text)' : 'var(--success-text)';
  const statusBg = task.status === 'todo' ? 'var(--inset)' : task.status === 'inprogress' ? 'var(--warning-bg)' : 'var(--success-bg)';
  const priority = priorityStyles[task.priority] || priorityStyles.medium;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" style={{ width: '600px', maxHeight: '88vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '24px 28px 18px', borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ fontSize: '20px', flex: 1, paddingRight: '14px', lineHeight: 1.3, letterSpacing: '-0.02em' }}>{task.title}</h2>
            <button className="btn-icon" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
          </div>
          <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span className="badge" style={{ background: statusBg, color: statusColor }}>{statusLabel}</span>
            <span
              className="badge"
              style={{
                background: priority.bg, color: priority.text,
                display: 'inline-flex', alignItems: 'center', gap: '5px',
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: priority.dot }} />
              {task.priority?.toUpperCase()}
            </span>

            {task.assignedTo ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span
                  className="avatar"
                  style={{ width: '24px', height: '24px', fontSize: '10px', background: avatarGradient(task.assignedTo.name) }}
                >
                  {task.assignedTo.name?.[0]?.toUpperCase()}
                </span>
                <span style={{ fontSize: '12.5px', color: 'var(--text-body)', fontWeight: 500 }}>{task.assignedTo.name}</span>
              </div>
            ) : myRole === 'owner' ? (
              <AssignDropdown task={task} config={config} onTaskUpdated={onTaskUpdated} />
            ) : (
              <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>Unassigned</span>
            )}

            {task.dueDate && (
              <span
                style={{
                  fontSize: '11.5px', fontWeight: 600,
                  color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--error-text)' : 'var(--text-muted)',
                  background: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--error-bg)' : 'var(--inset)',
                  padding: '3px 10px', borderRadius: 'var(--r-pill)',
                }}
              >
                {new Date(task.dueDate) < new Date() && task.status !== 'done' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px', display: 'inline-block', verticalAlign: '-1px' }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                )}
                {new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 28px' }}>

          {task.description && (
            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px', fontWeight: 700 }}>Description</h4>
              <p style={{ fontSize: '14px', color: 'var(--text-body)', lineHeight: 1.65 }}>{task.description}</p>
            </div>
          )}

          {/* AI Summary */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>AI Summary</h4>
              <button onClick={handleSummarize} disabled={summarizing} className="btn btn-ai btn-sm">
                {summarizing ? (
                  <>
                    <span className="spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%' }} />
                    Summarizing…
                  </>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6L20 9.5 13.5 12 12 18l-1.5-6L4 9.5 10.5 8z"/></svg>
                    Summarize
                  </>
                )}
              </button>
            </div>
            {summary ? (
              <div
                className="slide-up"
                style={{
                  background: 'var(--ai-soft)',
                  border: '1px solid var(--ai-softer)',
                  borderRadius: 'var(--r-md)',
                  padding: '16px 18px',
                }}
              >
                {summary.split('\n').filter((l) => l.trim()).map((line, idx) => (
                  <div key={idx} style={{ fontSize: '13.5px', color: 'var(--ai-text)', lineHeight: 1.65, marginBottom: '6px' }}>
                    {line.trim()}
                  </div>
                ))}
                <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--ai)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.5 6L20 9.5 13.5 12 12 18l-1.5-6L4 9.5 10.5 8z"/></svg>Generated by AI</div>
              </div>
            ) : !summarizing && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>
                Click Summarize for an AI overview of this task and its discussion.
              </p>
            )}
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0, fontWeight: 700 }}>
                Attachments ({task.attachments?.length || 0})
              </h4>
              <FileUpload onUploadComplete={handleFileUploaded} compact />
            </div>
            {(!task.attachments || task.attachments.length === 0) && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', margin: 0 }}>No files attached yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              {task.attachments?.map((file, idx) => (
                <div
                  key={idx}
                  className="card"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', boxShadow: 'var(--sh-xs)' }}
                >
                  {isImage(file.mimetype) ? (
                    <img src={file.url} alt={file.filename} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: 'var(--r-sm)' }} />
                  ) : (
                    <span style={{ fontSize: '24px' }}>{getFileIcon(file.mimetype, file.filename)}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="truncate" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{file.filename}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      {formatFileSize(file.size)}{file.uploadedBy?.name && ` · ${file.uploadedBy.name}`}
                    </div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm">View <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '2px', display: 'inline-block', verticalAlign: '-1px' }}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg></a>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 12px', fontWeight: 700 }}>
              Comments ({task.comments?.length || 0})
            </h4>
            {(!task.comments || task.comments.length === 0) && (
              <p style={{ fontSize: '13px', color: 'var(--text-faint)', marginBottom: '14px' }}>No comments yet. Be the first!</p>
            )}
            <div style={{ marginBottom: '16px' }}>
              {task.comments?.map((comment, idx) => (
                <div
                  key={idx}
                  style={{
                    marginBottom: '10px', padding: '12px 15px',
                    background: 'var(--inset)', borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border-soft)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                      <span
                        className="avatar"
                        style={{ width: '22px', height: '22px', fontSize: '10px', background: avatarGradient(comment.author?.name) }}
                      >
                        {comment.author?.name?.[0]?.toUpperCase()}
                      </span>
                      <span style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--primary)' }}>{comment.author?.name || 'Unknown'}</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-faint)' }}>
                      {new Date(comment.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-body)', margin: 0, lineHeight: 1.55 }}>{comment.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment…"
                className="field"
                style={{ flex: 1, borderRadius: 'var(--r-pill)' }}
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="btn btn-primary"
                style={{ borderRadius: 'var(--r-pill)' }}
              >
                {submitting ? '…' : 'Post'}
              </button>
            </form>
            <div style={{ fontSize: '11px', color: commentText.length > 450 ? 'var(--error-text)' : 'var(--text-faint)', textAlign: 'right', marginTop: '4px' }}>
              {commentText.length}/500
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 28px',
            borderTop: '1px solid var(--border-soft)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--inset)',
            borderRadius: '0 0 var(--r-xl) var(--r-xl)',
          }}
        >
          {myRole === 'owner' ? (
            <button className="btn btn-danger" onClick={handleDelete}>Delete Task</button>
          ) : (
            <div />
          )}
          <span style={{ fontSize: '12px', color: 'var(--text-faint)' }}>
            Created by {task.createdBy?.name}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;


