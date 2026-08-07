import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, User, Sparkles, ShoppingBag, Moon, Sun } from 'lucide-react';
import { LanguageSwitcher, useLang } from '../i18n';
import { useTheme } from '../ThemeContext';

export default function Layout() {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ─── Top Header ─── */}
      <header style={{
        background: 'linear-gradient(135deg, var(--brand-primary-dark) 0%, var(--brand-primary) 100%)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        boxShadow: 'var(--shadow-md)',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)'
          }}>🛍️</div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '17px', color: 'var(--text-inverse)', letterSpacing: '-0.3px' }}>
              Meesho Sakhi
            </div>
            <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Your Autonomous Shopping Companion</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ marginLeft: 'auto', display: isMobile ? 'none' : 'flex', gap: '8px', alignItems: 'center' }}>
          <button 
            onClick={toggleTheme}
            style={{ 
              background: 'rgba(255,255,255,0.12)', 
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              width: '32px', height: '32px',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              backdropFilter: 'blur(4px)',
              marginRight: '8px'
            }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
          <LanguageSwitcher />
          {[
            { to: '/', label: t('home') },
            { to: '/app', label: t('dashboard') },
            { to: '/app/ask', label: t('askSakhi'), accent: true },
          ].map(link => (
            <Link key={link.to} to={link.to} style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive(link.to) ? 700 : 500,
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: link.accent ? 'rgba(255,255,255,0.2)' : isActive(link.to) ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'all var(--transition-fast)',
              backdropFilter: link.accent ? 'blur(4px)' : 'none',
            }}>
              {link.label}
            </Link>
          ))}
          <Link to="/auth" style={{
            color: 'white', textDecoration: 'none', fontSize: '13px', fontWeight: 500,
            padding: '8px 16px', borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(255,255,255,0.3)', marginLeft: '4px',
            transition: 'all var(--transition-fast)'
          }}>
            Login
          </Link>
        </nav>
      </header>

      {/* ─── Main Content ─── */}
      <main style={{ flex: 1, paddingBottom: isMobile ? '72px' : '0' }}>
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Navigation ─── */}
      {isMobile && (
        <nav style={{
          position: 'fixed',
          bottom: 0, left: 0, right: 0,
          background: 'var(--bg-card)',
          boxShadow: '0 -2px 16px rgba(0,0,0,0.08)',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0 12px',
          zIndex: 50,
          borderTop: '1px solid rgba(0,0,0,0.04)'
        }}>
          {[
            { to: '/', icon: Home, label: 'Home' },
            { to: '/app', icon: ShoppingBag, label: 'Plans' },
            { to: '/app/ask', icon: Sparkles, label: 'Sakhi', fab: true },
            { to: '/auth', icon: User, label: 'Profile' },
          ].map(item => {
            const active = isActive(item.to);
            const Icon = item.icon;

            if (item.fab) {
              return (
                <Link key={item.to} to={item.to} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  textDecoration: 'none', marginTop: '-18px'
                }}>
                  <div style={{
                    width: '52px', height: '52px',
                    borderRadius: '50%',
                    background: active
                      ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                      : 'linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(147, 51, 234, 0.4)',
                    border: '3px solid var(--bg-card)',
                    transition: 'all var(--transition-fast)'
                  }}>
                    <Icon size={24} color="white" />
                  </div>
                  <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 700, color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)' }}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                textDecoration: 'none', padding: '4px 0',
                transition: 'all var(--transition-fast)'
              }}>
                <Icon size={22} />
                <span style={{ fontSize: '10px', marginTop: '4px', fontWeight: 600 }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
