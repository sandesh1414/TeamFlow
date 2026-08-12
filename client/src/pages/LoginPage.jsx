import React from 'react';
import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';

const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '12px 16px',
  borderRadius: 'var(--r-md)',
  border: '1px solid var(--border)',
  marginTop: '4px',
  fontSize: '14px',
  boxSizing: 'border-box',
  transition: 'border-color 0.18s, box-shadow 0.18s',
  outline: 'none',
  background: 'var(--surface)',
  color: 'var(--text)',
};

const AuthBrand = () => (
  <div
    className="auth-brand"
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '48px 56px',
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
          fontSize: '22px',
          fontWeight: 800,
          letterSpacing: '-0.025em',
        }}
      >
        TeamFlow
      </span>
    </div>

    {/* Main content */}
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: '560px',
        width: '100%',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          color: '#fff',
          fontSize: '48px',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.035em',
          marginBottom: '20px',
        }}
      >
        Keep your team
        <br />
        moving forward
      </h1>

      <p
        style={{
          fontSize: '18px',
          lineHeight: 1.55,
          color: 'rgba(255,255,255,0.82)',
          margin: 0,
          maxWidth: '480px',
        }}
      >
        Organize work, keep conversations in one place, and make it easier
        for everyone to know what needs to happen next.
      </p>

      <div
        style={{
          display: 'flex',
          gap: '40px',
          marginTop: '44px',
        }}
      >
        {[
          { icon: '01', title: 'Task boards', desc: 'See what needs to get done' },
          { icon: '02', title: 'Team chat', desc: 'Keep conversations together' },
          { icon: '03', title: 'AI assistant', desc: 'Summarize and split tasks' },
        ].map(({ icon, title, desc }) => (
          <div key={title}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'rgba(255,255,255,0.4)',
                marginBottom: '8px',
                letterSpacing: '0.1em',
              }}
            >
              {icon}
            </div>
            <div
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: '#fff',
                marginBottom: '4px',
              }}
            >
              {title}
            </div>
            <div
              style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'rgba(255,255,255,0.65)',
                maxWidth: '140px',
              }}
            >
              {desc}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* Bottom */}
    <div
      style={{
        position: 'relative',
        zIndex: 1,
        fontSize: '12.5px',
        color: 'rgba(255,255,255,0.4)',
      }}
    >
      Trusted by modern freelance collectives
    </div>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <Logo size={32} />
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)' }}>TeamFlow</span>
          </div>
          <h2 style={{ fontSize: '26px', marginBottom: '6px', letterSpacing: '-0.03em' }}>Welcome back</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '14px' }}>
            Sign in to your workspace
          </p>

          {error && (
            <div
              style={{
                color: 'var(--error-text)',
                background: 'var(--error-bg)',
                border: '1px solid #fecaca',
                padding: '12px 16px',
                borderRadius: 'var(--r-md)',
                fontSize: '13px',
                marginBottom: '18px',
                animation: 'slideDown 0.2s ease both',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label className="label">Email</label>
              <input
                type="email"
                className="field"
                style={inputStyle}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@studio.com"
                required
              />
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label className="label">Password</label>
              <input
                type="password"
                className="field"
                style={inputStyle}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? (
                <>
                  <span className="spin" style={{ display: 'inline-block', width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '26px', fontSize: '13.5px', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600 }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
