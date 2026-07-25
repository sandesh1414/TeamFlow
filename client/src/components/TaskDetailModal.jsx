import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import FileUpload from './FileUpload';
import { getFileIcon, formatFileSize, isImage } from '../utils/fileHelpers';

const PRIORITY_COLORS = {
  low: '#2e7d32', medium: '#f57f17', high: '#c62828', urgent: '#6a1b9a',
};
const AssignDropdown = ({ task, config, onTaskUpdated }) => {
  const [assigning, setAssigning] = useState(false);
  const [members, setMembers] = useState([]);

  // Fetch team members when dropdown opens
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
      <button
        onClick={handleOpen}
        style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#f0f0f0', color: '#6c63ff', border: 'none', cursor: 'pointer', fontWeight: '600' }}
      >
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
      style={{ fontSize: '12px', padding: '3px 8px', borderRadius: '8px', border: '1px solid #6c63ff', color: '#333', outline: 'none' }}
    >
      <option value="">Select member...</option>
      {members.map((m) => (
        <option key={m.user._id} value={m.user._id}>
          {m.user.name}
        </option>
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
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: '14px', width: '540px', maxHeight: '88vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2 style={{ margin: 0, fontSize: '18px', flex: 1, paddingRight: '12px' }}>{task.title}</h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999', flexShrink: 0 }}>✕</button>
          </div>
        {/* Meta row */}
<div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#f0f0f0', color: '#555' }}>{statusLabel}</span>
  <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: '#f0f0f0', color: PRIORITY_COLORS[task.priority] || '#555', fontWeight: '600' }}>{task.priority?.toUpperCase()}</span>
  
  {/* Assignee — show name if assigned, show dropdown if not */}
  {task.assignedTo ? (
    <span style={{ fontSize: '12px', color: '#555' }}>👤 {task.assignedTo.name}</span>
  ) : (
    <AssignDropdown task={task} config={config} onTaskUpdated={onTaskUpdated} />
  )}

  {task.dueDate && (
    <span style={{ fontSize: '12px', color: new Date(task.dueDate) < new Date() ? '#e53935' : '#555' }}>
      📅 {new Date(task.dueDate).toLocaleDateString()}
    </span>
  )}
</div>
        </div>

        <div style={{ padding: '20px 24px', flex: 1 }}>

          {/* Description */}
          {task.description && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', marginBottom: '6px', margin: '0 0 6px' }}>Description</h4>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.6', margin: 0 }}>{task.description}</p>
            </div>
          )}

          {/* AI Summary */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>AI Summary</h4>
              <button
                onClick={handleSummarize}
                disabled={summarizing}
                style={{ padding: '6px 14px', background: summarizing ? '#f0f0f0' : 'linear-gradient(135deg, #6c63ff, #a855f7)', color: summarizing ? '#999' : 'white', border: 'none', borderRadius: '20px', cursor: summarizing ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {summarizing ? (
                  <><span style={{ display: 'inline-block', width: '10px', height: '10px', border: '2px solid #ccc', borderTopColor: '#6c63ff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Summarizing...</>
                ) : <>✨ Summarize</>}
              </button>
            </div>
            {summary ? (
              <div style={{ background: 'linear-gradient(135deg, #f5f3ff, #fdf4ff)', border: '1px solid #e9d5ff', borderRadius: '10px', padding: '14px 16px' }}>
                {summary.split('\n').filter(l => l.trim()).map((line, idx) => (
                  <div key={idx} style={{ fontSize: '13px', color: '#4c1d95', lineHeight: '1.6', marginBottom: '6px' }}>{line.trim()}</div>
                ))}
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#9333ea' }}>✨ Generated by Gemini AI</div>
              </div>
            ) : !summarizing && (
              <p style={{ fontSize: '13px', color: '#bbb', margin: 0 }}>Click Summarize to get an AI overview of this task and its discussion.</p>
            )}
          </div>

          {/* Attachments */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h4 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', margin: 0 }}>Attachments ({task.attachments?.length || 0})</h4>
              <FileUpload onUploadComplete={handleFileUploaded} compact />
            </div>
            {(!task.attachments || task.attachments.length === 0) && (
              <p style={{ fontSize: '13px', color: '#bbb', margin: 0 }}>No files attached yet.</p>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {task.attachments?.map((file, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#f8f8f8', borderRadius: '8px' }}>
                  {isImage(file.mimetype) ? (
                    <img src={file.url} alt={file.filename} style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '6px' }} />
                  ) : (
                    <span style={{ fontSize: '28px' }}>{getFileIcon(file.mimetype, file.filename)}</span>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.filename}</div>
                    <div style={{ fontSize: '11px', color: '#999' }}>{formatFileSize(file.size)}{file.uploadedBy?.name && ` · ${file.uploadedBy.name}`}</div>
                  </div>
                  <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', color: '#6c63ff', textDecoration: 'none' }}>View ↗</a>
                </div>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <h4 style={{ color: '#666', fontSize: '12px', textTransform: 'uppercase', margin: '0 0 10px' }}>Comments ({task.comments?.length || 0})</h4>
            {(!task.comments || task.comments.length === 0) && (
              <p style={{ fontSize: '13px', color: '#bbb', marginBottom: '12px' }}>No comments yet. Be the first!</p>
            )}
            <div style={{ marginBottom: '14px' }}>
              {task.comments?.map((comment, idx) => (
                <div key={idx} style={{ marginBottom: '10px', padding: '10px 12px', background: '#f8f8f8', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: '700', color: '#6c63ff' }}>{comment.author?.name || 'Unknown'}</span>
                    <span style={{ fontSize: '11px', color: '#bbb' }}>{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#333', margin: 0 }}>{comment.text}</p>
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} style={{ display: 'flex', gap: '8px' }}>
              <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Write a comment..." style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '13px' }} />
              <button type="submit" disabled={submitting || !commentText.trim()} style={{ padding: '8px 16px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>
                {submitting ? '...' : 'Post'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 24px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={handleDelete} style={{ fontSize: '13px', color: '#e53935', background: 'none', border: 'none', cursor: 'pointer' }}>🗑 Delete Task</button>
          <span style={{ fontSize: '12px', color: '#bbb' }}>Created by {task.createdBy?.name}</span>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default TaskDetailModal;
