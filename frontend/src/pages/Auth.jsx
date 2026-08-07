import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const body = isLogin 
        ? new URLSearchParams({ username: email, password: password })
        : JSON.stringify({ email, password, name });
        
      const headers = isLogin 
        ? { 'Content-Type': 'application/x-www-form-urlencoded' }
        : { 'Content-Type': 'application/json' };

      // In a real app, you'd fetch from your actual backend URL.
      // For now, this is a mock implementation until we hook up the API fully.
      // const res = await fetch(`http://localhost:8000${endpoint}`, {
      //   method: 'POST',
      //   headers,
      //   body
      // });
      
      // if (!res.ok) throw new Error("Authentication failed");
      
      // const data = await res.json();
      // localStorage.setItem('token', data.access_token);
      
      // Mocking successful login for the UI prototype
      setTimeout(() => navigate('/app'), 500);
      
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 140px)', padding: '24px' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>🛍️</div>
          <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{isLogin ? 'Login to continue planning' : 'Join Sakhi to start shopping'}</p>
        </div>
        
        {error && (
          <div style={{ padding: '12px', background: 'var(--bg-subtle)', color: 'var(--error)', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                required={!isLogin}
                style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', outline: 'none' }}
                placeholder="Enter your name"
              />
            </div>
          )}
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Email</label>
            <input 
              type="email" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', outline: 'none' }}
              placeholder="Enter your email"
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Password</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--slate-200)', outline: 'none' }}
              placeholder="Enter your password"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '8px', width: '100%', padding: '14px' }}>
            {isLogin ? 'Login' : 'Sign Up'}
          </button>
        </form>
        
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: 'var(--text-secondary)' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontWeight: 600, cursor: 'pointer', outline: 'none' }}
          >
            {isLogin ? 'Sign up' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}
