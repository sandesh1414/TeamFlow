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

  if (!name.trim()) {
    setError('Team name is required');
    return;
  }

  setLoading(true);
  setError('');

  try {
    const config = {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    };

    const response = await axios.put(`/api/teams/${team._id}`, { name: name.trim(), description: description.trim() }, config);

    onTeamUpdated(response.data);
  } catch (err) {
  console.log('FULL ERROR:', err);
  console.log('SERVER RESPONSE:', err.response?.data);

  setError(
    err.response?.data?.message ||
    err.message ||
    'Failed to update team'
  );
}
   finally {
    setLoading(false);
  }
};

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        className="modal slide-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '520px',
          boxSizing: 'border-box',
          padding: '28px',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '26px',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: '24px',
            }}
          >
            Edit Team
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            style={{
              color: 'var(--error-text)',
              background: 'var(--error-bg)',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: 'var(--r-md)',
              fontSize: '13px',
              marginBottom: '18px',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Team Name */}
          <div style={{ marginBottom: '20px' }}>
            <label className="label">
              Team Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field"
              placeholder="Enter team name"
              required
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginTop: '7px',
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: '26px' }}>
            <label className="label">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="field"
              placeholder="What is this team about?"
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                marginTop: '7px',
                resize: 'vertical',
                minHeight: '110px',
              }}
            />
          </div>

          {/* Buttons */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{
                minWidth: '100px',
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                minWidth: '150px',
              }}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTeamModal;