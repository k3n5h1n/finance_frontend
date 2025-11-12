import React from 'react'
import './sidebar.css'

function SideBar() {
  return (
    <aside id='sidebar' className='sidebar'>
        <ul id='sidebar-nav' className='sidebar-nav'>
            <li className='nav-item'>
                <a className='nav-link' href='/'>
                    <i className="bi bi-grid"></i>
                    <span>Dashboard</span>
                </a>
            </li>
            <li className='nav-item'>
                <a 
                    className='nav-link collapsed'
                    data-bs-target='#components-nav'
                    data-bs-toggle='collapse'
                    href='#'
                >
                    <i className='bi bi-menu-button-wide'></i>
                    <span>Accounting</span>
                    <i className='bi bi-chevron-down ms-auto'></i>
                </a>
                <ul 
                    id="components-nav"
                    className='nav-content collapse'
                    data-bs-parent='#sidebar-nav'
                >
                    <li>
                        <a href='#'>
                            <i className='bi bi-circle'></i>
                            <span>Accounts</span>
                        </a>
                    </li>
                    <li>
                        <a href='#'>
                            <i className='bi bi-circle'></i>
                            <span>Transactions</span>
                        </a>
                    </li>
                </ul>


            </li>
        </ul>
    </aside>
  )
}

export default SideBar