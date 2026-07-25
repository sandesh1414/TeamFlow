import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const CreateTeamModal = ({ onClose, onTeamCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const { data } = await axios.post('/api/teams/create', { name, description }, config);
      onTeamCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={onClose}>
      <div style={{ background: 'white', padding: '32px', borderRadius: '14px', width: '420px' }} onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '20px' }}>Create a Team</h2>
        {error && <p style={{ color: 'red', marginBottom: '12px', fontSize: '13px' }}>{error}</p>}
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Team Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={{ display: 'block', width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Description (optional)</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ display: 'block', width: '100%', padding: '8px 10px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Create</button>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTeamModal;
