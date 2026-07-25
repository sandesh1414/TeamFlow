import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const JoinTeamModal = ({ onClose, onTeamJoined }) => {
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teams/join', { inviteCode }, config);
      onTeamJoined(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '14px', width: '360px' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px' }}>Join a Team</h2>
        {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{error}</p>}
        <form onSubmit={handleJoin}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Invite Code</label>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value.toUpperCase())} placeholder="e.g. A3F9BC" maxLength={6} required style={{ display: 'block', width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '22px', letterSpacing: '6px', textAlign: 'center', boxSizing: 'border-box' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Join</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinTeamModal;
