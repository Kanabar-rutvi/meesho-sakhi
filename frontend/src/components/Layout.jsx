import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Home, User, Sparkles, ShoppingBag, Moon, Sun } from 'lucide-react';
import { LanguageSwitcher, useLang } from '../i18n';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';

export default function Layout() {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dropdownOpen, setDropdownOpen] = useState(false);

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
        padding: 'clamp(10px, 2vw, 12px) clamp(16px, 4vw, 24px)',
        display: 'flex',
        alignItems: 'center',
        gap: 'clamp(8px, 2vw, 12px)',
        boxShadow: 'var(--shadow-md)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexWrap: 'wrap'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'clamp(8px, 2vw, 12px)', textDecoration: 'none', flex: 1, minWidth: '0' }}>
          <div style={{
            width: '38px', height: '38px',
            background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', flexShrink: 0,
            boxShadow: '0 0 12px rgba(236, 72, 153, 0.4)'
          }}>🛍️</div>
          <div style={{ minWidth: '0' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 'clamp(14px, 3.5vw, 17px)', color: 'var(--text-inverse)', letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              Meesho Sakhi
            </div>
            <div style={{ fontSize: 'clamp(8px, 2vw, 10px)', color: 'rgba(255,255,255,0.7)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Your Shopping Companion</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav style={{ marginLeft: isMobile ? '0' : 'auto', display: isMobile ? 'none' : 'flex', gap: '8px', alignItems: 'center', width: isMobile ? '100%' : 'auto' }}>
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
              fontSize: 'clamp(12px, 2.5vw, 13px)',
              fontWeight: isActive(link.to) ? 700 : 500,
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              background: link.accent ? 'rgba(255,255,255,0.2)' : isActive(link.to) ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'all var(--transition-fast)',
              backdropFilter: link.accent ? 'blur(4px)' : 'none',
              whiteSpace: 'nowrap'
            }}>
              {link.label}
            </Link>
          ))}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', outline: 'none'
                }}
              >
                <div style={{
                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 500, display: isMobile ? 'none' : 'block' }}>
                  {user.name}
                </span>
              </button>
              
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '8px',
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)', minWidth: '150px', zIndex: 100, overflow: 'hidden'
                }}>
                  <button 
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    style={{
                      width: '100%', padding: '12px 16px', background: 'none', border: 'none', 
                      textAlign: 'left', cursor: 'pointer', fontSize: '14px', color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', gap: '8px'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--bg-subtle)'}
                    onMouseOut={e => e.currentTarget.style.background = 'none'}
                  >
                    <User size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" style={{
              color: 'white', textDecoration: 'none', fontSize: 'clamp(12px, 2.5vw, 13px)', fontWeight: 500,
              padding: '8px 16px', borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255,255,255,0.3)', marginLeft: '4px',
              transition: 'all var(--transition-fast)',
              whiteSpace: 'nowrap'
            }}>
              Login
            </Link>
          )}
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
          padding: 'clamp(6px, 2vw, 8px) 0 clamp(8px, 2vw, 12px)',
          paddingBottom: 'max(clamp(8px, 2vw, 12px), env(safe-area-inset-bottom))',
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
                  textDecoration: 'none', marginTop: 'clamp(-12px, -2vw, -18px)'
                }}>
                  <div style={{
                    width: 'clamp(44px, 12vw, 52px)', height: 'clamp(44px, 12vw, 52px)',
                    borderRadius: '50%',
                    background: active
                      ? 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))'
                      : 'linear-gradient(135deg, var(--brand-primary-light), var(--brand-primary))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(147, 51, 234, 0.4)',
                    border: '3px solid var(--bg-card)',
                    transition: 'all var(--transition-fast)'
                  }}>
                    <Icon size={20} color="white" />
                  </div>
                  <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', marginTop: '2px', fontWeight: 700, color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                </Link>
              );
            }

            return (
              <Link key={item.to} to={item.to} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                color: active ? 'var(--brand-primary)' : 'var(--text-tertiary)',
                textDecoration: 'none', padding: 'clamp(4px, 1vw, 8px)',
                transition: 'all var(--transition-fast)',
                minWidth: '44px',
                minHeight: '44px',
                justifyContent: 'center'
              }}>
                <Icon size={20} />
                <span style={{ fontSize: 'clamp(8px, 2vw, 10px)', marginTop: '2px', fontWeight: 600, whiteSpace: 'nowrap' }}>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
