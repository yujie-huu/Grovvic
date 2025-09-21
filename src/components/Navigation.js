import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  // 5 main destionations in nav bar
  const NAV_MAIN = [
    { label: 'Home', path: '/' },
    { label: 'Weather', path: '/weather' },
    { label: 'Garden', path: '/gardenplan' },
    { label: 'Sustain', path: '/sustain' },
    { label: 'Biodiversity', path: '/biodiversity' },
  ];

  // 8 total destionations in nav drawer
  const NAV_ALL = [
    ...NAV_MAIN,
    { label: 'About', path: '/about' },
    { label: 'Support', path: '/support' },
    { label: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          {/* Logo, link to home page */}
          <Link to={`/`} className="brand-link">
            <div className="logo">
              <img className="logo-icon" src="/images/team_logo_v4.png" alt="GROVVIC Logo" />
            </div>
            <span className="nav-brand-name">GROVVIC</span>
          </Link>
        </div>
        
        {/* Navigation Bar (Desktop Only) */}
        <div className="nav-menu">
          {NAV_MAIN.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
            >
              {item.label}
            </Link>
          ))}
        </div>
        
        {/* Hamberger Icon, opens drawer（Appear in all endpoint） */}
        <button
          className={`nav-drawer-btn ${drawerOpen ? 'active' : ''}`}
          onClick={() => setDrawerOpen(v => !v)}
          aria-label="Open navigation menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      {/* Navigation Drawer (all destinations) */}
      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer-panel" role="dialog" aria-modal="true">
            <div className="drawer-header">
              <span className="drawer-title">Menu</span>
              <button className="drawer-close" onClick={() => setDrawerOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="drawer-links">
              {NAV_ALL.map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`drawer-link ${isActive(item.path) ? 'active' : ''}`}
                  onClick={() => setDrawerOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </aside>
        </>
      )}
    </nav>
  );
};

export default Navigation; 