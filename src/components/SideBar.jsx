import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./sidebar.css";
import sideBarNav from "../data/sidebarNav";

function SideBarNavItem({ item, depth = 0, parentId = "sidebar-nav" }) {
  const location = useLocation();
  const hasChildren = item.children && item.children.length > 0;
  const collapseId = `nav-collapse-${item.label.replace(/\s+/g, "-").toLowerCase()}-${depth}`;
  const isActive = !hasChildren && item.href === location.pathname;

  const label = (
    <>
      {item.icon && <i className={item.icon}></i>}
      <span>{item.label}</span>
      {hasChildren && <i className="bi bi-chevron-down ms-auto"></i>}
    </>
  );

  return (
    <li className="nav-item">
      {hasChildren ? (
        <a
          className="nav-link collapsed"
          href="#"
          data-bs-toggle="collapse"
          data-bs-target={`#${collapseId}`}
        >
          {label}
        </a>
      ) : item.href && item.href !== "#" ? (
        <Link className={`nav-link${isActive ? " active" : ""}`} to={item.href}>
          {label}
        </Link>
      ) : (
        <a className="nav-link" href="#">
          {label}
        </a>
      )}

      {hasChildren && (
        <ul
          id={collapseId}
          className="nav-content collapse"
          data-bs-parent={`#${parentId}`}
        >
          {item.children.map((child, idx) => (
            <SideBarNavItem
              key={idx}
              item={child}
              depth={depth + 1}
              parentId={collapseId}
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
