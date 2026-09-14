import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, User, Sparkles, ShoppingBag, Moon, Sun, Search, Heart, ShoppingCart, ShieldCheck } from 'lucide-react';
import { useLang } from '../i18n';
import { useTheme } from '../ThemeContext';
import { useAuth } from '../AuthContext';
import SakhiLogo from './SakhiLogo';

export default function Layout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setMobileSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-main)', overflowX: 'hidden' }}>
      {/* ─── Top Editorial Commerce Navbar ─── */}
      <header style={{
        background: 'var(--bg-card)',
        padding: '0 clamp(8px, 2.5vw, 32px)',
        height: '56px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'clamp(6px, 1.5vw, 16px)',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        {/* LEFT: Logo / Sakhi */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
          <SakhiLogo size={isMobile ? 28 : 34} variant="full" />
        </Link>

        {/* CENTER: Search products, brands, categories + AI Assistant (Desktop & Tablet) */}
        <div style={{ flex: 1, display: isMobile ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', maxWidth: '580px', margin: '0 auto' }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', width: '100%' }}>
            <Search size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, and categories..." 
              style={{
                width: '100%', padding: '9px 16px 9px 38px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px',
                color: 'var(--text-primary)', outline: 'none', transition: 'all var(--transition-fast)'
              }} 
            />
          </form>

          <Link to="/app/ask" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none',
            color: 'var(--brand-primary)', fontSize: '13px', fontWeight: 600,
            background: 'var(--bg-tint)', border: '1px solid var(--border-color)',
            padding: '7px 14px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap',
            transition: 'all var(--transition-fast)'
          }}>
            <Sparkles size={13} color="var(--brand-accent)" /> AI Assistant
          </Link>
        </div>

        {/* RIGHT: Mobile Search Toggle, Wishlist, Cart, Theme, Profile / Sign In */}
        <nav style={{ display: 'flex', gap: 'clamp(4px, 1.2vw, 10px)', alignItems: 'center', flexShrink: 0 }}>
          {/* Mobile Search Toggle Button */}
          {isMobile && (
            <button
              onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
              title="Search catalog"
              aria-label="Toggle search"
              style={{
                background: mobileSearchOpen ? 'var(--brand-primary-light)' : 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                color: mobileSearchOpen ? 'var(--brand-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: '32px', height: '32px', borderRadius: 'var(--radius-full)'
              }}
            >
              <Search size={14} />
            </button>
          )}

          {/* Wishlist Icon — hide on mobile since bottom nav already has dedicated 'Saved' tab */}
          <Link
            to="/app/wishlist"
            className="hide-on-mobile"
            title="Wishlist"
            style={{
              color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center', width: '34px', height: '34px',
              borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)', transition: 'background var(--transition-fast)'
            }}
          >
            <Heart size={15} />
          </Link>

          {/* Plans / Cart Icon */}
          <Link
            to={user ? "/app" : "/app/ask"}
            title="Plans & Cart"
            style={{
              color: 'var(--text-secondary)', textDecoration: 'none', display: 'flex',
              alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px',
              borderRadius: 'var(--radius-full)', background: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)', transition: 'background var(--transition-fast)'
            }}
          >
            <ShoppingCart size={14} />
          </Link>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            title="Toggle theme"
            style={{ 
              background: 'var(--bg-subtle)', 
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '32px', height: '32px', borderRadius: 'var(--radius-full)'
            }}
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          </button>
          
          <div className="hide-on-mobile" style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 2px' }} />

          {/* User Account / Sign In */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', outline: 'none'
                }}
              >
                <div style={{
                  width: '30px', height: '30px', borderRadius: 'var(--radius-full)', background: 'var(--brand-primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '12px'
                }}>
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>
              
              {dropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                  background: 'var(--bg-card)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-color)', minWidth: '180px', zIndex: 100, overflow: 'hidden'
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{user.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</div>
                  </div>
                  <Link to="/app" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Dashboard & Plans
                  </Link>
                  <Link to="/app/history" onClick={() => setDropdownOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
                    Shopping History
                  </Link>
                  <button 
                    onClick={() => { logout(); setDropdownOpen(false); }}
                    style={{
                      width: '100%', padding: '10px 16px', background: 'none', border: 'none', 
                      textAlign: 'left', cursor: 'pointer', fontSize: '13px', color: 'var(--error)',
                      borderTop: '1px solid var(--border-color)'
                    }}
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/auth" className="btn btn-primary" style={{
              fontSize: '11px', padding: '5px 12px', borderRadius: 'var(--radius-full)', fontWeight: 600, whiteSpace: 'nowrap'
            }}>
              Sign In
            </Link>
          )}
        </nav>
      </header>

      {/* ─── Mobile Search Dropdown Bar ─── */}
      {isMobile && mobileSearchOpen && (
        <div style={{
          background: 'var(--bg-card)',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          animation: 'fadeIn 0.2s ease',
          zIndex: 49,
          position: 'sticky',
          top: '60px'
        }}>
          <form onSubmit={handleSearchSubmit} style={{ position: 'relative', flex: 1 }}>
            <Search size={15} color="var(--text-tertiary)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              autoFocus
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products, brands, categories..." 
              style={{
                width: '100%', padding: '8px 12px 8px 36px', borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-color)', background: 'var(--bg-main)', fontSize: '13px',
                color: 'var(--text-primary)', outline: 'none'
              }} 
            />
          </form>
          <button
            type="button"
            onClick={() => setMobileSearchOpen(false)}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', padding: '4px 6px' }}
          >
            Cancel
          </button>
        </div>
      )}

      {/* ─── Main Content Outlet ─── */}
      <main style={{ flex: 1, paddingBottom: isMobile ? 'calc(68px + env(safe-area-inset-bottom, 0px))' : '0' }}>
        <Outlet />
      </main>

      {/* ─── Mobile Bottom Navigation Bar ─── */}
      {isMobile && (
        <nav 
          aria-label="Mobile Navigation"
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, 
            height: 'calc(58px + env(safe-area-inset-bottom, 0px))',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 40,
            backdropFilter: 'blur(8px)'
          }}
        >
          <Link to="/" style={{ color: location.pathname === '/' ? 'var(--brand-primary)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px', fontWeight: location.pathname === '/' ? 600 : 400 }}>
            <Home size={18} />
            <span>Home</span>
          </Link>
          <Link to="/search" style={{ color: location.pathname.startsWith('/search') ? 'var(--brand-primary)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px', fontWeight: location.pathname.startsWith('/search') ? 600 : 400 }}>
            <Search size={18} />
            <span>Explore</span>
          </Link>
          <Link to="/app/ask" style={{ color: location.pathname.startsWith('/app/ask') ? 'var(--brand-primary)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px', fontWeight: location.pathname.startsWith('/app/ask') ? 600 : 400 }}>
            <Sparkles size={18} />
            <span>Assistant</span>
          </Link>
          <Link to="/app/wishlist" style={{ color: location.pathname.startsWith('/app/wishlist') ? 'var(--brand-primary)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px', fontWeight: location.pathname.startsWith('/app/wishlist') ? 600 : 400 }}>
            <Heart size={18} />
            <span>Saved</span>
          </Link>
          <Link to={user ? "/app" : "/auth"} style={{ color: (location.pathname.startsWith('/app') && location.pathname !== '/app/ask' && location.pathname !== '/app/wishlist') ? 'var(--brand-primary)' : 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', textDecoration: 'none', fontSize: '11px', fontWeight: (location.pathname.startsWith('/app') && location.pathname !== '/app/ask' && location.pathname !== '/app/wishlist') ? 600 : 400 }}>
            <User size={18} />
            <span>{user ? 'Account' : 'Sign In'}</span>
          </Link>
        </nav>
      )}

      {/* ─── Premium Editorial Footer ─── */}
      <footer style={{ background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', padding: 'clamp(40px, 6vw, 64px) clamp(16px, 4vw, 48px) 32px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(140px, 40vw, 200px), 1fr))', gap: 'clamp(28px, 4vw, 48px)', marginBottom: '40px' }}>
          <div>
            <div style={{ marginBottom: '16px' }}>
              <SakhiLogo size={36} variant="full" />
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.7, maxWidth: '280px' }}>
              Redefining product discovery through intelligent personalization, thoughtful recommendations, and private-by-design architecture.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '16px', color: 'var(--success)', fontSize: '12px', fontWeight: 600 }}>
              <ShieldCheck size={16} /> Private & Encrypted by Design
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Explore</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/search?category=Fashion" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Fashion</Link>
              <Link to="/search?category=Electronics" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Electronics</Link>
              <Link to="/search?category=Home%20%26%20Living" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Home & Living</Link>
              <Link to="/search?category=Beauty" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Beauty</Link>
              <Link to="/search?category=Accessories" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Accessories</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Platform</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/app/ask" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>AI Shopping Assistant</Link>
              <Link to="/search" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Product Catalog</Link>
              <Link to="/app" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Personalized Plans</Link>
              <Link to="/app/wishlist" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Saved Wishlist</Link>
            </div>
          </div>

          <div>
            <h4 style={{ fontWeight: 600, fontSize: '13px', marginBottom: '16px', color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>About Our Mission</Link>
              <Link to="/faq" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Frequently Asked Questions</Link>
              <Link to="/about" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '13px' }}>Privacy & Security Architecture</Link>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingTop: '24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
            &copy; {new Date().getFullYear()} Meesho Sakhi. Built with intelligent personalization and end-to-end user privacy.
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            <Link to="/about" style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Privacy Policy</Link>
            <Link to="/about" style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
