import React from 'react';

/**
 * SakhiLogo - Official Brand Logo for Sakhi
 * Authentic identity provided by the user:
 * - 3D Dimensional Sapphire Shopping Bag with white guidance sparkle
 * - Distinctive "Sakhi" wordmark with cyan dot on the 'i'
 * - "Smarter Shopping. Just for You." tagline
 * 
 * Supports:
 * - variant="full" (default): Renders the complete brand logo, auto-switching for light & dark themes
 * - variant="icon": Renders just the shopping bag emblem with the star
 */
export default function SakhiLogo({ 
  size = 40, 
  variant = 'full', 
  style = {} 
}) {
  if (variant === 'icon') {
    return (
      <img
        src="/sakhi-brand-icon.png"
        alt="Sakhi"
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          flexShrink: 0,
          display: 'block',
          transition: 'transform var(--transition-fast)',
          filter: 'drop-shadow(0 2px 6px rgba(36, 84, 144, 0.16))',
          ...style
        }}
        className="sakhi-logo-icon"
      />
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        position: 'relative',
        transition: 'transform var(--transition-fast)',
        ...style
      }}
      className="sakhi-logo-full-wrap"
      title="Sakhi — Smarter Shopping. Just for You."
    >
      {/* Light Mode Full Logo */}
      <img
        src="/sakhi-brand-full.png"
        alt="Sakhi — Smarter Shopping. Just for You."
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'var(--logo-light-display, block)'
        }}
        className="sakhi-logo-light"
      />
      {/* Dark Mode Full Logo */}
      <img
        src="/sakhi-brand-full-dark.png"
        alt="Sakhi — Smarter Shopping. Just for You."
        style={{
          height: `${size}px`,
          width: 'auto',
          objectFit: 'contain',
          display: 'var(--logo-dark-display, none)'
        }}
        className="sakhi-logo-dark"
      />
    </div>
  );
}
