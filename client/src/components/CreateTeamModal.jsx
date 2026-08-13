import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CreateTeamModal = ({ onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Team name is required'); return; }
  if (name.trim().length < 2) { setError('Team name must be at least 2 characters'); return; }
  if (name.trim().length > 50) { setError('Team name is too long'); return; }
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teams/create', { name, description }, config);
      onTeamCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box', outline: 'none' };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" style={{ width: '460px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Create a Team</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>Set up a new workspace for your crew</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
        </div>

        {error && <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: '16px' }}>
            <label className="label">Team name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design Studio" required className="field" style={inputStyle} />
          </div>
          <div style={{ marginBottom: '22px' }}>
            <label className="label">Description <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="field" style={{ ...inputStyle, minHeight: '78px', resize: 'vertical' }} placeholder="What's this team working on?" />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Creating…' : 'Create team'}</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
