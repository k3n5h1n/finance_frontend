// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';

// ✅ Import global styles (order matters)
import 'bootstrap/dist/css/bootstrap.min.css';     // Bootstrap base styles
import 'bootstrap-icons/font/bootstrap-icons.css'; // Optional icon set
import 'remixicon/fonts/remixicon.css';            // Optional icon set

// ✅ Your custom project styles (load after Bootstrap)
import './styles/variables.css';
import './App.css';

// ✅ Bootstrap JS bundle (for modals, dropdowns, etc.)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
