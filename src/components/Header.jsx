// src/components/Header.jsx

import React from 'react';
import './header.css';
import Logo from './Logo';

function Header() {
  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <Logo />
      <i
        className="bi bi-moon-fill theme-toggle-btn"
        title="Toggle light/dark theme"
        onClick={toggleTheme}
      ></i>
    </header>
  );
}

export default Header;
