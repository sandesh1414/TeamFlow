import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('/api/auth/register', { name, email, password });
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const inputStyle = { display: 'block', width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '4px', fontSize: '14px', boxSizing: 'border-box' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '16px', width: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <h2 style={{ margin: '0 0 6px', fontSize: '24px' }}>Create Account</h2>
        <p style={{ color: '#999', marginBottom: '24px', fontSize: '14px' }}>Join your team workspace</p>
        {error && <p style={{ color: '#e53935', background: '#fce4ec', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Name</label>
            <input style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Email</label>
            <input type="email" style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600' }}>Password</label>
            <input type="password" style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button type="submit" style={{ width: '100%', padding: '12px', background: '#6c63ff', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>
            Register
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
          Already have an account? <a href="/login" style={{ color: '#6c63ff', textDecoration: 'none', fontWeight: '600' }}>Login</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
