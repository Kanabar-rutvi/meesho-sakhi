import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

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

      const envUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, "") : "";
      const baseUrl = envUrl || (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "http://localhost:8000" : "https://meesho-sakhi.onrender.com");
      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: 'POST',
        headers,
        body
      });
      
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Authentication failed");
      }
      
      const data = await res.json();
      let tokenToSave = null;
      
      if (isLogin) {
        tokenToSave = data.access_token;
      } else {
        // If register, we could auto-login or redirect to login. Let's redirect to login for now.
        setIsLogin(true);
        setError("Registration successful. Please login.");
        return;
      }
      
      // Fetch user profile immediately
      const meRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { 'Authorization': `Bearer ${tokenToSave}` }
      });
      if (meRes.ok) {
        const userData = await meRes.json();
        login(tokenToSave, userData);
        navigate('/app');
      } else {
        throw new Error("Failed to load user profile");
      }
      
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
