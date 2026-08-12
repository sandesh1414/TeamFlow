import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const inputStyle = { display: 'block', width: '100%', padding: '11px 14px', borderRadius: 'var(--r-md)', border: '1px solid var(--border)', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box', transition: 'border-color 0.18s, box-shadow 0.18s', outline: 'none' };

const AuthBrand = () => (
  <div
    className="auth-brand"
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '32px 50px',
      boxSizing: 'border-box',
    }}
  >
    {/* Logo */}
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        position: 'relative',
        zIndex: 1,
      }}
    >
      <Logo size={40} light />

      <span
        style={{
          fontSize: '24px',
          fontWeight: 800,
          letterSpacing: '-0.02em',
        }}
      >
        TeamFlow
      </span>
    </div>

    {/* Main content - centered vertically */}
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '600px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: '54px',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.04em',
          marginBottom: '22px',
        }}
      >
        Keep your team moving
      </h1>

      <p
        style={{
          fontSize: '20px',
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.86)',
          margin: 0,
          maxWidth: '590px',
        }}
      >
        Organize your work, keep conversations in one place, and make it easier
        for everyone to know what needs to happen next.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '50px',
          marginTop: '42px',
        }}
      >
        {[
          ['Task boards', 'See what needs to get done'],
          ['Team chat', 'Keep conversations together'],
          ['AI assistant', 'Summarize and break down tasks into subtasks'],
        ].map(([title, description]) => (
          <div key={title}>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '6px',
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: '14px',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.7)',
              }}
            >
              {description}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Empty bottom space to balance the logo */}
    <div />
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
const validate = () => {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address';
  if (!password) return 'Password is required';
  return null;
};
  const handleSubmit = async (e) => {
    e.preventDefault();
     const validationError = validate();
  if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await axios.post('/api/auth/login', { email, password });
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
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>TeamFlow</span>
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '6px' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '26px', fontSize: '14px' }}>Sign in to your workspace</p>

          {error && (
            <div style={{ color: 'var(--error-text)', background: 'var(--error-bg)', border: '1px solid #fecaca', padding: '11px 14px', borderRadius: 'var(--r-md)', fontSize: '13px', marginBottom: '18px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label className="label">Email</label>
              <input type="email" className="field" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@studio.com" required />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label className="label">Password</label>
              <input type="password" className="field" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
