import { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const FileUpload = ({ onUploadComplete, compact = false }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        headers: { Authorization: `Bearer ${user.token}` },
        // Do NOT set Content-Type manually — browser sets it with correct boundary
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      };

      const { data } = await axios.post('/api/upload', formData, config);
      onUploadComplete(data);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ display: 'inline-block' }}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt"
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{
          padding: compact ? '6px 10px' : '8px 14px',
          background: uploading ? '#f0f0f0' : 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          fontSize: '13px',
          color: '#555',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {uploading ? (
          <>
            <span>Uploading...</span>
            <span style={{ color: '#6c63ff', fontWeight: '600' }}>{progress}%</span>
          </>
        ) : (
          <>📎 {compact ? '' : 'Attach File'}</>
        )}
      </button>
      {uploading && (
        <div style={{ marginTop: '4px', height: '3px', background: '#f0f0f0', borderRadius: '2px', width: '100%' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#6c63ff', borderRadius: '2px', transition: 'width 0.2s' }} />
        </div>
      )}
    </div>
  );
};

export default FileUpload;
