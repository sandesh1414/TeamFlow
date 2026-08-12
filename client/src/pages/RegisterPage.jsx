import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const inputStyle = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s', outline: 'none' };

const AuthBrand = () => (
  <div className="auth-brand">
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', zIndex: 1 }}>
      <Logo size={40} light />
      <span style={{ fontSize: '19px', fontWeight: 800, letterSpacing: '-0.02em' }}>Freelance Collab</span>
    </div>
    <div style={{ position: 'relative', zIndex: 1, maxWidth: '440px' }}>
      <h1 style={{ color: '#fff', fontSize: '34px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.025em', marginBottom: '16px' }}>
        Build your freelance studio in minutes.
      </h1>
      <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'rgba(255,255,255,0.86)', margin: 0 }}>
        Bring designers, devs, and clients into one workspace. Assign work, track progress, and let AI handle the busywork.
      </p>
      <div style={{ display: 'flex', gap: '28px', marginTop: '34px' }}>
        {[['Kanban', 'Drag-and-drop boards'], ['Real-time chat', 'Talk & share files'], ['AI assistant', 'Ask about your tasks']].map(([t, s]) => (
          <div key={t}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{t}</div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{s}</div>
          </div>
        ))}
      </div>
    </div>
    <div style={{ position: 'relative', zIndex: 1, fontSize: '12.5px', color: 'rgba(255,255,255,0.6)' }}>
      Trusted by modern freelance collectives
    </div>
  </div>
);

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
const validate = () => {
  if (!name.trim()) return 'Name is required';
  if (name.trim().length < 2) return 'Name must be at least 2 characters';
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters';
  return null;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
  if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthBrand />
      <div className="auth-form-side">
        <div style={{ width: '100%', maxWidth: '380px' }} className="slide-up">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
            <Logo size={32} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>Freelance Collab</span>
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '6px' }}>Create your account</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '26px', fontSize: '14px' }}>Join your team workspace</p>

          {error && (
            <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid #fecaca', padding: '11px 14px', borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Name</label>
              <input className="field" style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Jordan Lee" required />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Email</label>
              <input type="email" className="field" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" required />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="label">Password</label>
              <input type="password" className="field" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
