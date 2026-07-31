// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import navigation elements
import Header from './components/Header'
import SideBar from './components/SideBar'
import { OrganizationProvider, useOrganization } from './context/OrganizationContext';

// Import pages
// TBD: import Dashboard from './pages/Dashboard'
import OrganizationsList from './pages/organizations/OrganizationsList';
import PeopleList from './pages/people/PeopleList';
import AccountsList from './pages/accounts/AccountsList';
import ResourcesList from './pages/resources/ResourcesList';
import SuppliersList from './pages/suppliers/SuppliersList';
import EventsList from './pages/events/EventsList';
import EventWorkspace from './pages/events/EventWorkspace';
import AccountHistory from './pages/accounts/AccountHistory';
import IncomeStatement from './pages/reports/IncomeStatement';
import BalanceSheet from './pages/reports/BalanceSheet';
import InventoryOnHand from './pages/reports/InventoryOnHand';

// import project styles
import './styles/variables.css';
import './App.css'

function AppLayout() {
  const { selectedOrganizationId, loading, loadError, organizations } =
    useOrganization();

  return (
    <>
      <Header />
      <SideBar />
      <main id="main" className="main">
        {loading ? (
          <p className="p-4">Loading organization...</p>
        ) : (
          <>
            {loadError && (
              <div className="alert alert-danger mx-4 mt-3" role="alert">
                {loadError}
              </div>
            )}
            {!loadError &&
              organizations.length === 0 &&
              selectedOrganizationId == null && (
                <div className="alert alert-warning mx-4 mt-3" role="alert">
                  No organizations found. Add one under Setup → Organizations.
                </div>
              )}
            <Routes key={selectedOrganizationId ?? "none"}>
              <Route path="/setup/organizations" element={<OrganizationsList />} />
              <Route path="/setup/people" element={<PeopleList />} />
              <Route path="/setup/accounts" element={<AccountsList />} />
              <Route path="/setup/resources" element={<ResourcesList />} />
              <Route path="/accounting/suppliers" element={<SuppliersList />} />
              <Route path="/accounting/events" element={<EventsList />} />
              <Route path="/accounting/events/:eventId" element={<EventWorkspace />} />
              <Route path="/accounting/account-history" element={<AccountHistory />} />
              <Route path="/accounting/reports/income-statement" element={<IncomeStatement />} />
              <Route path="/accounting/reports/balance-sheet" element={<BalanceSheet />} />
              <Route path="/accounting/reports/inventory" element={<InventoryOnHand />} />
              <Route
                path="*"
                element={<div className="p-4">Welcome to the dashboard</div>}
              />
            </Routes>
          </>
        )}
      </main>
    </>
  );
}

// Application declaration
function App() {
  return (
    <Router>
      <OrganizationProvider>
        <AppLayout />
      </OrganizationProvider>
    </Router>
  )
}

export default App
