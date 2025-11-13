// App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import navigation elements
import Header from './components/Header'
import SideBar from './components/SideBar'

// Import pages
// TBD: import Dashboard from './pages/Dashboard'
import OrganizationsList from './pages/organizations/OrganizationsList';
import PeopleList from './pages/people/PeopleList';

// import project styles
import './styles/variables.css';
import './App.css'

// Application declaration
function App() {
  return (
    <Router>
      <Header />
      <SideBar />
      <main id="main" className="main">
        <Routes>
          {/* Add your routes here */}
          <Route path="/setup/organizations" element={<OrganizationsList />} />
          <Route path="/setup/people" element={<PeopleList />} />
          {/* You can add default or placeholder routes below */}
          <Route path="*" element={<div className="p-4">Welcome to the dashboard</div>} />
        </Routes>
      </main>
    </Router>
  )
}

export default App
