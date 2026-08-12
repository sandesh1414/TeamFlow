import React from 'react';
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
        className="btn btn-ghost"
        style={{
          padding: compact ? '6px 11px' : '9px 14px',
          fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '7px',
        }}
      >
        {uploading ? (
          <>
            <span className="spin" style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%' }} />
            {progress}%
          </>
        ) : (
          <>📎 {compact ? '' : 'Attach File'}</>
        )}
      </button>
    </div>
  );
};

export default FileUpload;
