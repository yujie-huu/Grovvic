import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Extract current version from path
  const getCurrentVersion = () => {
    const path = location.pathname;
    if (path.startsWith('/iteration2')) return 'iteration2';
    if (path.startsWith('/iteration1')) return 'iteration1';
    return 'iteration2'; // default to iteration2
  };

  const currentVersion = getCurrentVersion();

  const isActive = (path) => {
    const versionedPath = path === '/' ? `/${currentVersion}` : `/${currentVersion}${path}`;
    return location.pathname === versionedPath;
  };

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to={`/${currentVersion}`} className="brand-link">
            <div className="logo">
              <div className="logo-icon">♻️</div>
            </div>
            <span className="nav-brand-name">VIGROW</span>
          </Link>
        </div>
        
        <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          <Link to={`/${currentVersion}`} className={`nav-link ${isActive('/') ? 'active' : ''}`}>
            Home
          </Link>
          <Link to={`/${currentVersion}/about`} className={`nav-link ${isActive('/about') ? 'active' : ''}`}>
            About
          </Link>
          <Link to={`/${currentVersion}/weather`} className={`nav-link ${isActive('/weather') ? 'active' : ''}`}>
            Weather
          </Link>
          <Link to={`/${currentVersion}/gardenplan`} className={`nav-link ${isActive('/gardenplan') ? 'active' : ''}`}>
            Garden
          </Link>

          <Link to={`/${currentVersion}/sustain`} className={`nav-link ${isActive('/sustain') ? 'active' : ''}`}>
            Sustain
          </Link>
          <Link to={`/${currentVersion}/biodiversity`} className={`nav-link ${isActive('/biodiversity') ? 'active' : ''}`}>
            Biodiversity
          </Link>       
          <Link to={`/${currentVersion}/support`} className={`nav-link ${isActive('/support') ? 'active' : ''}`}>
            Support
          </Link>
          <Link to={`/${currentVersion}/contact`} className={`nav-link ${isActive('/contact') ? 'active' : ''}`}>
            Contact
          </Link>           
        </div>
        
        <div className={`nav-toggle ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 