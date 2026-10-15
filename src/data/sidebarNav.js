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
      { label: "Transactions", icon: "bi bi-circle", href: "/accounting/events" },
      { label: "Account History", icon: "bi bi-circle", href: "/accounting/account-history" },
      { label: "Income Statement", icon: "bi bi-circle", href: "/accounting/reports/income-statement" },
      { label: "Balance Sheet", icon: "bi bi-circle", href: "/accounting/reports/balance-sheet" },
      { label: "Suppliers", icon: "bi bi-circle", href: "/accounting/suppliers" },
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
            {label: "Income Statement", href: "/accounting/reports/income-statement"},
            {label: "Balance Sheet", href: "/accounting/reports/balance-sheet"},
            {label: "Cashflow Statement", href: "#"},
        ] 
      },
      {
        label: "Inventory",
        icon: "bi bi-circle",
        href: "#",
        children: [
          { label: "On-Hand", href: "/accounting/reports/inventory" },
        ],
      },
      { label: "Utilities", icon: "bi bi-circle", href: "#" },
      { label: "Weather", icon: "bi bi-circle", href: "#" },
    ],
  },
  {
    label: "Investing",
    icon: "bi bi-menu-button-wide",
    children: [
      { label: "Investments", icon: "bi bi-circle", href: "/investing/investments" },
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
      { label: "Organizations", icon: "bi bi-circle", href: "/setup/organizations" },
      { label: "People", icon: "bi bi-circle", href: "/setup/people" },
      { label: "Accounts", icon: "bi bi-circle", href: "/setup/accounts" },
      { label: "Resources", icon: "bi bi-circle", href: "/setup/resources" },
      { label: "Taxes & Regulatory", icon: "bi bi-circle", href: "#" },
      { label: "External Data", icon: "bi bi-circle", href: "/setup/external-data" },
    ],
  },
];

export default sideBarNav;
