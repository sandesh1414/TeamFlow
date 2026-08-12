import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JoinTeamModal = ({ onClose, onTeamJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const handleJoin = async (e) => {
    e.preventDefault();
     if (!inviteCode.trim()) { setError('Please enter an invite code'); return; }
  if (inviteCode.trim().length !== 6) { setError('Invite code must be exactly 6 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teams/join', { inviteCode }, config);
      onTeamJoined(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal slide-up" style={{ width: '400px', padding: '30px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '20px', marginBottom: '3px' }}>Join a team</h2>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Enter the 6-character invite code</p>
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid #fecaca', padding: '10px 14px', borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '16px' }}>{error}</div>}

        <form onSubmit={handleJoin}>
          <div style={{ marginBottom: '22px' }}>
            <label className="label">Invite code</label>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="A3F9BC"
              maxLength={6}
              required
              autoFocus
              className="field"
              style={{
                display: 'block', width: '100%', padding: '16px',
                borderRadius: 'var(--r-md)', border: '2px dashed var(--primary-softer)',
                marginTop: '4px', fontSize: '26px', letterSpacing: '10px', textAlign: 'center',
                fontWeight: 700, color: 'var(--primary)', boxSizing: 'border-box', outline: 'none',
                background: 'var(--primary-soft)',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>{loading ? 'Joining…' : 'Join team'}</button>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTeamModal;
