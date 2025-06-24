import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

interface NavbarProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">        <Link to="/" className="navbar-logo">
          <span className="logo-icon">🚗</span>
          <span className="logo-text">Auto Explorador</span>
        </Link>

        {/* Botón para menú móvil */}
        <div 
          className={`mobile-menu-button ${mobileMenuOpen ? 'active' : ''}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <span></span>
          <span></span>
          <span></span>
        </div>        {/* Menú de navegación */}        <div className={`navbar-menu ${mobileMenuOpen ? 'active' : ''}`}>          <ul className="nav-items">
            <li className={location.pathname === '/' ? 'active' : ''}>
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Dashboard
              </Link>
            </li>
            <li>
              <button 
                className="theme-toggle-nav" 
                onClick={toggleDarkMode}
                aria-label={darkMode ? "Activar modo claro" : "Activar modo oscuro"}
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
