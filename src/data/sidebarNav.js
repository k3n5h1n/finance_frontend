// src/data/sideBarNav.js
//
// Contains the hierarchical structure of the navigation
// TBD: Currently 2-levels may be specified.  Consider recursive later if needed.

const sideBarNav = [
  {
    label: "Dashboard",
    icon: "bi bi-grid",
    href: "/",
  },
  {
    label: "Accounting",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Transactions", icon: "bi bi-circle", href: "#" },
      { label: "Suppliers", icon: "bi bi-circle", href: "#" },
      { label: "Year-End", icon: "bi bi-circle", href: "#" },
      { label: "Audit", icon: "bi bi-circle", href: "#" },
    ],
  },
  {
    label: "Finances",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Budgets", icon: "bi bi-circle", href: "#" },
      { 
        label: "Financial Reports", 
        icon: "bi bi-circle", 
        href: "#",
        children: [
            {label: "Income Statement", href: "#"},
            {label: "Balance Sheet", href: "#"},
            {label: "Cashflow Statement", href: "#"},
        ] 
      },
      { label: "Utilities", icon: "bi bi-circle", href: "#" },
      { label: "Weather", icon: "bi bi-circle", href: "#" },
    ],
  },
  {
    label: "Investments",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Accounts", icon: "bi bi-circle", href: "#" },
      { label: "Shares", icon: "bi bi-circle", href: "#" },
      { label: "Allocation", icon: "bi bi-circle", href: "#" },
      { label: "Benchmarks", icon: "bi bi-circle", href: "#" },
      { label: "Re-Balance", icon: "bi bi-circle", href: "#" },
    ],
  },
  {
    label: "Retirement",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Scenarios", icon: "bi bi-circle", href: "#" },
      { label: "Life Stages", icon: "bi bi-circle", href: "#" },
      { label: "Indexes", icon: "bi bi-circle", href: "#" },
      { label: "Conditions", icon: "bi bi-circle", href: "#" },
    ],
  },
  {
    label: "Setup",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Organizations", icon: "bi bi-circle", href: "#" },
      { label: "People", icon: "bi bi-circle", href: "#" },
      { label: "Accounts", icon: "bi bi-circle", href: "#" },
      { label: "Taxes & Regulatory", icon: "bi bi-circle", href: "#" },
      { label: "Data Feeds", icon: "bi bi-circle", href: "#" },
    ],
  },
];

export default sideBarNav;
