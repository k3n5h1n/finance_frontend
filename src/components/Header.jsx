// src/components/Header.jsx

import './header.css';
import Logo from './Logo';
import { useOrganization } from '../context/OrganizationContext';

function Header() {
  const {
    organizations,
    selectedOrganizationId,
    setSelectedOrganizationId,
    loading,
  } = useOrganization();

  const toggleTheme = () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    document.documentElement.setAttribute('data-bs-theme', newTheme);
  };

  return (
    <header id="header" className="header fixed-top d-flex align-items-center">
      <Logo />
      <div className="header-controls ms-auto d-flex align-items-center">
        <i
          className="bi bi-moon-fill theme-toggle-btn"
          title="Toggle light/dark theme"
          onClick={toggleTheme}
        ></i>
        <select
          className="form-select form-select-sm org-selector"
          aria-label="Organization"
          value={selectedOrganizationId ?? ''}
          onChange={(e) => setSelectedOrganizationId(Number(e.target.value))}
          disabled={loading || organizations.length === 0}
        >
          {loading ? (
            <option value="">Loading...</option>
          ) : organizations.length === 0 ? (
            <option value="">No organizations</option>
          ) : (
            organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))
          )}
        </select>
      </div>
    </header>
  );
}

export default Header;
