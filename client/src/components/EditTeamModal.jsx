import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const EditTeamModal = ({ team, onClose, onTeamUpdated }) => {
  const [name, setName] = useState(team.name || '');
  const [description, setDescription] = useState(team.description || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setError('Team name is required'); return; }
    if (name.trim().length < 2) { setError('Team name must be at least 2 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const response = await axios.put(`/api/teams/${team._id}`, { name: name.trim(), description: description.trim() }, config);
      onTeamUpdated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to update team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '460px', padding: '28px' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>Edit Team</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Update your workspace details
            </p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close" style={{ flexShrink: 0 }}>✕</button>
        </div>

        {error && (
          <div
            className="slide-down"
            style={{
              color: 'var(--error-text)', background: 'var(--error-bg)',
              border: '1px solid #fecaca', padding: '11px 15px',
              borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '18px', marginTop: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '18px' }}>
            <label className="label">Team Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Enter team name"
              required
              maxLength={50}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="label">
              Description <span style={{ color: 'var(--text-faint)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
              placeholder="What is this team about?"
              rows={4}
              style={{ resize: 'vertical', minHeight: '90px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;
