// src/components/Logo.jsx

import React from 'react';
import './logo.css';

function Logo() {
    const toggleSideBar = () => {
        document.body.classList.toggle('toggle-sidebar');
    };

    return (
        <div className='d-flex align-items-center justify-content-between'>
            <a href='/' className='logo d-flex align-items-center'>
                {/* add logo image if desired <img src="" alt=""/> */}
                <span className='d-none d-lg-block'>Ace Money</span>
            </a>
            <i className='bi bi-list toggle-sidebar-btn'
                onClick={toggleSideBar}
            ></i>
        </div>
    );
}

export default Logo