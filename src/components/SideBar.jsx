import React from 'react'
import './sidebar.css'
import sideBarNav from "../data/sidebarNav";


function SideBarNavItem({ item, depth = 0, parentId = "sidebar-nav" }) {
  const hasChildren = item.children && item.children.length > 0;
  const collapseId = `nav-collapse-${item.label.replace(/\s+/g, "-").toLowerCase()}-${depth}`;

  return (
    <li className="nav-item">
      <a
        className={`nav-link ${hasChildren ? "collapsed" : ""}`}
        href={hasChildren ? "#" : item.href}
        {...(hasChildren
          ? { "data-bs-toggle": "collapse", "data-bs-target": `#${collapseId}` }
          : {})}
      >
        {item.icon && <i className={item.icon}></i>}
        <span>{item.label}</span>
        {hasChildren && <i className="bi bi-chevron-down ms-auto"></i>}
      </a>

      {hasChildren && (
        <ul
          id={collapseId}
          className="nav-content collapse"
          data-bs-parent={`#${parentId}`}   // 👈 reference only the current parent
        >
          {item.children.map((child, idx) => (
            <SideBarNavItem
              key={idx}
              item={child}
              depth={depth + 1}
              parentId={collapseId}         // 👈 new parent scope for children
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SideBar() {
  return (
    <aside id="sidebar" className="sidebar">
      <ul id="sidebar-nav" className="sidebar-nav">
        {sideBarNav.map((item, idx) => (
          <SideBarNavItem key={idx} item={item} />
        ))}
      </ul>
    </aside>
  );
}
