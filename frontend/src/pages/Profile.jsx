import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { User, LogOut } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <User /> Profile
      </h1>
      
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%', background: 'var(--brand-secondary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '24px'
          }}>
            {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 700 }}>{user.name}</h2>
            <p style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="btn" 
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', background: 'var(--bg-subtle)', color: 'var(--error)' }}
        >
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
}
